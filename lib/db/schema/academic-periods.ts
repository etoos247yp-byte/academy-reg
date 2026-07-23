import { pgTable, serial, varchar, timestamp, text, integer, date } from "drizzle-orm/pg-core";

export const academicPeriods = pgTable("academic_periods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  periodType: varchar("period_type", { length: 50 }).notNull().default("SEMESTER"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  billingDays: integer("billing_days"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const registrationWindows = pgTable("registration_windows", {
  id: serial("id").primaryKey(),
  periodId: integer("period_id")
    .notNull()
    .references(() => academicPeriods.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  opensAt: timestamp("opens_at").notNull(),
  closesAt: timestamp("closes_at").notNull(),
  addDropClosesAt: timestamp("add_drop_closes_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
