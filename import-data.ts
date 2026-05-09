/**
 * Import JSON data to PostgreSQL database
 * This script imports causes and pharmacology data from JSON files
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';

// Get DATABASE_URL from environment or .env file
let DATABASE_URL = process.env.DATABASE_URL;

// Try to read from .env file if not set
if (!DATABASE_URL) {
  try {
    const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
    const match = envContent.match(/DATABASE_URL=(.+)/);
    if (match) {
      DATABASE_URL = match[1].trim();
    }
  } catch (err) {
    // .env file not found
  }
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.log('Create a .env file with: DATABASE_URL=your_connection_string');
  process.exit(1);
}

console.log('✅ DATABASE_URL found');

const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(pool);

async function importData() {
  console.log('🚀 Starting data import...\n');

  try {
    // Import Causes from your file
    console.log('📋 Importing causes...');
    const causesPath = join(__dirname, 'sample-import.json');
    const causesData = JSON.parse(readFileSync(causesPath, 'utf-8'));
    
    if (causesData.causes && Array.isArray(causesData.causes)) {
      // Clear existing causes
      await db.execute(sql`DELETE FROM causes`);
      console.log('  Cleared existing causes');

      // Insert new causes
      for (const cause of causesData.causes) {
        await db.execute(sql`
          INSERT INTO causes (name, base_rate, symptoms, pathognomonic_symptoms, cardinal_symptoms, start_duration, end_duration, duration_unit, duration_rule_type, full_review, treatment)
          VALUES (
            ${cause.name},
            ${cause.baseRate},
            ${JSON.stringify(cause.symptoms)},
            ${JSON.stringify(cause.pathognomonicSymptoms || [])},
            ${JSON.stringify(cause.cardinalSymptoms || [])},
            ${cause.startDuration},
            ${cause.endDuration},
            ${cause.durationUnit},
            ${cause.durationRuleType},
            ${cause.fullReview || null},
            ${cause.treatment || null}
          )
        `);
      }
      console.log(`  ✅ Imported ${causesData.causes.length} causes`);
    } else {
      console.log('  ⚠️  No causes array found in file');
    }

    // Import Pharmacology from your file
    console.log('\n💊 Importing pharmacology...');
    const pharmaPath = join(__dirname, 'sample-pharmacology.json');
    const pharmaData = JSON.parse(readFileSync(pharmaPath, 'utf-8'));
    
    if (pharmaData.medicines && Array.isArray(pharmaData.medicines)) {
      // Clear existing pharmacology
      await db.execute(sql`DELETE FROM pharmacology`);
      console.log('  Cleared existing pharmacology');

      // Insert as single JSON record
      await db.execute(sql`
        INSERT INTO pharmacology (data)
        VALUES (${JSON.stringify(pharmaData)})
      `);
      console.log(`  ✅ Imported ${pharmaData.medicines.length} medicines`);
    } else {
      console.log('  ⚠️  No medicines array found in file');
    }

    // Import Patient Records (if file exists)
    console.log('\n📁 Importing patient records...');
    try {
      const recordsPath = join(__dirname, 'sample-regester-data.json');
      const recordsData = JSON.parse(readFileSync(recordsPath, 'utf-8'));
      
      if (recordsData.records && Array.isArray(recordsData.records)) {
        await db.execute(sql`DELETE FROM patient_records`);
        console.log('  Cleared existing patient records');

        await db.execute(sql`
          INSERT INTO patient_records (data)
          VALUES (${JSON.stringify(recordsData)})
        `);
        console.log(`  ✅ Imported ${recordsData.records.length} patient records`);
      }
    } catch (err) {
      console.log('  ⚠️  No patient records file found, skipping...');
    }

    console.log('\n✅ Data import completed successfully!');
    console.log('📊 Summary:');
    console.log('   - Causes: Imported');
    console.log('   - Pharmacology: Imported');
    console.log('   - Patient Records: Imported');
    console.log('\n🎉 All members can now view this data!');

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await pool.end();
  }
}

importData();
