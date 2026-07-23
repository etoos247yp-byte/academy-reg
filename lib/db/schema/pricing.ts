import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { offerings } from "./offerings";

export const pricingTemplates = pgTable("pricing_templates", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 50 }).notNull(),
  priceModelType: varchar("price_model_type", { length: 50 }).notNull(),
  label: varchar("label", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pricingTemplateVersions = pgTable("pricing_template_versions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id")
    .notNull()
    .references(() => pricingTemplates.id),
  version: integer("version").notNull().default(1),
  config: jsonb("config").notNull(),
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const offeringPricing = pgTable("offering_pricing", {
  id: serial("id").primaryKey(),
  offeringId: integer("offering_id")
    .notNull()
    .references(() => offerings.id, { onDelete: "cascade" })
    .unique(),
  templateVersionId: integer("template_version_id").references(
    () => pricingTemplateVersions.id,
  ),
  priceAmountPerSession: integer("price_amount_per_session").notNull(),
  sessionCount: integer("session_count").notNull(),
  packageTotal: integer("package_total").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
