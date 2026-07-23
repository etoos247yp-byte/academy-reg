"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { requireStaff } from "@/lib/auth/authorization";
import { revalidatePath } from "next/cache";
import { MOCK_OFFERINGS, MOCK_STUDENTS, MOCK_INSTRUCTORS } from "@/lib/db/mock-data";
import { MOCK_ALL_REGISTRATIONS } from "@/lib/db/test-mode";

function isTest() { return process.env.TEST_MODE === "true"; }

// ── Student CRUD ──

export async function createStudentAction(form: {
  name: string; email: string; phone: string; schoolGrade: string; classCode: string; highSchool: string;
}) {
  requireStaff(await getCurrentUser());
  if (isTest()) {
    const id = Math.max(0, ...MOCK_STUDENTS.map((s) => s.id)) + 1;
    MOCK_STUDENTS.push({
      id, name: form.name, email: form.email, phone: form.phone || null,
      schoolGrade: form.schoolGrade || null, classCode: form.classCode || null,
      highSchool: form.highSchool || null, createdAt: new Date(),
    } as (typeof MOCK_STUDENTS)[number]);
    revalidatePath("/staff/students");
    return { success: true };
  }
  // DB implementation would go here
  return { success: false, error: "DB not connected" };
}

export async function updateStudentAction(id: number, form: {
  name: string; email: string; phone: string; schoolGrade: string; classCode: string; highSchool: string;
}) {
  requireStaff(await getCurrentUser());
  if (isTest()) {
    const idx = MOCK_STUDENTS.findIndex((s) => s.id === id);
    if (idx >= 0) { MOCK_STUDENTS[idx] = { ...MOCK_STUDENTS[idx], ...form }; revalidatePath("/staff/students"); return { success: true }; }
    return { error: "학생을 찾을 수 없습니다" };
  }
  return { success: false, error: "DB not connected" };
}

export async function deleteStudentAction(id: number) {
  requireStaff(await getCurrentUser());
  if (isTest()) {
    const idx = MOCK_STUDENTS.findIndex((s) => s.id === id);
    if (idx >= 0) { MOCK_STUDENTS.splice(idx, 1); revalidatePath("/staff/students"); return { success: true }; }
    return { error: "학생을 찾을 수 없습니다" };
  }
  return { success: false, error: "DB not connected" };
}

// ── Offering CRUD ──

export async function createOfferingAction(form: {
  code: string; courseName: string; category: string; teacher: string; capacity: number; room: string;
}) {
  requireStaff(await getCurrentUser());
  if (isTest()) {
    const id = Math.max(0, ...MOCK_OFFERINGS.map((o) => o.id)) + 1;
    MOCK_OFFERINGS.push({
      id, code: form.code, courseName: form.courseName, category: form.category,
      teacher: form.teacher || null, capacity: form.capacity, status: "PUBLISHED",
      subject: "", confirmedCount: 0, waitlistCount: 0,
    } as (typeof MOCK_OFFERINGS)[number]);
    revalidatePath("/staff/offerings");
    return { success: true };
  }
  return { success: false, error: "DB not connected" };
}

export async function updateOfferingAction(id: number, form: {
  code: string; courseName: string; category: string; teacher: string; capacity: number; status: string;
}) {
  requireStaff(await getCurrentUser());
  if (isTest()) {
    const idx = MOCK_OFFERINGS.findIndex((o) => o.id === id);
    if (idx >= 0) { MOCK_OFFERINGS[idx] = { ...MOCK_OFFERINGS[idx], ...form }; revalidatePath("/staff/offerings"); return { success: true }; }
    return { error: "수업을 찾을 수 없습니다" };
  }
  return { success: false, error: "DB not connected" };
}

export async function deleteOfferingAction(id: number) {
  requireStaff(await getCurrentUser());
  if (isTest()) {
    const idx = MOCK_OFFERINGS.findIndex((o) => o.id === id);
    if (idx >= 0) { MOCK_OFFERINGS.splice(idx, 1); revalidatePath("/staff/offerings"); return { success: true }; }
    return { error: "수업을 찾을 수 없습니다" };
  }
  return { success: false, error: "DB not connected" };
}

// ── Registration CRUD ──

export async function cancelRegistrationAction(registrationId: number) {
  requireStaff(await getCurrentUser());
  if (isTest()) {
    const idx = MOCK_ALL_REGISTRATIONS.findIndex((r) => r.id === registrationId);
    if (idx >= 0) { MOCK_ALL_REGISTRATIONS.splice(idx, 1); revalidatePath("/staff/registrations"); return { success: true }; }
    return { error: "수강신청을 찾을 수 없습니다" };
  }
  return { success: false, error: "DB not connected" };
}

export async function enrollStudentAction(studentEmail: string, offeringId: number) {
  requireStaff(await getCurrentUser());
  if (isTest()) {
    const student = MOCK_STUDENTS.find((s) => s.email === studentEmail);
    if (!student) return { error: "학생을 찾을 수 없습니다" };
    const offering = MOCK_OFFERINGS.find((o) => o.id === offeringId);
    if (!offering) return { error: "수업을 찾을 수 없습니다" };
    if (MOCK_ALL_REGISTRATIONS.some((r) => r.studentEmail === studentEmail && r.offeringId === offeringId))
      return { error: "이미 신청된 수업입니다" };
    const id = Math.max(0, ...MOCK_ALL_REGISTRATIONS.map((r) => r.id)) + 1;
    MOCK_ALL_REGISTRATIONS.push({
      id, userId: student.id, studentName: student.name, studentEmail: student.email,
      offeringId, status: "CONFIRMED", enrolledAt: new Date(), courseName: offering.courseName,
      category: offering.category, waitlistSequence: null,
    });
    revalidatePath("/staff/registrations");
    return { success: true };
  }
  return { success: false, error: "DB not connected" };
}

// ── Instructor CRUD ──

export async function createInstructorAction(form: {
  name: string; subject: string; phone: string; oneUpCapacity: number;
}) {
  requireStaff(await getCurrentUser());
  if (isTest()) {
    const id = Math.max(0, ...MOCK_INSTRUCTORS.map((i) => i.id)) + 1;
    MOCK_INSTRUCTORS.push({ id, ...form, phone: form.phone || null } as (typeof MOCK_INSTRUCTORS)[number]);
    revalidatePath("/staff/instructors");
    return { success: true };
  }
  return { success: false, error: "DB not connected" };
}

export async function updateInstructorAction(id: number, form: {
  name: string; subject: string; phone: string; oneUpCapacity: number;
}) {
  requireStaff(await getCurrentUser());
  if (isTest()) {
    const idx = MOCK_INSTRUCTORS.findIndex((i) => i.id === id);
    if (idx >= 0) { MOCK_INSTRUCTORS[idx] = { ...MOCK_INSTRUCTORS[idx], ...form, phone: form.phone || null } as (typeof MOCK_INSTRUCTORS)[number]; revalidatePath("/staff/instructors"); return { success: true }; }
    return { error: "강사를 찾을 수 없습니다" };
  }
  return { success: false, error: "DB not connected" };
}

export async function deleteInstructorAction(id: number) {
  requireStaff(await getCurrentUser());
  if (isTest()) {
    const idx = MOCK_INSTRUCTORS.findIndex((i) => i.id === id);
    if (idx >= 0) { MOCK_INSTRUCTORS.splice(idx, 1); revalidatePath("/staff/instructors"); return { success: true }; }
    return { error: "강사를 찾을 수 없습니다" };
  }
  return { success: false, error: "DB not connected" };
}
