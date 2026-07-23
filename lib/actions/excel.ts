"use server";

import { getDb } from "@/lib/db/connection";
import { getCurrentUser } from "@/lib/auth/session";
import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";

export async function exportCoursesAction(): Promise<Uint8Array> {
  const db = getDb();
  const data = db.prepare(`
    SELECT c.title, c.description, c.instructor, c.schedule, c.capacity, c.location,
      COUNT(CASE WHEN e.status = 'enrolled' THEN 1 END) as enrolled
    FROM courses c
    LEFT JOIN enrollments e ON c.id = e.course_id
    GROUP BY c.id
    ORDER BY c.title
  `).all();

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Courses");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new Uint8Array(buf);
}

export async function exportEnrollmentsAction(): Promise<Uint8Array> {
  const db = getDb();
  const data = db.prepare(`
    SELECT u.name as student_name, u.email as student_email, u.phone,
      c.title as course_title, c.schedule, c.location,
      e.status, e.enrolled_at, e.cancelled_at
    FROM enrollments e
    JOIN users u ON e.user_id = u.id
    JOIN courses c ON e.course_id = c.id
    ORDER BY c.title, u.name
  `).all();

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Enrollments");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new Uint8Array(buf);
}

export async function importCoursesAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "권한이 없습니다" };

  const file = formData.get("file") as File;
  if (!file) return { error: "파일을 선택해주세요" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws) as any[];

  if (rows.length === 0) return { error: "데이터가 없습니다" };

  const db = getDb();
  const insert = db.prepare(
    "INSERT INTO courses (title, description, instructor, schedule, capacity, location) VALUES (?, ?, ?, ?, ?, ?)"
  );

  let imported = 0;
  for (const row of rows) {
    const title = row["title"] || row["수업명"] || row["Title"];
    if (!title) continue;

    insert.run(
      String(title),
      String(row["description"] || row["설명"] || row["Description"] || ""),
      String(row["instructor"] || row["강사"] || row["Instructor"] || ""),
      String(row["schedule"] || row["일정"] || row["Schedule"] || ""),
      Number(row["capacity"] || row["정원"] || row["Capacity"] || 20),
      String(row["location"] || row["강의실"] || row["Location"] || "")
    );
    imported++;
  }

  revalidatePath("/admin");
  return { success: true, imported };
}
