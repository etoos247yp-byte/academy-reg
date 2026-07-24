"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { requireStaff } from "@/lib/auth/authorization";
import { db, schema } from "@/lib/db/connection";
import { eq, asc, sql, and } from "drizzle-orm";
import * as XLSX from "xlsx";

function makeWorkbook(headers: string[], rows: unknown[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

export async function exportOfferingsAction() {
  requireStaff(await getCurrentUser());
  const data = await db
    .select({
      코드: schema.courses.code,
      수업명: schema.courses.name,
      유형: schema.offerings.category,
      선생님: schema.instructors.name,
      강의실: schema.offerings.room,
      정원: schema.offerings.capacity,
      상태: schema.offerings.status,
      수강인원: sql<number>`COALESCE((
        SELECT COUNT(*) FROM ${schema.registrations}
        WHERE ${schema.registrations.offeringId} = ${schema.offerings.id}
        AND ${schema.registrations.status} = 'CONFIRMED'
      ), 0)`,
      대기인원: sql<number>`COALESCE((
        SELECT COUNT(*) FROM ${schema.registrations}
        WHERE ${schema.registrations.offeringId} = ${schema.offerings.id}
        AND ${schema.registrations.status} = 'WAITLISTED'
      ), 0)`,
    })
    .from(schema.offerings)
    .innerJoin(schema.courses, eq(schema.offerings.courseId, schema.courses.id))
    .leftJoin(schema.instructors, eq(schema.offerings.instructorId, schema.instructors.id))
    .orderBy(schema.courses.subject, asc(schema.offerings.id));

  const headers = ["코드", "수업명", "유형", "선생님", "강의실", "정원", "상태", "수강인원", "대기인원"];
  const rows = data.map((r) => headers.map((h) => r[h as keyof typeof r] ?? ""));
  return makeWorkbook(headers, rows);
}

export async function exportStudentsAction() {
  requireStaff(await getCurrentUser());
  const data = await db
    .select({
      이름: schema.users.name,
      이메일: schema.users.email,
      연락처: schema.users.phone,
      학년: schema.studentProfiles.schoolGrade,
      가입일: schema.users.createdAt,
    })
    .from(schema.users)
    .innerJoin(schema.studentProfiles, eq(schema.users.id, schema.studentProfiles.userId))
    .where(eq(schema.users.role, "STUDENT"))
    .orderBy(asc(schema.users.name));

  const headers = ["이름", "이메일", "연락처", "학년", "가입일"];
  const rows = data.map((r) => headers.map((h) => {
    const v = r[h as keyof typeof r];
    return v instanceof Date ? v.toISOString().split("T")[0] : (v ?? "");
  }));
  return makeWorkbook(headers, rows);
}

export async function exportRegistrationsAction() {
  requireStaff(await getCurrentUser());
  const data = await db
    .select({
      학생명: schema.users.name,
      학생이메일: schema.users.email,
      수업명: schema.courses.name,
      유형: schema.offerings.category,
      상태: schema.registrations.status,
      대기순번: schema.registrations.waitlistSequence,
      신청일: schema.registrations.enrolledAt,
    })
    .from(schema.registrations)
    .innerJoin(schema.users, eq(schema.registrations.userId, schema.users.id))
    .innerJoin(schema.offerings, eq(schema.registrations.offeringId, schema.offerings.id))
    .innerJoin(schema.courses, eq(schema.offerings.courseId, schema.courses.id))
    .orderBy(asc(schema.registrations.enrolledAt));

  const headers = ["학생명", "학생이메일", "수업명", "유형", "상태", "대기순번", "신청일"];
  const rows = data.map((r) => headers.map((h) => {
    const v = r[h as keyof typeof r];
    return v instanceof Date ? v.toISOString().split("T")[0] : (v ?? "");
  }));
  return makeWorkbook(headers, rows);
}

export async function exportStudentScheduleAction(studentId: number, studentName: string) {
  requireStaff(await getCurrentUser());
  const data = await db
    .select({
      수업명: schema.courses.name,
      유형: schema.offerings.category,
      선생님: schema.instructors.name,
      날짜: schema.offeringSessions.sessionDate,
      시작: schema.offeringSessions.startTime,
      종료: schema.offeringSessions.endTime,
      강의실: schema.offerings.room,
      상태: schema.registrations.status,
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
    )
    .orderBy(schema.offeringSessions.sessionDate, schema.offeringSessions.startTime);

  const headers = ["수업명", "유형", "선생님", "날짜", "시작", "종료", "강의실", "상태"];
  const rows = data.map((r) => headers.map((h) => {
    const v = r[h as keyof typeof r];
    return typeof v === "object" && v !== null && "toISOString" in v
      ? (v as Date).toISOString().split("T")[0]
      : String(v ?? "");
  }));
  return makeWorkbook(headers, rows);
}

function parseTime(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  // Already in HH:MM or HH:MM:SS format
  if (t.includes(":")) return t.length === 5 ? `${t}:00` : t;
  // HHMM or HMM format
  if (t.length === 4) return `${t.substring(0, 2)}:${t.substring(2, 4)}:00`;
  if (t.length === 3) return `0${t.substring(0, 1)}:${t.substring(1, 3)}:00`;
  return "";
}

export async function importOfferingsAction(formData: FormData) {
  requireStaff(await getCurrentUser());
  const file = formData.get("file") as File;
  if (!file) return { error: "파일을 선택해주세요" };
  if (file.size > 5 * 1024 * 1024) return { error: "파일 크기는 5MB 이하여야 합니다" };

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1 }) as (string | number)[][];

  if (rows.length < 2) return { error: "데이터가 없습니다" };
  if (rows.length > 500) return { error: "한 번에 500개까지만 가져올 수 있습니다" };

  const headers = rows[0].map((h) => String(h).trim());
  const codeIdx = headers.findIndex((h) => h.includes("코드"));
  const nameIdx = headers.findIndex((h) => h.includes("수업명") || h.includes("과목명"));
  const catIdx = headers.findIndex((h) => h.includes("유형"));
  const teacherIdx = headers.findIndex((h) => h.includes("선생님"));
  const roomIdx = headers.findIndex((h) => h.includes("강의실"));
  const capacityIdx = headers.findIndex((h) => h.includes("정원"));
  const dateIdx = headers.findIndex((h) => h.includes("날짜"));
  const startIdx = headers.findIndex((h) => h.includes("시작") || h.includes("시작시간"));
  const endIdx = headers.findIndex((h) => h.includes("종료") || h.includes("종료시간"));

  const validCategories = ["NORMAL_SEASON", "ONE_UP", "SPECIAL", "ESSAY_SPECIAL", "CUSTOM"];
  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !c)) continue;

    const code = String(row[codeIdx] ?? "").trim();
    const name = String(row[nameIdx] ?? "").trim();
    const category = String(row[catIdx] ?? "NORMAL_SEASON").trim();
    const teacherName = String(row[teacherIdx] ?? "").trim();
    const room = String(row[roomIdx] ?? "").trim();
    const capacity = Number(row[capacityIdx]) || 20;
    const sessionDate = dateIdx >= 0 ? String(row[dateIdx] ?? "").trim() : "";
    const startTime = startIdx >= 0 ? String(row[startIdx] ?? "").trim() : "";
    const endTime = endIdx >= 0 ? String(row[endIdx] ?? "").trim() : "";

    if (!code || !name) {
      errors.push(`${i + 1}행: 코드와 수업명은 필수입니다`);
      continue;
    }
    if (!validCategories.includes(category)) {
      errors.push(`${i + 1}행: 유효하지 않은 유형 (${category})`);
      continue;
    }
    if (capacity < 1 || capacity > 999) {
      errors.push(`${i + 1}행: 정원은 1~999 사이여야 합니다`);
      continue;
    }

    try {
      await db.transaction(async (tx) => {
        let courseId: number;
        const [existing] = await tx.select({ id: schema.courses.id }).from(schema.courses).where(eq(schema.courses.code, code)).limit(1);
        if (existing) {
          courseId = existing.id;
        } else {
          const [c] = await tx.insert(schema.courses).values({ code, name, subject: "" }).returning({ id: schema.courses.id });
          courseId = c.id;
        }

        let instructorId: number | undefined;
        if (teacherName) {
          const [inst] = await tx.select({ id: schema.instructors.id }).from(schema.instructors).where(eq(schema.instructors.name, teacherName)).limit(1);
          instructorId = inst?.id;
        }

        const [off] = await tx.insert(schema.offerings).values({
          courseId,
          instructorId,
          category: category as typeof schema.offeringCategoryEnum.enumValues[number],
          capacity,
          room: room || undefined,
          status: "PUBLISHED",
          sectionCode: code,
        }).returning({ id: schema.offerings.id });

        if (sessionDate && startTime && endTime) {
          await tx.insert(schema.offeringSessions).values({
            offeringId: off.id,
            sessionDate: sessionDate,
            startTime: parseTime(startTime),
            endTime: parseTime(endTime),
          });
        }
      });
      imported++;
    } catch (e) {
      errors.push(`${i + 1}행: ${String(e)}`);
    }
  }

  return { data: { imported, errors } };
}

export async function importStudentsAction(formData: FormData) {
  requireStaff(await getCurrentUser());
  const file = formData.get("file") as File;
  if (!file) return { error: "파일을 선택해주세요" };
  if (file.size > 5 * 1024 * 1024) return { error: "파일 크기는 5MB 이하여야 합니다" };

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1 }) as (string | number)[][];

  if (rows.length < 2) return { error: "데이터가 없습니다" };
  if (rows.length > 500) return { error: "한 번에 500명까지만 가져올 수 있습니다" };

  const headers = rows[0].map((h) => String(h).trim());
  const nameIdx = headers.findIndex((h) => h.includes("이름"));
  const emailIdx = headers.findIndex((h) => h.includes("이메일"));
  const phoneIdx = headers.findIndex((h) => h.includes("연락처"));
  const gradeIdx = headers.findIndex((h) => h.includes("학년"));

  let imported = 0;
  const errors: string[] = [];
  const bcrypt = await import("bcryptjs");
  const defaultHash = await bcrypt.hash("12345", 10);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !c)) continue;

    const name = String(row[nameIdx] ?? "").trim();
    const email = String(row[emailIdx] ?? "").trim();
    const phone = String(row[phoneIdx] ?? "").trim();
    const grade = String(row[gradeIdx] ?? "고3").trim();

    if (!name || !email) {
      errors.push(`${i + 1}행: 이름과 이메일은 필수입니다`);
      continue;
    }

    try {
      await db.transaction(async (tx) => {
        const [existing] = await tx.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
        if (existing) throw new Error(`이미 존재하는 이메일`);
        const [user] = await tx.insert(schema.users).values({ email, name, phone: phone || null, role: "STUDENT", passwordHash: defaultHash }).returning({ id: schema.users.id });
        await tx.insert(schema.studentProfiles).values({ userId: user.id, schoolGrade: grade });
      });
      imported++;
    } catch (e) {
      errors.push(`${i + 1}행: ${String(e)}`);
    }
  }

  return { data: { imported, errors } };
}

export async function importRegistrationsAction(formData: FormData) {
  requireStaff(await getCurrentUser());
  const file = formData.get("file") as File;
  if (!file) return { error: "파일을 선택해주세요" };
  if (file.size > 5 * 1024 * 1024) return { error: "파일 크기는 5MB 이하여야 합니다" };

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1 }) as (string | number)[][];

  if (rows.length < 2) return { error: "데이터가 없습니다" };

  const headers = rows[0].map((h) => String(h).trim());
  const emailIdx = headers.findIndex((h) => h.includes("이메일") || h.includes("학생"));
  const codeIdx = headers.findIndex((h) => h.includes("코드") || h.includes("수업코드"));

  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !c)) continue;

    const email = String(row[emailIdx] ?? "").trim();
    const code = String(row[codeIdx] ?? "").trim();

    if (!email || !code) {
      errors.push(`${i + 1}행: 이메일과 수업코드는 필수입니다`);
      continue;
    }

    try {
      await db.transaction(async (tx) => {
        const [student] = await tx.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
        if (!student) throw new Error("학생을 찾을 수 없습니다");

        const [course] = await tx.select({ id: schema.courses.id }).from(schema.courses).where(eq(schema.courses.code, code)).limit(1);
        if (!course) throw new Error("수업을 찾을 수 없습니다");

        const [offering] = await tx.select({ id: schema.offerings.id, capacity: schema.offerings.capacity }).from(schema.offerings).where(
          and(eq(schema.offerings.courseId, course.id), eq(schema.offerings.status, "PUBLISHED"))
        ).orderBy(schema.offerings.id).limit(1);
        if (!offering) throw new Error("개설된 수업이 없습니다");

        const [existing] = await tx.select({ id: schema.registrations.id }).from(schema.registrations).where(and(eq(schema.registrations.userId, student.id), eq(schema.registrations.offeringId, offering.id), sql`${schema.registrations.status} IN ('CONFIRMED', 'WAITLISTED')`)).limit(1);
        if (existing) throw new Error("이미 신청한 수업입니다");

        const [confirmed] = await tx.select({ c: sql<number>`COUNT(*)` }).from(schema.registrations).where(and(eq(schema.registrations.offeringId, offering.id), eq(schema.registrations.status, "CONFIRMED"))).then(r => [r[0]]);
        const isFull = Number(confirmed?.c ?? 0) >= offering.capacity;

        // Get active period's registration window
        const [period] = await tx.select({ id: schema.academicPeriods.id }).from(schema.academicPeriods).where(eq(schema.academicPeriods.isActive, 1)).orderBy(schema.academicPeriods.id).limit(1);
        const periodId = period?.id ?? 1;
        const [w] = await tx.select({ id: schema.registrationWindows.id }).from(schema.registrationWindows).where(eq(schema.registrationWindows.periodId, periodId)).orderBy(schema.registrationWindows.id).limit(1);
        const [batch] = await tx.insert(schema.registrationBatches).values({ userId: student.id, windowId: w?.id ?? 1, reviewToken: `import-${Date.now()}` }).returning({ id: schema.registrationBatches.id });

        if (isFull) {
          const [waitCount] = await tx.select({ c: sql<number>`COUNT(*)` }).from(schema.registrations).where(and(eq(schema.registrations.offeringId, offering.id), eq(schema.registrations.status, "WAITLISTED")));
          await tx.insert(schema.registrations).values({ batchId: batch.id, userId: student.id, offeringId: offering.id, status: "WAITLISTED", waitlistSequence: Number(waitCount?.c ?? 0) + 1 });
        } else {
          await tx.insert(schema.registrations).values({ batchId: batch.id, userId: student.id, offeringId: offering.id, status: "CONFIRMED" });
        }
      });
      imported++;
    } catch (e) {
      errors.push(`${i + 1}행: ${String(e)}`);
    }
  }

  return { data: { imported, errors } };
}
