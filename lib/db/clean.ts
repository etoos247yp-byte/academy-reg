import { db } from "@/lib/db/connection";
import { sql } from "drizzle-orm";

async function clean() {
  // Drop all tables in public schema (reverse FK order)
  await db.execute(sql`
    DO $$ DECLARE r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);

  // Drop enums
  await db.execute(sql`
    DO $$ DECLARE r RECORD;
    BEGIN
      FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
      END LOOP;
    END $$;
  `);

  // Drop drizzle tracking tables
  await db.execute(sql`DROP TABLE IF EXISTS drizzle.__drizzle_migrations CASCADE`);

  console.log("Database cleaned.");
  process.exit(0);
}

clean().catch((err) => { console.error(err); process.exit(1); });
