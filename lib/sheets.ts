import { google, sheets_v4 } from 'googleapis';
import type { DeviceRecord } from '@/types';

const HEADERS = ['Timestamp', 'UUID', 'Serial', 'Bricked', 'Diag', 'Back Market', 'RMS', 'Battery', 'Routing', 'Wholesale Reason'];
const UUID_COL = 1; // 0-indexed — UUID is column B

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
): Promise<number | null> {
  const { data } = await api.spreadsheets.get({ spreadsheetId });
  const sheet = data.sheets?.find((s) => s.properties?.title === sheetName);

  if (!sheet) {
    await api.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      },
    });
    await api.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
    return null; // brand new sheet — no existing UUID to find
  }

  // Sheet exists — check if row 1 has headers; if not, add them
  const headerCheck = await api.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:J1`,
  });
  const firstRow = headerCheck.data.values?.[0];
  if (!firstRow || firstRow[0] !== 'Timestamp') {
    // Insert a header row at position 1
    await api.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          insertDimension: {
            range: { sheetId: sheet.properties!.sheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
            inheritFromBefore: false,
          },
        }],
      },
    });
    await api.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
  }

  return sheet.properties?.sheetId ?? null;
}

// Returns the 1-based row number of an existing UUID, or null if not found
async function findExistingRow(
  api: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string,
  uuid: string
): Promise<number | null> {
  const res = await api.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:J`,
  });
  const rows = res.data.values ?? [];
  for (let i = 1; i < rows.length; i++) { // skip header row (index 0)
    if (rows[i][UUID_COL] === uuid) return i + 1; // 1-based
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
  const existingRow = await findExistingRow(api, spreadsheetId, sheetName, uuid);

  if (existingRow !== null) {
    // Update in place
    await api.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${existingRow}:J${existingRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
  } else {
    // Append new row
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

  // Ensure both sheets exist and have headers
  await Promise.all([
    ensureSheet(api, spreadsheetId, 'Intake'),
    ensureSheet(api, spreadsheetId, record.routing),
  ]);

  // Upsert: update existing row if UUID found, otherwise append
  await Promise.all([
    upsertRow(api, spreadsheetId, 'Intake', record.uuid, row),
    upsertRow(api, spreadsheetId, record.routing, record.uuid, row),
  ]);
}
