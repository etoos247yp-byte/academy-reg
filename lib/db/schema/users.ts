import { pgTable, serial, varchar, timestamp, pgEnum, text, integer } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["STUDENT", "STAFF", "ADMIN"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  role: roleEnum("role").notNull(),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const studentProfiles = pgTable("student_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  schoolGrade: varchar("school_grade", { length: 20 }),
  classCode: varchar("class_code", { length: 10 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
