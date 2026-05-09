import dotenv from 'dotenv';
dotenv.config();

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Get database URL from environment variable
const DATABASE_URL = process.env.DATABASE_URL;

let dbInstance: any = null;

if (!DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL not found in .env file');
  console.warn('💡 Add your Neon PostgreSQL connection string to .env');
  console.warn('💡 Format: DATABASE_URL=postgresql://user:pass@host/db');
  console.warn('💡 Using in-memory storage as fallback');
} else {
  try {
    // Create database connection using Neon serverless driver
    const sql = neon(DATABASE_URL);

    // Initialize Drizzle ORM with the Neon connection
    dbInstance = drizzle(sql);
    
    console.log('✅ Connected to Neon PostgreSQL database');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    console.warn('💡 Using in-memory storage as fallback');
  }
}

export { dbInstance as db };
