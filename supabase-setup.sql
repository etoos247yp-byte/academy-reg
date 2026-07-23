-- ========== SUPABASE SETUP SQL ==========
-- Copy everything below and paste into Supabase SQL Editor
-- https://supabase.com/dashboard/project/eysamlflwidgvkitkonc/sql/new

-- TYPES
DO $$ BEGIN CREATE TYPE "public"."offering_category" AS ENUM('NORMAL_SEASON','ONE_UP','SPECIAL','ESSAY_SPECIAL','CUSTOM'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."offering_status" AS ENUM('DRAFT','PUBLISHED','ARCHIVED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "public"."user_role" AS ENUM('STUDENT','STAFF','ADMIN'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- TABLES
CREATE TABLE IF NOT EXISTS "academic_periods" ("id" serial PRIMARY KEY,"name" varchar(200) NOT NULL,"period_type" varchar(50) DEFAULT 'SEMESTER' NOT NULL,"start_date" date NOT NULL,"end_date" date NOT NULL,"billing_days" integer,"is_active" integer DEFAULT 1 NOT NULL,"created_at" timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS "registration_windows" ("id" serial PRIMARY KEY,"period_id" integer NOT NULL,"name" varchar(200) NOT NULL,"opens_at" timestamp NOT NULL,"closes_at" timestamp NOT NULL,"add_drop_closes_at" timestamp,"created_at" timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS "courses" ("id" serial PRIMARY KEY,"code" varchar(50) UNIQUE NOT NULL,"name" varchar(200) NOT NULL,"description" text,"subject" varchar(100));
CREATE TABLE IF NOT EXISTS "instructors" ("id" serial PRIMARY KEY,"name" varchar(100) NOT NULL,"subject" varchar(100),"phone" varchar(20),"one_up_capacity" integer DEFAULT 0 NOT NULL);
CREATE TABLE IF NOT EXISTS "users" ("id" serial PRIMARY KEY,"email" varchar(255) UNIQUE NOT NULL,"password_hash" varchar(255) NOT NULL,"name" varchar(100) NOT NULL,"role" "user_role" NOT NULL,"phone" varchar(20),"created_at" timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS "student_profiles" ("id" serial PRIMARY KEY,"user_id" integer UNIQUE NOT NULL,"school_grade" varchar(20),"notes" text,"created_at" timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS "offerings" ("id" serial PRIMARY KEY,"course_id" integer NOT NULL,"period_id" integer,"instructor_id" integer,"section_code" varchar(50),"category" "offering_category" NOT NULL,"capacity" integer DEFAULT 20 NOT NULL,"status" "offering_status" DEFAULT 'DRAFT' NOT NULL,"room" varchar(100),"notes" text,"created_at" timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS "offering_sessions" ("id" serial PRIMARY KEY,"offering_id" integer NOT NULL,"session_date" date NOT NULL,"start_time" time NOT NULL,"end_time" time NOT NULL);
CREATE TABLE IF NOT EXISTS "offering_pricing" ("id" serial PRIMARY KEY,"offering_id" integer UNIQUE NOT NULL,"template_version_id" integer,"price_amount_per_session" integer NOT NULL,"session_count" integer NOT NULL,"package_total" integer NOT NULL,"created_at" timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS "pricing_templates" ("id" serial PRIMARY KEY,"category" varchar(50) NOT NULL,"price_model_type" varchar(50) NOT NULL,"label" varchar(200) NOT NULL,"created_at" timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS "pricing_template_versions" ("id" serial PRIMARY KEY,"template_id" integer NOT NULL,"version" integer DEFAULT 1 NOT NULL,"config" jsonb NOT NULL,"effective_from" timestamp DEFAULT now(),"created_at" timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS "registration_batches" ("id" serial PRIMARY KEY,"user_id" integer NOT NULL,"window_id" integer NOT NULL,"review_token" varchar(128) NOT NULL,"created_at" timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS "registrations" ("id" serial PRIMARY KEY,"batch_id" integer NOT NULL,"user_id" integer NOT NULL,"offering_id" integer NOT NULL,"status" varchar(20) NOT NULL,"waitlist_sequence" integer,"enrolled_at" timestamp DEFAULT now(),"cancelled_at" timestamp,"created_at" timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS "registration_disclosures" ("id" serial PRIMARY KEY,"batch_id" integer NOT NULL,"disclosure_text" text NOT NULL,"normal_count" integer NOT NULL,"tier_monthly_surcharge" integer NOT NULL,"accepted_at" timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS "registration_events" ("id" serial PRIMARY KEY,"registration_id" integer NOT NULL,"actor_id" integer NOT NULL,"action" varchar(50) NOT NULL,"previous_state" jsonb,"new_state" jsonb,"reason" text,"created_at" timestamp DEFAULT now());
CREATE TABLE IF NOT EXISTS "one_up_assignments" ("id" serial PRIMARY KEY,"registration_id" integer UNIQUE NOT NULL,"instructor_id" integer NOT NULL,"offering_id" integer NOT NULL,"session_date" date NOT NULL,"start_time" time NOT NULL,"end_time" time NOT NULL,"assigned_at" timestamp DEFAULT now());

-- INDEXES
CREATE INDEX IF NOT EXISTS "idx_offerings_period" ON "offerings" ("period_id");
CREATE INDEX IF NOT EXISTS "idx_offerings_category" ON "offerings" ("category");
CREATE INDEX IF NOT EXISTS "idx_offerings_status" ON "offerings" ("status");
CREATE INDEX IF NOT EXISTS "idx_reg_batches_user" ON "registration_batches" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_reg_user_offering_active" ON "registrations" ("user_id","offering_id") WHERE "registrations"."status" IN ('CONFIRMED','WAITLISTED');
CREATE INDEX IF NOT EXISTS "idx_reg_user_status" ON "registrations" ("user_id","status");
CREATE INDEX IF NOT EXISTS "idx_reg_offering_status" ON "registrations" ("offering_id","status");

-- FOREIGN KEYS
ALTER TABLE "registration_windows" ADD CONSTRAINT fk_rw_period FOREIGN KEY ("period_id") REFERENCES "academic_periods"("id") ON DELETE CASCADE;
ALTER TABLE "offerings" ADD CONSTRAINT fk_o_course FOREIGN KEY ("course_id") REFERENCES "courses"("id");
ALTER TABLE "offerings" ADD CONSTRAINT fk_o_period FOREIGN KEY ("period_id") REFERENCES "academic_periods"("id");
ALTER TABLE "offerings" ADD CONSTRAINT fk_o_instructor FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id");
ALTER TABLE "offering_sessions" ADD CONSTRAINT fk_os_offering FOREIGN KEY ("offering_id") REFERENCES "offerings"("id") ON DELETE CASCADE;
ALTER TABLE "offering_pricing" ADD CONSTRAINT fk_op_offering FOREIGN KEY ("offering_id") REFERENCES "offerings"("id") ON DELETE CASCADE;
ALTER TABLE "offering_pricing" ADD CONSTRAINT fk_op_template FOREIGN KEY ("template_version_id") REFERENCES "pricing_template_versions"("id");
ALTER TABLE "pricing_template_versions" ADD CONSTRAINT fk_ptv_template FOREIGN KEY ("template_id") REFERENCES "pricing_templates"("id");
ALTER TABLE "registration_batches" ADD CONSTRAINT fk_rb_user FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "registration_batches" ADD CONSTRAINT fk_rb_window FOREIGN KEY ("window_id") REFERENCES "registration_windows"("id");
ALTER TABLE "registrations" ADD CONSTRAINT fk_r_batch FOREIGN KEY ("batch_id") REFERENCES "registration_batches"("id");
ALTER TABLE "registrations" ADD CONSTRAINT fk_r_user FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "registrations" ADD CONSTRAINT fk_r_offering FOREIGN KEY ("offering_id") REFERENCES "offerings"("id");
ALTER TABLE "registration_disclosures" ADD CONSTRAINT fk_rd_batch FOREIGN KEY ("batch_id") REFERENCES "registration_batches"("id");
ALTER TABLE "registration_events" ADD CONSTRAINT fk_re_registration FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE CASCADE;
ALTER TABLE "registration_events" ADD CONSTRAINT fk_re_actor FOREIGN KEY ("actor_id") REFERENCES "users"("id");
ALTER TABLE "student_profiles" ADD CONSTRAINT fk_sp_user FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "one_up_assignments" ADD CONSTRAINT fk_oua_registration FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE CASCADE;
ALTER TABLE "one_up_assignments" ADD CONSTRAINT fk_oua_instructor FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id");
ALTER TABLE "one_up_assignments" ADD CONSTRAINT fk_oua_offering FOREIGN KEY ("offering_id") REFERENCES "offerings"("id");

-- ========== SEED DATA ==========

-- Test Users (password: 1234 for admin/staff, 12345 for students)
INSERT INTO "users" ("email","password_hash","name","role","phone") VALUES
('1234','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','관리자','ADMIN','010-0000-0001'),
('staff@eetoos.kr','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','박선생','STAFF','010-0000-0002'),
('12345','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','테스트학생','STUDENT','010-9999-9999')
ON CONFLICT DO NOTHING;

-- Student profiles
INSERT INTO "student_profiles" ("user_id","school_grade") SELECT id,'고3' FROM "users" WHERE role='STUDENT' ON CONFLICT DO NOTHING;

-- Academic period
INSERT INTO "academic_periods" ("name","period_type","start_date","end_date","billing_days") VALUES
('2026년 7월 정규학기','SEMESTER','2026-07-06','2026-07-31',26);

-- Registration window
INSERT INTO "registration_windows" ("period_id","name","opens_at","closes_at") 
SELECT id,'2026년 7월 수강신청','2026-01-01 00:00:00+09','2027-12-31 18:00:00+09' FROM "academic_periods" LIMIT 1;

-- Instructors
INSERT INTO "instructors" ("name","subject","one_up_capacity") VALUES
('김민철','국어',5),('이수진','영어',5),('박성호','수학',5),('최은영','사탐',3),('정태웅','과탐',3);

-- Courses
INSERT INTO "courses" ("code","name","subject") VALUES
('KOR-01','국어','국어'),('ENG-01','영어','영어'),('MATH-01','수학','수학'),
('SOC-01','사회문화','사탐'),('SCI-01','물리학I','과탐'),('ONEUP-KOR','국어 원업','국어'),
('ONEUP-ENG','영어 원업','영어'),('SPC-ALL','여름방학 특강','종합');

-- Offerings with sessions (Mon-Fri grid)
WITH period AS (SELECT id FROM "academic_periods" LIMIT 1),
ins AS (SELECT id,row_number() over() rn FROM "instructors"),
c AS (SELECT id,row_number() over() rn FROM "courses")
INSERT INTO "offerings" ("course_id","period_id","instructor_id","section_code","category","capacity","status","room")
SELECT c.id, period.id, ins.id, 'N'||c.rn, 'NORMAL_SEASON', 20, 'PUBLISHED', (200+c.rn)||'호'
FROM c, period, ins WHERE c.rn <= 5 AND ins.rn = ((c.rn-1)%5)+1;

-- Offerings for ONE_UP
WITH period AS (SELECT id FROM "academic_periods" LIMIT 1),
c AS (SELECT id,row_number() over() rn FROM "courses" WHERE code LIKE 'ONEUP%')
INSERT INTO "offerings" ("course_id","period_id","instructor_id","section_code","category","capacity","status")
SELECT c.id, period.id, (SELECT id FROM "instructors" WHERE "subject"=(SELECT "subject" FROM "courses" WHERE id=c.id) LIMIT 1), 'O'||c.rn, 'ONE_UP', 5, 'PUBLISHED'
FROM c, period;

-- SPECIAL offering
WITH period AS (SELECT id FROM "academic_periods" LIMIT 1)
INSERT INTO "offerings" ("course_id","period_id","section_code","category","capacity","status","room")
SELECT id, period.id, 'SP1', 'SPECIAL', 30, 'PUBLISHED', '대강당'
FROM "courses" WHERE code='SPC-ALL', period;
