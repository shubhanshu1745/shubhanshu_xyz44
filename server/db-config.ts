import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { MemStorage } from './storage';

// Default to memory storage
export const storage = new MemStorage();

// MySQL connection configuration
export const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cricsocial',
};

// Initialize database connection
export async function initializeDatabase() {
  if (process.env.USE_MYSQL === 'true') {
    try {
      console.log('Attempting to connect to MySQL database...');
      
      // Create connection pool
      const pool = mysql.createPool({
        host: mysqlConfig.host,
        user: mysqlConfig.user,
        password: mysqlConfig.password,
        database: mysqlConfig.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      
      // Test connection
      await pool.query('SELECT 1');
      console.log('Successfully connected to MySQL database');
      
      // Initialize Drizzle ORM
      const db = drizzle(pool);
      return db;
    } catch (error) {
      console.error('Failed to connect to MySQL:', error);
      console.log('Falling back to in-memory storage');
      return null;
    }
  }
  console.log('Using in-memory storage (USE_MYSQL is not set to true)');
  return null;
}