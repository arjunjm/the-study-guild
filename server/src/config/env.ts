import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  port: parseInt(optional('PORT', '3001'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),
  azure: {
    tenantId: optional('AZURE_TENANT_ID'),
    clientId: optional('AZURE_CLIENT_ID'),
    clientSecret: optional('AZURE_CLIENT_SECRET'),
  },
  cosmos: {
    endpoint: optional('COSMOS_ENDPOINT'),
    key: optional('COSMOS_KEY'),
    database: optional('COSMOS_DATABASE', 'study-guild'),
  },
  isDev: optional('NODE_ENV', 'development') === 'development',
};
