import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/academy_reg";
const isSupabase = connectionString.includes("supabase") || connectionString.includes("pooler");

const pool = new Pool({
  connectionString,
  max: 20,
  ...(isSupabase
    ? {
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      }
    : {}),
});

export const db = drizzle(pool, { schema });
export { schema };
