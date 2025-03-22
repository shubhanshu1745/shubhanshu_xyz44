const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  console.log('MySQL Database Setup Script');
  console.log('---------------------------');
  
  // Database connection configuration
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };
  
  console.log(`Connecting to MySQL server at ${config.host}...`);
  
  try {
    // Connect to MySQL server (without specifying a database)
    const connection = await mysql.createConnection(config);
    console.log('Connected to MySQL server');
    
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'cricsocial';
    console.log(`Creating database "${dbName}" if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`Database "${dbName}" is ready`);
    
    // Use the database
    await connection.query(`USE ${dbName}`);
    
    // Read and execute the SQL migration file
    console.log('Executing database schema migration...');
    const sqlMigration = fs.readFileSync('./drizzle/migrations/initial-schema.sql', 'utf8');
    await connection.query(sqlMigration);
    console.log('Schema migration completed successfully');
    
    // Close the connection
    await connection.end();
    console.log('Database setup completed successfully');
    
  } catch (error) {
    console.error('Error setting up the database:', error);
    process.exit(1);
  }
}

main();