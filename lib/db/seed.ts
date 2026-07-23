import { getDb } from "./connection";
import bcrypt from "bcryptjs";

export function seedDatabase() {
  const db = getDb();

  const existingAdmin = db
    .prepare("SELECT id FROM users WHERE role = 'admin'")
    .get();
  if (existingAdmin) {
    console.log("Seed data already exists, skipping.");
    return;
  }

  const hash = bcrypt.hashSync("admin123", 10);
  db.prepare(
    "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)"
  ).run("admin@academy.com", hash, "Admin", "admin");

  db.prepare(
    "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)"
  ).run("student@test.com", bcrypt.hashSync("student123", 10), "Test Student", "student");

  const courses = [
    { title: "기초 영어 회화", description: "초급자를 위한 영어 회화 수업", instructor: "김영희", schedule: "월/수 10:00-11:30", capacity: 15, location: "301호" },
    { title: "중급 영어 회화", description: "중급자를 위한 영어 회화 수업", instructor: "김영희", schedule: "화/목 14:00-15:30", capacity: 12, location: "302호" },
    { title: "비즈니스 영어", description: "비즈니스 상황에서의 영어 커뮤니케이션", instructor: "박철수", schedule: "월/수 19:00-20:30", capacity: 20, location: "303호" },
    { title: "TOEIC 대비반", description: "TOEIC 800점 목표 집중반", instructor: "이미영", schedule: "토 10:00-13:00", capacity: 25, location: "401호" },
    { title: "주니어 영어", description: "초등학생을 위한 기초 영어", instructor: "최수진", schedule: "월/수/금 16:00-17:30", capacity: 10, location: "201호" },
  ];

  const insertCourse = db.prepare(
    "INSERT INTO courses (title, description, instructor, schedule, capacity, location) VALUES (?, ?, ?, ?, ?, ?)"
  );

  for (const c of courses) {
    insertCourse.run(c.title, c.description, c.instructor, c.schedule, c.capacity, c.location);
  }

  console.log("Database seeded with admin and sample courses.");
}

// Run directly
seedDatabase();
