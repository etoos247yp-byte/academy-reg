import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  text,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { offerings } from "./offerings";
import { registrationWindows } from "./academic-periods";

export const registrationBatches = pgTable(
  "registration_batches",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    windowId: integer("window_id")
      .notNull()
      .references(() => registrationWindows.id),
    reviewToken: varchar("review_token", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdIdx: index("idx_reg_batches_user").on(t.userId),
  }),
);

export const registrations = pgTable(
  "registrations",
  {
    id: serial("id").primaryKey(),
    batchId: integer("batch_id")
      .notNull()
      .references(() => registrationBatches.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    offeringId: integer("offering_id")
      .notNull()
      .references(() => offerings.id),
    status: varchar("status", { length: 20 }).notNull(),
    waitlistSequence: integer("waitlist_sequence"),
    enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
    cancelledAt: timestamp("cancelled_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdOfferingIdx: uniqueIndex("idx_reg_user_offering_active")
      .on(t.userId, t.offeringId)
      .where(sql`${t.status} IN ('CONFIRMED', 'WAITLISTED')`),
    userIdStatusIdx: index("idx_reg_user_status").on(t.userId, t.status),
    offeringStatusIdx: index("idx_reg_offering_status").on(t.offeringId, t.status),
  }),
);

export const registrationDisclosures = pgTable("registration_disclosures", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id")
    .notNull()
    .references(() => registrationBatches.id),
  disclosureText: text("disclosure_text").notNull(),
  normalCount: integer("normal_count").notNull(),
  tierMonthlySurcharge: integer("tier_monthly_surcharge").notNull(),
  acceptedAt: timestamp("accepted_at").notNull().defaultNow(),
});

export const registrationEvents = pgTable("registration_events", {
  id: serial("id").primaryKey(),
  registrationId: integer("registration_id")
    .notNull()
    .references(() => registrations.id, { onDelete: "cascade" }),
  actorId: integer("actor_id")
    .notNull()
    .references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(),
  previousState: jsonb("previous_state"),
  newState: jsonb("new_state"),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
