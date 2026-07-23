import { NextResponse } from "next/server";
import { exportStudentsAction } from "@/lib/actions/excel";

export async function GET() {
  try {
    const buf = await exportStudentsAction();
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=students.xlsx",
      },
    });
  } catch {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }
}
