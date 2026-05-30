import { neon } from '@neondatabase/serverless';

const connectionString = process.env.NEON_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or NEON_DB_URL is not defined in the environment variables.');
}

export const sql = neon(connectionString);
