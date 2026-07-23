import { pgTable, serial, integer, timestamp, date, time } from "drizzle-orm/pg-core";
import { registrations } from "./registrations";
import { instructors } from "./instructors";
import { offerings } from "./offerings";

export const oneUpAssignments = pgTable("one_up_assignments", {
  id: serial("id").primaryKey(),
  registrationId: integer("registration_id")
    .notNull()
    .references(() => registrations.id, { onDelete: "cascade" })
    .unique(),
  instructorId: integer("instructor_id")
    .notNull()
    .references(() => instructors.id),
  offeringId: integer("offering_id")
    .notNull()
    .references(() => offerings.id),
  sessionDate: date("session_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});
