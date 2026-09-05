import process from 'node:process';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();

if (!databaseUrl) {
  console.error('DATABASE_URL is required. Set a postgresql:// URL in the deployment environment.');
  process.exit(1);
}

if (/^file:/i.test(databaseUrl)) {
  console.log('DATABASE_URL validated for SQLite.');
  process.exit(0);
}

if (/^(postgres|postgresql):\/\//i.test(databaseUrl)) {
  console.log('DATABASE_URL validated for PostgreSQL.');
  process.exit(0);
}

console.error('Invalid DATABASE_URL. Use file:... for local SQLite or postgresql://... for production.');
process.exit(1);