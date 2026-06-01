import { google, sheets_v4 } from 'googleapis';
import type { DeviceRecord, RoutingDestination } from '@/types';

const HEADERS = ['Timestamp', 'UUID', 'Serial', 'Is the device bricked?', 'Did it pass diagnostics?', 'Did it pass RMS check?', 'Is it Back Market resalable?', 'Is the battery good?', 'Routing', 'Wholesale Reason', 'BM Grade'];
const UUID_COL = 1; // column B, 0-indexed
const ALL_ROUTING_SHEETS: RoutingDestination[] = [
  'Wholesale',
  'RMS Quarantine',
  'Battery Replacement',
  'Internal Resale',
];

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY
        ?.replace(/^"|"$/g, '')
        ?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function ensureSheet(
  api: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string
): Promise<void> {
  const { data } = await api.spreadsheets.get({ spreadsheetId });
  const exists = data.sheets?.some((s) => s.properties?.title === sheetName);

  if (!exists) {
    await api.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
    });
    await api.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
    return;
  }

  // Sheet exists — fix headers if wrong
  const { data: rowData } = await api.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:K1`,
  });
  const row1 = rowData.values?.[0] ?? [];
  const headersOk = HEADERS.every((h, i) => row1[i] === h);

  if (!headersOk) {
    await api.spreadsheets.values.clear({ spreadsheetId, range: `${sheetName}!1:1` });
    await api.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
  }
}

// Returns 1-based row number if UUID found in column B, else null
async function findUUIDRow(
  api: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
  uuid: string
): Promise<number | null> {
  const { data } = await api.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!B:B`,
  });
  const col = data.values ?? [];
  for (let i = 1; i < col.length; i++) {
    if (col[i]?.[0] === uuid) return i + 1;
  }
  return null;
}

// Scans all routing sheets to find which one currently holds this UUID
async function findCurrentRoutingSheet(
  api: sheets_v4.Sheets,
  spreadsheetId: string,
  uuid: string
): Promise<{ sheetName: RoutingDestination; rowNumber: number; sheetId: number } | null> {
  const { data } = await api.spreadsheets.get({ spreadsheetId });

  for (const sheetName of ALL_ROUTING_SHEETS) {
    const sheet = data.sheets?.find((s) => s.properties?.title === sheetName);
    if (!sheet) continue;

    const rowNumber = await findUUIDRow(api, spreadsheetId, sheetName, uuid);
    if (rowNumber !== null) {
      return {
        sheetName,
        rowNumber,
        sheetId: sheet.properties?.sheetId ?? 0,
      };
    }
  }
  return null;
}

async function deleteRow(
  api: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetId: number,
  rowNumber: number // 1-based
): Promise<void> {
  await api.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowNumber - 1, // 0-based inclusive
            endIndex: rowNumber,       // 0-based exclusive
          },
        },
      }],
    },
  });
}

async function upsertIntake(
  api: sheets_v4.Sheets,
  spreadsheetId: string,
  uuid: string,
  row: string[]
): Promise<void> {
  const existingRow = await findUUIDRow(api, spreadsheetId, 'Intake', uuid);
  if (existingRow !== null) {
    await api.spreadsheets.values.update({
      spreadsheetId,
      range: `Intake!A${existingRow}:K${existingRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
  } else {
    await api.spreadsheets.values.append({
      spreadsheetId,
      range: 'Intake!A:K',
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
  }
}

export async function appendDeviceRecord(record: DeviceRecord): Promise<void> {
  const auth = getAuth();
  const api = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

  const row = [
    record.timestamp,
    record.uuid,
    record.serial,
    record.bricked === null ? '' : record.bricked ? 'Yes' : 'No',
    record.diag === null ? '' : record.diag ? 'Yes' : 'No',
    record.backMarket === null ? '' : record.backMarket ? 'Yes' : 'No',
    record.rms === null ? '' : record.rms ? 'Yes' : 'No',
    record.battery === null ? '' : record.battery ? 'Yes' : 'No',
    record.routing,
    record.wholesaleReason ?? '',
    record.backMarketGrade ?? '',
  ];

  // Ensure target sheets exist with correct headers
  await ensureSheet(api, spreadsheetId, 'Intake');
  await ensureSheet(api, spreadsheetId, record.routing);

  // Find where this UUID currently lives in routing sheets
  const current = await findCurrentRoutingSheet(api, spreadsheetId, record.uuid);

  // Always upsert Intake (master log)
  await upsertIntake(api, spreadsheetId, record.uuid, row);

  if (current === null) {
    // New device — append to routing sheet
    await api.spreadsheets.values.append({
      spreadsheetId,
      range: `${record.routing}!A:K`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
  } else if (current.sheetName === record.routing) {
    // Same routing — update in place
    await api.spreadsheets.values.update({
      spreadsheetId,
      range: `${record.routing}!A${current.rowNumber}:J${current.rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
  } else {
    // Routing changed — delete from old sheet, append to new sheet
    await deleteRow(api, spreadsheetId, current.sheetId, current.rowNumber);
    await api.spreadsheets.values.append({
      spreadsheetId,
      range: `${record.routing}!A:K`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
  }
}
