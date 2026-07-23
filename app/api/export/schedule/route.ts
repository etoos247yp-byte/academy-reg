import { NextResponse } from "next/server";
import { exportStudentScheduleAction } from "@/lib/actions/excel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = Number(searchParams.get("studentId"));
  const studentName = searchParams.get("studentName") ?? "학생";
  if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });

  try {
    const buf = await exportStudentScheduleAction(studentId, studentName);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=schedule-${encodeURIComponent(studentName)}.xlsx`,
      },
    });
  } catch {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }
}
