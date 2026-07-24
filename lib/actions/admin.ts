"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { requireStaff } from "@/lib/auth/authorization";
import { db, schema } from "@/lib/db/connection";
import { eq, and, asc, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// ── Helpers ──

async function getActivePeriodOrThrow() {
  const [period] = await db
    .select()
    .from(schema.academicPeriods)
    .where(eq(schema.academicPeriods.isActive, 1))
    .orderBy(schema.academicPeriods.id)
    .limit(1);
  if (!period) throw new Error("활성화된 학기가 없습니다");
  return period;
}

function dbError(e: unknown): { success: false; error: string } {
  const msg = e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다";
  return { success: false, error: msg };
}

// ── Student CRUD ──

export async function createStudentAction(form: {
  name: string; email: string; phone: string; schoolGrade: string; classCode: string; highSchool: string; lockDays?: number;
}) {
  requireStaff(await getCurrentUser());
  try {
    const passwordHash = await bcrypt.hash("12345", 10);
    const [user] = await db
      .insert(schema.users)
      .values({ email: form.email, name: form.name, phone: form.phone || null, role: "STUDENT", passwordHash })
      .returning({ id: schema.users.id });
    await db.insert(schema.studentProfiles).values({
      userId: user.id,
      schoolGrade: form.schoolGrade || null,
      classCode: form.classCode || null,
      highSchool: form.highSchool || null,
      lockDays: form.lockDays ?? null,
    });
    revalidatePath("/staff/students");
    return { success: true };
  } catch (e) { return dbError(e); }
}

export async function updateStudentAction(id: number, form: {
  name: string; email: string; phone: string; schoolGrade: string; classCode: string; highSchool: string; lockDays?: number;
}) {
  requireStaff(await getCurrentUser());
  try {
    await db.update(schema.users)
      .set({ name: form.name, email: form.email, phone: form.phone || null })
      .where(eq(schema.users.id, id));
    await db.update(schema.studentProfiles)
      .set({ schoolGrade: form.schoolGrade || null, classCode: form.classCode || null, highSchool: form.highSchool || null, lockDays: form.lockDays ?? null })
      .where(eq(schema.studentProfiles.userId, id));
    revalidatePath("/staff/students");
    return { success: true };
  } catch (e) { return dbError(e); }
}

export async function deleteStudentAction(id: number) {
  requireStaff(await getCurrentUser());
  try {
    await db.delete(schema.users).where(eq(schema.users.id, id));
    revalidatePath("/staff/students");
    return { success: true };
  } catch (e) { return dbError(e); }
}

// ── Offering CRUD ──

async function findOrCreateCourse(code: string, name: string): Promise<number> {
  const [existing] = await db.select({ id: schema.courses.id }).from(schema.courses).where(eq(schema.courses.code, code)).limit(1);
  if (existing) return existing.id;
  const [created] = await db.insert(schema.courses).values({ code, name, subject: "" }).returning({ id: schema.courses.id });
  return created.id;
}

async function resolveInstructorId(teacherName: string): Promise<number | undefined> {
  if (!teacherName) return undefined;
  const [inst] = await db.select({ id: schema.instructors.id }).from(schema.instructors).where(eq(schema.instructors.name, teacherName)).limit(1);
  return inst?.id;
}

export async function createOfferingAction(form: {
  code: string; courseName: string; category: string; teacher: string; capacity: number; room: string;
}) {
  requireStaff(await getCurrentUser());
  try {
    const period = await getActivePeriodOrThrow();
    const courseId = await findOrCreateCourse(form.code, form.courseName);
    const instructorId = await resolveInstructorId(form.teacher);
    await db.insert(schema.offerings).values({
      courseId,
      periodId: period.id,
      instructorId,
      category: form.category as typeof schema.offeringCategoryEnum.enumValues[number],
      capacity: form.capacity,
      room: form.room || undefined,
      status: "PUBLISHED",
      sectionCode: form.code,
    });
    revalidatePath("/staff/offerings");
    return { success: true };
  } catch (e) { return dbError(e); }
}

export async function updateOfferingAction(id: number, form: {
  code: string; courseName: string; category: string; teacher: string; capacity: number; status: string;
}) {
  requireStaff(await getCurrentUser());
  try {
    // Update the linked course
    const [offering] = await db.select({ courseId: schema.offerings.courseId }).from(schema.offerings).where(eq(schema.offerings.id, id)).limit(1);
    if (offering) {
      await db.update(schema.courses)
        .set({ code: form.code, name: form.courseName })
        .where(eq(schema.courses.id, offering.courseId));
    }
    const instructorId = await resolveInstructorId(form.teacher);
    await db.update(schema.offerings).set({
      category: form.category as typeof schema.offeringCategoryEnum.enumValues[number],
      instructorId,
      capacity: form.capacity,
      status: form.status as typeof schema.offeringStatusEnum.enumValues[number],
    }).where(eq(schema.offerings.id, id));
    revalidatePath("/staff/offerings");
    return { success: true };
  } catch (e) { return dbError(e); }
}

export async function deleteOfferingAction(id: number) {
  requireStaff(await getCurrentUser());
  try {
    await db.delete(schema.offerings).where(eq(schema.offerings.id, id));
    revalidatePath("/staff/offerings");
    return { success: true };
  } catch (e) { return dbError(e); }
}

// ── Registration CRUD ──

export async function cancelRegistrationAction(registrationId: number) {
  requireStaff(await getCurrentUser());
  try {
    await db.update(schema.registrations)
      .set({ status: "CANCELLED", cancelledAt: new Date() })
      .where(eq(schema.registrations.id, registrationId));
    revalidatePath("/staff/registrations");
    return { success: true };
  } catch (e) { return dbError(e); }
}

export async function enrollStudentAction(studentEmail: string, offeringId: number) {
  requireStaff(await getCurrentUser());
  try {
    const [student] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, studentEmail)).limit(1);
    if (!student) return { error: "학생을 찾을 수 없습니다" };

    const [offering] = await db.select({ id: schema.offerings.id, capacity: schema.offerings.capacity, periodId: schema.offerings.periodId }).from(schema.offerings).where(eq(schema.offerings.id, offeringId)).limit(1);
    if (!offering) return { error: "수업을 찾을 수 없습니다" };

    const [existing] = await db.select({ id: schema.registrations.id }).from(schema.registrations).where(
      and(eq(schema.registrations.userId, student.id), eq(schema.registrations.offeringId, offeringId), sql`${schema.registrations.status} IN ('CONFIRMED', 'WAITLISTED')`)
    ).limit(1);
    if (existing) return { error: "이미 신청된 수업입니다" };

    const period = await getActivePeriodOrThrow();
    const [window] = await db.select({ id: schema.registrationWindows.id }).from(schema.registrationWindows).where(eq(schema.registrationWindows.periodId, period.id)).orderBy(schema.registrationWindows.id).limit(1);
    if (!window) return { error: "수강신청 기간을 찾을 수 없습니다" };

    const [batch] = await db.insert(schema.registrationBatches).values({ userId: student.id, windowId: window.id, reviewToken: `admin-${Date.now()}` }).returning({ id: schema.registrationBatches.id });

    const [confirmed] = await db.select({ c: sql<number>`COUNT(*)` }).from(schema.registrations).where(and(eq(schema.registrations.offeringId, offeringId), eq(schema.registrations.status, "CONFIRMED")));
    const isFull = Number(confirmed?.c ?? 0) >= offering.capacity;

    if (isFull) {
      const [waitCount] = await db.select({ c: sql<number>`COUNT(*)` }).from(schema.registrations).where(and(eq(schema.registrations.offeringId, offeringId), eq(schema.registrations.status, "WAITLISTED")));
      await db.insert(schema.registrations).values({ batchId: batch.id, userId: student.id, offeringId, status: "WAITLISTED", waitlistSequence: Number(waitCount?.c ?? 0) + 1 });
    } else {
      await db.insert(schema.registrations).values({ batchId: batch.id, userId: student.id, offeringId, status: "CONFIRMED" });
    }
    revalidatePath("/staff/registrations");
    return { success: true };
  } catch (e) { return dbError(e); }
}

// ── Instructor CRUD ──

export async function createInstructorAction(form: {
  name: string; subject: string; phone: string; oneUpCapacity: number;
}) {
  requireStaff(await getCurrentUser());
  try {
    await db.insert(schema.instructors).values({ name: form.name, subject: form.subject, phone: form.phone || null, oneUpCapacity: form.oneUpCapacity });
    revalidatePath("/staff/instructors");
    return { success: true };
  } catch (e) { return dbError(e); }
}

export async function updateInstructorAction(id: number, form: {
  name: string; subject: string; phone: string; oneUpCapacity: number;
}) {
  requireStaff(await getCurrentUser());
  try {
    await db.update(schema.instructors).set({ name: form.name, subject: form.subject, phone: form.phone || null, oneUpCapacity: form.oneUpCapacity }).where(eq(schema.instructors.id, id));
    revalidatePath("/staff/instructors");
    return { success: true };
  } catch (e) { return dbError(e); }
}

export async function deleteInstructorAction(id: number) {
  requireStaff(await getCurrentUser());
  try {
    await db.delete(schema.instructors).where(eq(schema.instructors.id, id));
    revalidatePath("/staff/instructors");
    return { success: true };
  } catch (e) { return dbError(e); }
}

// ── Period settings ──

export async function updatePeriodLockDaysAction(periodId: number, lockDays: number) {
  requireStaff(await getCurrentUser());
  try {
    await db.update(schema.academicPeriods).set({ lockDays }).where(eq(schema.academicPeriods.id, periodId));
    revalidatePath("/staff/offerings");
    return { success: true };
  } catch (e) { return dbError(e); }
}
