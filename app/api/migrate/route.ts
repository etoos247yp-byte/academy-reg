import { NextResponse } from "next/server";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@/lib/db/connection";

export async function GET() {
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    return NextResponse.json({ success: true, message: "Migrations applied" });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
