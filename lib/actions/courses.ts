"use server";

import { getDb } from "@/lib/db/connection";
import { getCurrentUser } from "@/lib/auth/session";
import { courseSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export async function getCourses() {
  const db = getDb();
  const courses = db.prepare(`
    SELECT c.*, 
      COUNT(CASE WHEN e.status = 'enrolled' THEN 1 END) as enrolled_count
    FROM courses c
    LEFT JOIN enrollments e ON c.id = e.course_id
    GROUP BY c.id
    ORDER BY c.title
  `).all();
  return courses;
}

export async function getCourseById(id: number) {
  const db = getDb();
  return db.prepare("SELECT * FROM courses WHERE id = ?").get(id);
}

export async function createCourseAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "권한이 없습니다" };

  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    instructor: formData.get("instructor"),
    schedule: formData.get("schedule"),
    capacity: formData.get("capacity"),
    location: formData.get("location"),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { title, description, instructor, schedule, capacity, location } = parsed.data;
  const db = getDb();
  db.prepare(
    "INSERT INTO courses (title, description, instructor, schedule, capacity, location) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(title, description || "", instructor || "", schedule || "", capacity, location || "");

  revalidatePath("/admin");
  revalidatePath("/student");
  return { success: true };
}

export async function updateCourseAction(id: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "권한이 없습니다" };

  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    instructor: formData.get("instructor"),
    schedule: formData.get("schedule"),
    capacity: formData.get("capacity"),
    location: formData.get("location"),
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { title, description, instructor, schedule, capacity, location } = parsed.data;
  const db = getDb();
  db.prepare(
    "UPDATE courses SET title=?, description=?, instructor=?, schedule=?, capacity=?, location=? WHERE id=?"
  ).run(title, description || "", instructor || "", schedule || "", capacity, location || "", id);

  revalidatePath("/admin");
  revalidatePath("/student");
  return { success: true };
}

export async function deleteCourseAction(id: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "권한이 없습니다" };

  const db = getDb();
  db.prepare("DELETE FROM courses WHERE id = ?").run(id);
  revalidatePath("/admin");
  revalidatePath("/student");
  return { success: true };
}
