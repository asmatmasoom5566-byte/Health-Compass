/**
 * Migration: Create tables for causes and pharmacology data
 */

import { db, pool } from './server/db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('🚀 Starting database migration...');

  try {
    // Create pharmacology table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pharmacology (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Pharmacology table created');

    // Create patient_records table  
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS patient_records (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Patient records table created');

    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
