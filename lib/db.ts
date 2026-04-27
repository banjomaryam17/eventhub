import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const globalForDb = globalThis as unknown as { pool: Pool | undefined };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true },
    max: 3,                         // Neon has low connection limits
    idleTimeoutMillis: 10_000,      // Drop idle connections faster
    connectionTimeoutMillis: 10_000, // Give Neon time to wake up
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

pool.on("error", (err: any) => {
  // Neon kills idle connections — this is expected, just ignore 57P01
  if (err.code === "57P01") return;
  console.error("Unexpected database pool error:", err);
});