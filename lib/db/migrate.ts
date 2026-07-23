import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@/lib/db/connection";

async function runMigrations() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
