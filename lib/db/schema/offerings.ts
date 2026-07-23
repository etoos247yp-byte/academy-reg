import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  text,
  date,
  time,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { courses } from "./courses";
import { instructors } from "./instructors";
import { academicPeriods } from "./academic-periods";

export const offeringCategoryEnum = pgEnum("offering_category", [
  "NORMAL_SEASON",
  "ONE_UP",
  "SPECIAL",
  "ESSAY_SPECIAL",
  "CUSTOM",
]);

export const offeringStatusEnum = pgEnum("offering_status", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

export const offerings = pgTable(
  "offerings",
  {
    id: serial("id").primaryKey(),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id),
    periodId: integer("period_id").references(() => academicPeriods.id),
    instructorId: integer("instructor_id").references(() => instructors.id),
    sectionCode: varchar("section_code", { length: 50 }),
    category: offeringCategoryEnum("category").notNull(),
    capacity: integer("capacity").notNull().default(20),
    status: offeringStatusEnum("status").notNull().default("DRAFT"),
    room: varchar("room", { length: 100 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    periodIdx: index("idx_offerings_period").on(t.periodId),
    categoryIdx: index("idx_offerings_category").on(t.category),
    statusIdx: index("idx_offerings_status").on(t.status),
  }),
);

export const offeringSessions = pgTable("offering_sessions", {
  id: serial("id").primaryKey(),
  offeringId: integer("offering_id")
    .notNull()
    .references(() => offerings.id, { onDelete: "cascade" }),
  sessionDate: date("session_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
});
