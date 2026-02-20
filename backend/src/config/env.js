import dotenv from 'dotenv';

dotenv.config();

const requiredVars = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
  'GOOGLE_SHEETS_ID',
  'GOOGLE_SHEETS_SHEET_NAME',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Отсутствует обязательная env-переменная: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: process.env.FRONTEND_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  googleSheetsId: process.env.GOOGLE_SHEETS_ID,
  googleSheetsSheetName: process.env.GOOGLE_SHEETS_SHEET_NAME,
  googleServiceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  googleServiceAccountPrivateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
  sheetsMatchBy: process.env.SHEETS_MATCH_BY || 'email',
  sheetsColumnEmail: process.env.SHEETS_COLUMN_EMAIL || 'email',
  sheetsColumnPhone: process.env.SHEETS_COLUMN_PHONE || 'phone',
  sheetsColumnMarketplace: process.env.SHEETS_COLUMN_MARKETPLACE || 'marketplace',
};
