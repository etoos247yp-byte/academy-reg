import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { exportStudentScheduleAction } from "@/lib/actions/excel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = Number(searchParams.get("studentId"));
  const studentName = searchParams.get("studentName") ?? "학생";
  if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });

  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "STAFF" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }
    const buf = await exportStudentScheduleAction(studentId, studentName);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=schedule-${encodeURIComponent(studentName)}.xlsx`,
      },
    });
  } catch {
    return NextResponse.json({ error: "내보내기 실패" }, { status: 500 });
  }
}
