import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const globalForDb = globalThis as unknown as { pool: Pool | undefined };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: true } 
        : false,                         
    max: 10,                            
    idleTimeoutMillis: 30_000,          
    connectionTimeoutMillis: 5_000,       
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});