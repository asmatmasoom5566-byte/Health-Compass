import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Only require DATABASE_URL in production
if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  throw new Error(
    "DATABASE_URL must be set in production. Did you forget to provision a database?",
  );
}

// Create a dummy pool for development/local testing
let pool: pg.Pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
} else {
  // Create a mock pool for local development
  pool = new Pool({
    connectionString: "postgresql://localhost:5432/dummy",
    // Mock the query method to prevent actual database calls
    query: () => Promise.resolve({ rows: [], rowCount: 0 })
  } as any);
}

export { pool };
export const db = drizzle(pool, { schema });