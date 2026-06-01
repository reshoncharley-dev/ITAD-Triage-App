import { google, sheets_v4 } from 'googleapis';
import type { DeviceRecord } from '@/types';

const HEADERS = ['Timestamp', 'UUID', 'Serial', 'Bricked', 'Diag', 'Back Market', 'RMS', 'Battery', 'Routing', 'Wholesale Reason'];
const UUID_COL = 1; // column B, 0-indexed

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

  // Sheet exists — verify row 1 is exactly our header
  const { data: rowData } = await api.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:J1`,
  });
  const row1 = rowData.values?.[0] ?? [];
  const headersOk = HEADERS.every((h, i) => row1[i] === h);

  if (!headersOk) {
    // Clear the entire first row then write correct headers
    await api.spreadsheets.values.clear({ spreadsheetId, range: `${sheetName}!1:1` });
    await api.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
  }
}

async function findUUIDRow(
  api: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
  uuid: string
): Promise<number | null> {
  const { data } = await api.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!B:B`, // scan UUID column only
  });
  const col = data.values ?? [];
  for (let i = 1; i < col.length; i++) { // row 0 is header
    if (col[i]?.[0] === uuid) return i + 1; // 1-based row number
  }
  return null;
}

async function upsertRow(
  api: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
  uuid: string,
  row: string[]
): Promise<void> {
  const existingRow = await findUUIDRow(api, spreadsheetId, sheetName, uuid);

  if (existingRow !== null) {
    await api.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${existingRow}:J${existingRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
  } else {
    await api.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:J`,
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
  ];

  // Sequential — avoid any race conditions between sheet operations
  await ensureSheet(api, spreadsheetId, 'Intake');
  await ensureSheet(api, spreadsheetId, record.routing);
  await upsertRow(api, spreadsheetId, 'Intake', record.uuid, row);
  await upsertRow(api, spreadsheetId, record.routing, record.uuid, row);
}
