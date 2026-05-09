/**
 * Simple import script for your data
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// DATABASE_URL
const DATABASE_URL = 'postgresql://neondb_owner:npg_9dHSn1LNuQOs@ep-misty-waterfall-ao0wc9kj.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(pool);

async function importData() {
  console.log('🚀 Starting data import...\n');

  try {
    // Create tables if they don't exist
    console.log('📊 Creating tables...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pharmacology (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Pharmacology table ready');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS patient_records (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Patient records table ready');

    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_plain TEXT
    `);
    console.log('  ✅ Password column ready');

    // Import Pharmacology from your actual data
    console.log('\n💊 Importing pharmacology...');
    const pharmaPath = 'C:/Users/imran/Downloads/pharmacology-export-2026-05-03.json';
    const pharmaData = JSON.parse(readFileSync(pharmaPath, 'utf-8'));
    
    if (pharmaData.medicines && Array.isArray(pharmaData.medicines)) {
      await db.execute(sql`DELETE FROM pharmacology`);
      console.log('  Cleared existing pharmacology');

      await db.execute(sql`
        INSERT INTO pharmacology (data)
        VALUES (${JSON.stringify(pharmaData)})
      `);
      console.log(`  ✅ Imported ${pharmaData.medicines.length} medicines`);
    }

    // Import Causes from your actual data
    console.log('\n📋 Importing causes...');
    const causesPath = 'C:/Users/imran/Downloads/symptom-tracker-export-2026-05-03.json';
    const causesData = JSON.parse(readFileSync(causesPath, 'utf-8'));
    
    // Handle different JSON structures
    let causesArray: any[] = [];
    if (Array.isArray(causesData)) {
      causesArray = causesData;
    } else if (causesData.causes && Array.isArray(causesData.causes)) {
      causesArray = causesData.causes;
    } else if (causesData.conditions && Array.isArray(causesData.conditions)) {
      causesArray = causesData.conditions;
    } else if (causesData.data && Array.isArray(causesData.data)) {
      causesArray = causesData.data;
    }
    
    if (causesArray.length > 0) {
      await db.execute(sql`DELETE FROM causes`);
      console.log('  Cleared existing causes');

      for (const cause of causesArray) {
        const name = cause.name || cause.conditionName || cause.title || cause.condition || 'Unknown';
        const baseRate = cause.baseRate || cause.base_rate || 10;
        const symptoms = cause.symptoms || cause.symptomList || cause.presentingSymptoms || cause.complaints || [];
        const pathognomonicSymptoms = cause.pathognomonicSymptoms || [];
        const cardinalSymptoms = cause.cardinalSymptoms || [];
        const startDuration = cause.startDuration || cause.duration_min || 0;
        const endDuration = cause.endDuration || cause.duration_max || 12;
        const durationUnit = cause.durationUnit || cause.duration_unit || 'months';
        const durationRuleType = cause.durationRuleType || cause.duration_rule_type || 'soft';
        const fullReview = cause.fullReview || cause.management || cause.therapy || cause.treatment || null;
        const treatment = cause.treatment || cause.management || cause.therapy || null;

        await db.execute(sql`
          INSERT INTO causes (name, base_rate, symptoms, pathognomonic_symptoms, cardinal_symptoms, start_duration, end_duration, duration_unit, duration_rule_type, full_review, treatment)
          VALUES (${name}, ${baseRate}, ${JSON.stringify(symptoms)}, ${JSON.stringify(pathognomonicSymptoms)}, ${JSON.stringify(cardinalSymptoms)}, ${startDuration}, ${endDuration}, ${durationUnit}, ${durationRuleType}, ${fullReview}, ${treatment})
        `);
      }
      console.log(`  ✅ Imported ${causesArray.length} causes`);
    } else {
      console.log('  ⚠️  No causes/conditions array found in file');
    }

    console.log('\n✅ Import completed successfully!');
    console.log('🎉 All members can now view this data!');

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await pool.end();
  }
}

importData();
