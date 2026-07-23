CREATE INDEX IF NOT EXISTS "idx_offerings_period" ON "offerings" USING btree ("period_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_offerings_category" ON "offerings" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_offerings_status" ON "offerings" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reg_batches_user" ON "registration_batches" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_reg_user_offering_active" ON "registrations" USING btree ("user_id","offering_id") WHERE "registrations"."status" IN ('CONFIRMED', 'WAITLISTED');--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reg_user_status" ON "registrations" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reg_offering_status" ON "registrations" USING btree ("offering_id","status");