import { google } from 'googleapis';
import type { DeviceRecord } from '@/types';

export async function appendDeviceRecord(record: DeviceRecord): Promise<void> {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY
        ?.replace(/^"|"$/g, '')   // strip accidental surrounding quotes
        ?.replace(/\\n/g, '\n'),  // literal \n → actual newlines
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const row = [
    record.timestamp,
    record.uuid,
    record.serial,
    record.diag === null ? '' : record.diag ? 'Yes' : 'No',
    record.backMarket === null ? '' : record.backMarket ? 'Yes' : 'No',
    record.rms === null ? '' : record.rms ? 'Yes' : 'No',
    record.battery === null ? '' : record.battery ? 'Yes' : 'No',
    record.routing,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sheet1!A:H',
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
}
