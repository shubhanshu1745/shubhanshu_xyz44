import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from "@shared/schema";

// Fallback for development if DATABASE_URL is not provided
const databaseUrl = process.env.DATABASE_URL;

export const sql = databaseUrl ? neon(databaseUrl) : null;
export const db = sql ? drizzle(sql, { schema }) : null;

if (!databaseUrl) {
  console.warn("DATABASE_URL not set. Database features will be disabled.");
}
