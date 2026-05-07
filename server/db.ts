import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// DATABASE_URL is REQUIRED for all environments
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required. Please set it in your .env file or Netlify environment variables.",
  );
}

// Create database pool with PostgreSQL connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Neon/Supabase
});

export { pool };
export const db = drizzle(pool, { schema });