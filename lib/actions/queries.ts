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
    .orderBy(schema.academicPeriods.id)
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
    .where(
      and(
        eq(schema.offerings.status, "PUBLISHED"),
        eq(schema.offerings.periodId, period.id),
      ),
    )
    .orderBy(schema.courses.subject, asc(schema.offerings.id));
}

export async function getRegistrations(userId: number) {
  if (isTestMode()) return TEST.getRegistrations();
  const period = await getActivePeriod();
  if (!period) return [];

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
        eq(schema.offerings.periodId, period.id),
        sql`${schema.registrations.status} IN ('CONFIRMED', 'WAITLISTED')`,
      ),
    )
    .orderBy(asc(schema.registrations.enrolledAt));
}

export async function getStaffRegistrations() {
  try { requireStaff(await getCurrentUser()); } catch { return []; }
  if (isTestMode()) return TEST.getStaffRegistrations();
  const period = await getActivePeriod();
  if (!period) return [];

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
    .where(eq(schema.offerings.periodId, period.id))
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
      classCode: schema.studentProfiles.classCode,
      highSchool: schema.studentProfiles.highSchool,
      lockDays: schema.studentProfiles.lockDays,
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

export async function getActiveRegistrationWindow() {
  if (isTestMode()) return null;
  const period = await getActivePeriod();
  if (!period) return null;
  const [window] = await db
    .select()
    .from(schema.registrationWindows)
    .where(eq(schema.registrationWindows.periodId, period.id))
    .orderBy(schema.registrationWindows.id)
    .limit(1);
  return window ?? null;
}

export async function getRegistrationLockStatus(userId: number) {
  if (isTestMode()) return { isLocked: false, lockedAt: null, lockedTierLabel: "무료", lockedTierSurcharge: 0, lockedNormalCount: 0, currentNormalCount: 0, lockDays: 7 };
  const period = await getActivePeriod();
  if (!period) return { isLocked: false, lockedAt: null, lockedTierLabel: "무료", lockedTierSurcharge: 0, lockedNormalCount: 0, currentNormalCount: 0, lockDays: 7 };

  // Determine lock days: per-student override → period default → 7
  let lockDays = period.lockDays ?? 7;
  const [profile] = await db.select({ lockDays: schema.studentProfiles.lockDays }).from(schema.studentProfiles).where(eq(schema.studentProfiles.userId, userId)).limit(1);
  if (profile?.lockDays != null) lockDays = profile.lockDays;

  // Find earliest confirmed batch for this student in the active period
  const [firstBatch] = await db
    .select({ createdAt: schema.registrationBatches.createdAt })
    .from(schema.registrationBatches)
    .innerJoin(schema.registrations, eq(schema.registrationBatches.id, schema.registrations.batchId))
    .innerJoin(schema.offerings, eq(schema.registrations.offeringId, schema.offerings.id))
    .where(and(
      eq(schema.registrationBatches.userId, userId),
      eq(schema.offerings.periodId, period.id),
      eq(schema.registrations.status, "CONFIRMED"),
    ))
    .orderBy(schema.registrationBatches.createdAt)
    .limit(1);

  if (!firstBatch) return { isLocked: false, lockedAt: null, lockedTierLabel: "무료", lockedTierSurcharge: 0, lockedNormalCount: 0, currentNormalCount: 0, lockDays };

  const lockDate = new Date(firstBatch.createdAt.getTime() + lockDays * 24 * 60 * 60 * 1000);
  const isLocked = new Date() >= lockDate;

  // Count current NORMAL_SEASON confirmed registrations
  const [currentCount] = await db
    .select({ c: sql<number>`COUNT(*)` })
    .from(schema.registrations)
    .innerJoin(schema.offerings, eq(schema.registrations.offeringId, schema.offerings.id))
    .where(and(
      eq(schema.registrations.userId, userId),
      eq(schema.offerings.periodId, period.id),
      eq(schema.registrations.status, "CONFIRMED"),
      eq(schema.offerings.category, "NORMAL_SEASON"),
    ));

  const currentNormalCount = Number(currentCount?.c ?? 0);

  // Count NORMAL_SEASON registrations from batches at or before lock date
  const [lockedCount] = await db
    .select({ c: sql<number>`COUNT(*)` })
    .from(schema.registrations)
    .innerJoin(schema.registrationBatches, eq(schema.registrations.batchId, schema.registrationBatches.id))
    .innerJoin(schema.offerings, eq(schema.registrations.offeringId, schema.offerings.id))
    .where(and(
      eq(schema.registrations.userId, userId),
      eq(schema.offerings.periodId, period.id),
      eq(schema.registrations.status, "CONFIRMED"),
      eq(schema.offerings.category, "NORMAL_SEASON"),
      sql`${schema.registrationBatches.createdAt} <= ${lockDate.toISOString()}`,
    ));

  const lockedNormalCount = Number(lockedCount?.c ?? 0);
  const { computeNormalTier } = await import("@/modules/pricing/tiers");
  const lockedTier = computeNormalTier(lockedNormalCount);

  return {
    isLocked,
    lockedAt: isLocked ? lockDate : null,
    lockedTierLabel: lockedTier.label,
    lockedTierSurcharge: lockedTier.monthlySurcharge,
    lockedNormalCount,
    currentNormalCount,
    lockDays,
  };
}
