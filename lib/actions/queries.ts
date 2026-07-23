"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { requireStaff } from "@/lib/auth/authorization";
import { db, schema } from "@/lib/db/connection";
import { TEST, isTestMode } from "@/lib/db/test-mode";
import { eq, asc, sql, and, inArray } from "drizzle-orm";

export async function getActivePeriod() {
  if (isTestMode()) return TEST.getActivePeriod();
  const [period] = await db
    .select()
    .from(schema.academicPeriods)
    .where(eq(schema.academicPeriods.isActive, 1))
    .limit(1);
  return period ?? null;
}

export async function getAllOfferings() {
  if (isTestMode()) return TEST.getAllOfferings();
  const period = await getActivePeriod();
  if (!period) return [];

  return db
    .select({
      id: schema.offerings.id,
      courseName: schema.courses.name,
      code: schema.courses.code,
      category: schema.offerings.category,
      teacher: schema.instructors.name,
      capacity: schema.offerings.capacity,
      status: schema.offerings.status,
      subject: schema.courses.subject,
      confirmedCount: sql<number>`COALESCE((
        SELECT COUNT(*) FROM ${schema.registrations}
        WHERE ${schema.registrations.offeringId} = ${schema.offerings.id}
        AND ${schema.registrations.status} = 'CONFIRMED'
      ), 0)`,
      waitlistCount: sql<number>`COALESCE((
        SELECT COUNT(*) FROM ${schema.registrations}
        WHERE ${schema.registrations.offeringId} = ${schema.offerings.id}
        AND ${schema.registrations.status} = 'WAITLISTED'
      ), 0)`,
    })
    .from(schema.offerings)
    .innerJoin(schema.courses, eq(schema.offerings.courseId, schema.courses.id))
    .leftJoin(schema.instructors, eq(schema.offerings.instructorId, schema.instructors.id))
    .orderBy(schema.courses.subject, asc(schema.offerings.id));
}

export async function getStudentOfferings(userId: number) {
  if (isTestMode()) return TEST.getStudentOfferings();
  const period = await getActivePeriod();
  if (!period) return [];

  return db
    .select({
      id: schema.offerings.id,
      courseName: schema.courses.name,
      code: schema.courses.code,
      category: schema.offerings.category,
      teacher: schema.instructors.name,
      capacity: schema.offerings.capacity,
      status: schema.offerings.status,
      subject: schema.courses.subject,
      confirmedCount: sql<number>`COALESCE((
        SELECT COUNT(*) FROM ${schema.registrations}
        WHERE ${schema.registrations.offeringId} = ${schema.offerings.id}
        AND ${schema.registrations.status} = 'CONFIRMED'
      ), 0)`,
    })
    .from(schema.offerings)
    .innerJoin(schema.courses, eq(schema.offerings.courseId, schema.courses.id))
    .leftJoin(schema.instructors, eq(schema.offerings.instructorId, schema.instructors.id))
    .where(eq(schema.offerings.status, "PUBLISHED"))
    .orderBy(schema.courses.subject, asc(schema.offerings.id));
}

export async function getRegistrations(userId: number) {
  if (isTestMode()) return TEST.getRegistrations();
  return db
    .select({
      id: schema.registrations.id,
      offeringId: schema.registrations.offeringId,
      status: schema.registrations.status,
      enrolledAt: schema.registrations.enrolledAt,
      waitlistSequence: schema.registrations.waitlistSequence,
      courseName: schema.courses.name,
      category: schema.offerings.category,
      teacher: schema.instructors.name,
    })
    .from(schema.registrations)
    .innerJoin(schema.offerings, eq(schema.registrations.offeringId, schema.offerings.id))
    .innerJoin(schema.courses, eq(schema.offerings.courseId, schema.courses.id))
    .leftJoin(schema.instructors, eq(schema.offerings.instructorId, schema.instructors.id))
    .where(
      and(
        eq(schema.registrations.userId, userId),
        sql`${schema.registrations.status} IN ('CONFIRMED', 'WAITLISTED')`,
      ),
    )
    .orderBy(asc(schema.registrations.enrolledAt));
}

export async function getStaffRegistrations() {
  try { requireStaff(await getCurrentUser()); } catch { return []; }
  if (isTestMode()) return TEST.getStaffRegistrations();
  return db
    .select({
      id: schema.registrations.id,
      userId: schema.registrations.userId,
      studentName: schema.users.name,
      studentEmail: schema.users.email,
      offeringId: schema.registrations.offeringId,
      status: schema.registrations.status,
      enrolledAt: schema.registrations.enrolledAt,
      courseName: schema.courses.name,
      category: schema.offerings.category,
      waitlistSequence: schema.registrations.waitlistSequence,
    })
    .from(schema.registrations)
    .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
    .innerJoin(schema.offerings, eq(schema.registrations.offeringId, schema.offerings.id))
    .innerJoin(schema.courses, eq(schema.offerings.courseId, schema.courses.id))
    .orderBy(asc(schema.registrations.enrolledAt));
}

export async function getStudents() {
  try { requireStaff(await getCurrentUser()); } catch { return []; }
  if (isTestMode()) return TEST.getStudents();
  return db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      schoolGrade: schema.studentProfiles.schoolGrade,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .innerJoin(schema.studentProfiles, eq(schema.users.id, schema.studentProfiles.userId))
    .where(eq(schema.users.role, "STUDENT"))
    .orderBy(asc(schema.users.name));
}

export async function getInstructors() {
  try { requireStaff(await getCurrentUser()); } catch { return []; }
  if (isTestMode()) return TEST.getInstructors();
  return db.select().from(schema.instructors).orderBy(asc(schema.instructors.name));
}

export async function getOfferingsByIds(ids: number[]) {
  if (isTestMode()) return TEST.getOfferingsByIds();
  if (ids.length === 0) return [];
  return db
    .select({
      id: schema.offerings.id,
      courseName: schema.courses.name,
      category: schema.offerings.category,
      teacher: schema.instructors.name,
      capacity: schema.offerings.capacity,
      status: schema.offerings.status,
      subject: schema.courses.subject,
      room: schema.offerings.room,
      sessionDate: schema.offeringSessions.sessionDate,
      startTime: schema.offeringSessions.startTime,
      endTime: schema.offeringSessions.endTime,
    })
    .from(schema.offerings)
    .innerJoin(schema.courses, eq(schema.offerings.courseId, schema.courses.id))
    .leftJoin(schema.instructors, eq(schema.offerings.instructorId, schema.instructors.id))
    .leftJoin(schema.offeringSessions, eq(schema.offerings.id, schema.offeringSessions.offeringId))
    .where(inArray(schema.offerings.id, ids))
    .orderBy(schema.offerings.id, schema.offeringSessions.sessionDate);
}
