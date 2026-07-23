import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const drizzleDir = path.join(process.cwd(), "drizzle");
    const files = fs.readdirSync(drizzleDir).filter((f) => f.endsWith(".sql")).sort();
    const results: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(drizzleDir, file), "utf-8");
      const statements = content
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        try {
          await db.execute(sql.raw(stmt));
        } catch (e: any) {
          // Ignore "already exists" errors for idempotent runs
          if (!e?.message?.includes("already exists") && !e?.message?.includes("duplicate")) {
            results.push(`Warning (${file}): ${e?.message?.substring(0, 150)}`);
          }
        }
      }
      results.push(`Applied: ${file}`);
    }

    // Seed the database
    try {
      const bcrypt = await import("bcryptjs");
      const { eq } = await import("drizzle-orm");
      const hashes = {
        staff: await bcrypt.hash("1234", 10),
        student: await bcrypt.hash("12345", 10),
      };

      // Check if already seeded
      const existing = await db.execute(sql`SELECT COUNT(*) FROM users`);
      results.push(`Users: ${JSON.stringify(existing)}`);
    } catch (e: any) {
      results.push(`Seed check: ${e?.message?.substring(0, 150)}`);
    }

    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.code ?? "", message: e?.message?.substring(0, 500) ?? String(e) },
      { status: 500 },
    );
  }
}
