"use server";

import { getDb } from "@/lib/db/connection";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function enrollAction(courseId: number) {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다" };

  const db = getDb();

  // Check capacity
  const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(courseId) as any;
  if (!course) return { error: "존재하지 않는 수업입니다" };

  const enrolled = db.prepare(
    "SELECT COUNT(*) as count FROM enrollments WHERE course_id = ? AND status = 'enrolled'"
  ).get(courseId) as any;

  if (enrolled.count >= course.capacity) {
    return { error: "정원이 마감되었습니다" };
  }

  // Check existing enrollment
  const existing = db.prepare(
    "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?"
  ).get(user.userId, courseId) as any;

  if (existing) {
    if (existing.status === "enrolled") {
      return { error: "이미 등록된 수업입니다" };
    }
    // Re-enroll if previously cancelled
    db.prepare(
      "UPDATE enrollments SET status = 'enrolled', enrolled_at = datetime('now'), cancelled_at = NULL WHERE id = ?"
    ).run(existing.id);
  } else {
    db.prepare(
      "INSERT INTO enrollments (user_id, course_id, status) VALUES (?, ?, 'enrolled')"
    ).run(user.userId, courseId);
  }

  revalidatePath("/student");
  revalidatePath("/admin");
  return { success: true };
}

export async function cancelAction(courseId: number) {
  const user = await getCurrentUser();
  if (!user) return { error: "로그인이 필요합니다" };

  const db = getDb();
  db.prepare(
    "UPDATE enrollments SET status = 'cancelled', cancelled_at = datetime('now') WHERE user_id = ? AND course_id = ? AND status = 'enrolled'"
  ).run(user.userId, courseId);

  revalidatePath("/student");
  revalidatePath("/admin");
  return { success: true };
}

export async function getMyEnrollments() {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getDb();
  return db.prepare(`
    SELECT e.*, c.title, c.instructor, c.schedule, c.location
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.user_id = ? AND e.status = 'enrolled'
    ORDER BY e.enrolled_at DESC
  `).all(user.userId);
}

export async function getAllEnrollments() {
  const db = getDb();
  return db.prepare(`
    SELECT e.*, u.name as student_name, u.email as student_email, c.title as course_title
    FROM enrollments e
    JOIN users u ON e.user_id = u.id
    JOIN courses c ON e.course_id = c.id
    ORDER BY e.enrolled_at DESC
  `).all();
}

export async function getStudents() {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE role = 'student' ORDER BY name").all();
}
