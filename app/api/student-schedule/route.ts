import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = Number(searchParams.get("studentId"));
  if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });

  if (process.env.TEST_MODE === "true") {
    return NextResponse.json({
      sessions: [
        { courseName: "국어", teacher: "김민철", category: "NORMAL_SEASON", room: "201호",
          sessionDate: "2026-07-06", startTime: "09:00:00", endTime: "09:50:00" },
        { courseName: "수학", teacher: "박성호", category: "NORMAL_SEASON", room: "301호",
          sessionDate: "2026-07-06", startTime: "11:00:00", endTime: "11:50:00" },
      ],
    });
  }

  const { getCurrentUser } = await import("@/lib/auth/session");
  const { requireStaff } = await import("@/lib/auth/authorization");
  try { requireStaff(await getCurrentUser()); } catch {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const { db, schema } = await import("@/lib/db/connection");
  const { eq, and, sql } = await import("drizzle-orm");

  const sessions = await db
    .select({
      courseName: schema.courses.name,
      teacher: schema.instructors.name,
      category: schema.offerings.category,
      room: schema.offerings.room,
      sessionDate: schema.offeringSessions.sessionDate,
      startTime: schema.offeringSessions.startTime,
      endTime: schema.offeringSessions.endTime,
    })
    .from(schema.registrations)
    .innerJoin(schema.offerings, eq(schema.registrations.offeringId, schema.offerings.id))
    .innerJoin(schema.courses, eq(schema.offerings.courseId, schema.courses.id))
    .leftJoin(schema.instructors, eq(schema.offerings.instructorId, schema.instructors.id))
    .leftJoin(schema.offeringSessions, eq(schema.offerings.id, schema.offeringSessions.offeringId))
    .where(
      and(
        eq(schema.registrations.userId, studentId),
        sql`${schema.registrations.status} IN ('CONFIRMED', 'WAITLISTED')`,
      ),
    );

  return NextResponse.json({ sessions });
}
