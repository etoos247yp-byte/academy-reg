import { pgTable, serial, varchar, integer } from "drizzle-orm/pg-core";

export const instructors = pgTable("instructors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  oneUpCapacity: integer("one_up_capacity").notNull().default(0),
});
