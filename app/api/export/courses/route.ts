import { NextResponse } from "next/server";
import { exportCoursesAction } from "@/lib/actions/excel";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await exportCoursesAction();
  return new NextResponse(Buffer.from(data), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=courses.xlsx",
    },
  });
}
