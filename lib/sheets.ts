import { google, sheets_v4 } from 'googleapis';
import type { DeviceRecord } from '@/types';

const HEADERS = ['Timestamp', 'UUID', 'Serial', 'Diag', 'Back Market', 'RMS', 'Battery', 'Routing', 'Wholesale Reason'];

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
    record.diag === null ? '' : record.diag ? 'Yes' : 'No',
    record.backMarket === null ? '' : record.backMarket ? 'Yes' : 'No',
    record.rms === null ? '' : record.rms ? 'Yes' : 'No',
    record.battery === null ? '' : record.battery ? 'Yes' : 'No',
    record.routing,
    record.wholesaleReason ?? '',
  ];

  // Ensure both sheets exist (creates them with headers if missing)
  await Promise.all([
    ensureSheet(api, spreadsheetId, 'Intake'),
    ensureSheet(api, spreadsheetId, record.routing),
  ]);

  // Append to main Intake log and to the routing-specific sheet
  await Promise.all([
    api.spreadsheets.values.append({
      spreadsheetId,
      range: 'Intake!A:I',
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    }),
    api.spreadsheets.values.append({
      spreadsheetId,
      range: `${record.routing}!A:I`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    }),
  ]);
}
