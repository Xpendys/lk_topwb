import { google } from 'googleapis';
import { env } from '../config/env.js';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: env.googleServiceAccountEmail,
    private_key: env.googleServiceAccountPrivateKey,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

function toObjectRow(header, row) {
  return header.reduce((acc, key, index) => {
    acc[key] = row[index] ?? '';
    return acc;
  }, {});
}

export async function getUserStats({ email, phone }) {
  const range = `${env.googleSheetsSheetName}!A:ZZ`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.googleSheetsId,
    range,
  });

  const values = response.data.values || [];
  if (values.length < 2) {
    return [];
  }

  const [header, ...rows] = values;
  const normalizedHeader = header.map((col) => String(col).trim().toLowerCase());
  const objects = rows.map((row) => toObjectRow(normalizedHeader, row));

  const emailColumn = env.sheetsColumnEmail.toLowerCase();
  const phoneColumn = env.sheetsColumnPhone.toLowerCase();

  const filtered = objects.filter((item) => {
    if (env.sheetsMatchBy === 'phone') {
      return String(item[phoneColumn] || '').trim() === phone;
    }

    if (env.sheetsMatchBy === 'email_or_phone') {
      return (
        String(item[emailColumn] || '').trim().toLowerCase() === email.toLowerCase() ||
        String(item[phoneColumn] || '').trim() === phone
      );
    }

    return String(item[emailColumn] || '').trim().toLowerCase() === email.toLowerCase();
  });

  return filtered;
}
