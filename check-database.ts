/**
 * Verify data in PostgreSQL
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';

const DATABASE_URL = 'postgresql://neondb_owner:npg_9dHSn1LNuQOs@ep-misty-waterfall-ao0wc9kj.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(pool);

async function checkData() {
  console.log('🔍 Checking database...\n');

  try {
    // Check causes
    const causesResult = await db.execute(sql`SELECT COUNT(*) FROM causes`);
    console.log(`📋 Causes in database: ${causesResult.rows[0].count}`);

    // Check pharmacology
    const pharmaResult = await db.execute(sql`SELECT COUNT(*) FROM pharmacology`);
    console.log(`💊 Pharmacology records: ${pharmaResult.rows[0].count}`);

    // Get medicine count
    const pharmaData = await db.execute(sql`SELECT data FROM pharmacology ORDER BY id DESC LIMIT 1`);
    if (pharmaData.rows.length > 0) {
      const data = pharmaData.rows[0] as any;
      const medicines = data.data.medicines || [];
      console.log(`   Medicines in pharmacology: ${medicines.length}`);
    }

    // Check patient records
    const recordsResult = await db.execute(sql`SELECT COUNT(*) FROM patient_records`);
    console.log(`📁 Patient records: ${recordsResult.rows[0].count}`);

    // Sample causes
    const sampleCauses = await db.execute(sql`SELECT name FROM causes LIMIT 5`);
    console.log('\n📝 Sample causes:');
    sampleCauses.rows.forEach(row => console.log(`   - ${row.name}`));

    console.log('\n✅ Database check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkData();
