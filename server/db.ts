import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Database URL from environment
const databaseUrl = process.env.DATABASE_URL;

// Create database connection with error handling
let sql: any = null;
let db: any = null;
let migrationPromise: Promise<void> | null = null;

if (databaseUrl) {
  try {
    console.log("🔗 Attempting to connect to PostgreSQL database...");
    console.log(`📊 Database URL: ${databaseUrl.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs
    
    // Use postgres-js driver for standard PostgreSQL connections
    console.log("🐘 Using postgres-js driver for PostgreSQL");
    
    // Create connection with postgres-js
    sql = postgres(databaseUrl, {
      max: 10, // Maximum number of connections
      idle_timeout: 20,
      connect_timeout: 10,
    });
    
    db = drizzle(sql, { schema });
    console.log("✅ PostgreSQL connection initialized successfully");
    
    // Start migrations in the background
    migrationPromise = runMigrations();
    
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    sql = null;
    db = null;
  }
} else {
  console.warn("⚠️ DATABASE_URL not set. Using in-memory storage.");
  console.warn("💡 To enable persistent storage, set DATABASE_URL in your environment");
}

// Function to run migrations
async function runMigrations(): Promise<void> {
  if (!db) {
    console.warn("⚠️ Cannot run migrations: database not available");
    return;
  }
  
  try {
    console.log("🔄 Running database migrations...");
    await migrate(db, { migrationsFolder: './migrations' });
    console.log("✅ Database migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    // Don't throw here to prevent app crash, just log the error
  }
}

// Function to ensure migrations are complete
export async function ensureMigrationsComplete(): Promise<void> {
  if (migrationPromise) {
    await migrationPromise;
  }
}

// Log database status
if (db) {
  console.log("✅ PostgreSQL database connection ready");
} else if (databaseUrl) {
  console.warn("⚠️ Database URL provided but connection failed. Using in-memory storage.");
  console.warn("💡 This might be because the database server is not running or the URL is incorrect");
} else {
  console.warn("⚠️ DATABASE_URL not set. Using in-memory storage.");
}

// Export the database instance (can be null)
export { sql, db };

// Export a function to check if database is available
export function isDatabaseAvailable(): boolean {
  return db !== null;
}
