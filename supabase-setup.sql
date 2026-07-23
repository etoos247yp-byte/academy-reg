-- Etoos247 academy registration database reset and seed
-- WARNING: This deletes only this application's public-schema objects.
-- Run the whole file once in the Supabase SQL Editor.

BEGIN;

-- Remove partial or previous installations in dependency order.
DROP TABLE IF EXISTS public.one_up_assignments CASCADE;
DROP TABLE IF EXISTS public.registration_events CASCADE;
DROP TABLE IF EXISTS public.registration_disclosures CASCADE;
DROP TABLE IF EXISTS public.registrations CASCADE;
DROP TABLE IF EXISTS public.registration_batches CASCADE;
DROP TABLE IF EXISTS public.offering_pricing CASCADE;
DROP TABLE IF EXISTS public.offering_sessions CASCADE;
DROP TABLE IF EXISTS public.offerings CASCADE;
DROP TABLE IF EXISTS public.pricing_template_versions CASCADE;
DROP TABLE IF EXISTS public.pricing_templates CASCADE;
DROP TABLE IF EXISTS public.registration_windows CASCADE;
DROP TABLE IF EXISTS public.student_profiles CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.instructors CASCADE;
DROP TABLE IF EXISTS public.academic_periods CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TYPE IF EXISTS public.offering_status CASCADE;
DROP TYPE IF EXISTS public.offering_category CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

CREATE TYPE public.user_role AS ENUM ('STUDENT', 'STAFF', 'ADMIN');
CREATE TYPE public.offering_category AS ENUM (
  'NORMAL_SEASON',
  'ONE_UP',
  'SPECIAL',
  'ESSAY_SPECIAL',
  'CUSTOM'
);
CREATE TYPE public.offering_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE public.users (
  id serial PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  name varchar(100) NOT NULL,
  role public.user_role NOT NULL,
  phone varchar(20),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE public.student_profiles (
  id serial PRIMARY KEY,
  user_id integer NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  school_grade varchar(20),
  notes text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE public.instructors (
  id serial PRIMARY KEY,
  name varchar(100) NOT NULL,
  subject varchar(100),
  phone varchar(20),
  one_up_capacity integer NOT NULL DEFAULT 0 CHECK (one_up_capacity >= 0)
);

CREATE TABLE public.academic_periods (
  id serial PRIMARY KEY,
  name varchar(200) NOT NULL,
  period_type varchar(50) NOT NULL DEFAULT 'SEMESTER',
  start_date date NOT NULL,
  end_date date NOT NULL,
  billing_days integer CHECK (billing_days IS NULL OR billing_days > 0),
  is_active integer NOT NULL DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE TABLE public.registration_windows (
  id serial PRIMARY KEY,
  period_id integer NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  opens_at timestamp NOT NULL,
  closes_at timestamp NOT NULL,
  add_drop_closes_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  CHECK (closes_at >= opens_at)
);

CREATE TABLE public.courses (
  id serial PRIMARY KEY,
  code varchar(50) NOT NULL UNIQUE,
  name varchar(200) NOT NULL,
  description text,
  subject varchar(100)
);

CREATE TABLE public.pricing_templates (
  id serial PRIMARY KEY,
  category varchar(50) NOT NULL,
  price_model_type varchar(50) NOT NULL,
  label varchar(200) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE public.pricing_template_versions (
  id serial PRIMARY KEY,
  template_id integer NOT NULL REFERENCES public.pricing_templates(id),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  config jsonb NOT NULL,
  effective_from timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);

CREATE TABLE public.offerings (
  id serial PRIMARY KEY,
  course_id integer NOT NULL REFERENCES public.courses(id),
  period_id integer REFERENCES public.academic_periods(id),
  instructor_id integer REFERENCES public.instructors(id),
  section_code varchar(50) NOT NULL UNIQUE,
  category public.offering_category NOT NULL,
  capacity integer NOT NULL DEFAULT 20 CHECK (capacity > 0),
  status public.offering_status NOT NULL DEFAULT 'DRAFT',
  room varchar(100),
  notes text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE public.offering_sessions (
  id serial PRIMARY KEY,
  offering_id integer NOT NULL REFERENCES public.offerings(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  CHECK (end_time > start_time),
  UNIQUE (offering_id, session_date, start_time)
);

CREATE TABLE public.offering_pricing (
  id serial PRIMARY KEY,
  offering_id integer NOT NULL UNIQUE REFERENCES public.offerings(id) ON DELETE CASCADE,
  template_version_id integer REFERENCES public.pricing_template_versions(id),
  price_amount_per_session integer NOT NULL CHECK (price_amount_per_session >= 0),
  session_count integer NOT NULL CHECK (session_count > 0),
  package_total integer NOT NULL CHECK (package_total >= 0),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE public.registration_batches (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public.users(id),
  window_id integer NOT NULL REFERENCES public.registration_windows(id),
  review_token varchar(128) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE public.registrations (
  id serial PRIMARY KEY,
  batch_id integer NOT NULL REFERENCES public.registration_batches(id),
  user_id integer NOT NULL REFERENCES public.users(id),
  offering_id integer NOT NULL REFERENCES public.offerings(id),
  status varchar(20) NOT NULL CHECK (status IN ('CONFIRMED', 'WAITLISTED', 'CANCELLED')),
  waitlist_sequence integer CHECK (waitlist_sequence IS NULL OR waitlist_sequence > 0),
  enrolled_at timestamp NOT NULL DEFAULT now(),
  cancelled_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE public.registration_disclosures (
  id serial PRIMARY KEY,
  batch_id integer NOT NULL REFERENCES public.registration_batches(id),
  disclosure_text text NOT NULL,
  normal_count integer NOT NULL CHECK (normal_count >= 0),
  tier_monthly_surcharge integer NOT NULL CHECK (tier_monthly_surcharge >= 0),
  accepted_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE public.registration_events (
  id serial PRIMARY KEY,
  registration_id integer NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  actor_id integer NOT NULL REFERENCES public.users(id),
  action varchar(50) NOT NULL,
  previous_state jsonb,
  new_state jsonb,
  reason text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE public.one_up_assignments (
  id serial PRIMARY KEY,
  registration_id integer NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
  instructor_id integer NOT NULL REFERENCES public.instructors(id),
  offering_id integer NOT NULL REFERENCES public.offerings(id),
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  assigned_at timestamp NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX idx_offerings_period ON public.offerings(period_id);
CREATE INDEX idx_offerings_category ON public.offerings(category);
CREATE INDEX idx_offerings_status ON public.offerings(status);
CREATE INDEX idx_reg_batches_user ON public.registration_batches(user_id);
CREATE INDEX idx_reg_user_status ON public.registrations(user_id, status);
CREATE INDEX idx_reg_offering_status ON public.registrations(offering_id, status);
CREATE UNIQUE INDEX idx_reg_user_offering_active
  ON public.registrations(user_id, offering_id)
  WHERE status IN ('CONFIRMED', 'WAITLISTED');

-- Users. Passwords: admin/staff = 1234, test student = 12345.
INSERT INTO public.users (email, password_hash, name, role, phone) VALUES
  ('1234', '$2a$10$smm4l9ZiI8SVkgxed2o0pOwYb0V8NOd8h501YYYUmqisNPXgLNa.S', '관리자', 'ADMIN', '010-0000-0001'),
  ('staff@eetoos.kr', '$2a$10$smm4l9ZiI8SVkgxed2o0pOwYb0V8NOd8h501YYYUmqisNPXgLNa.S', '박선생', 'STAFF', '010-0000-0002'),
  ('12345', '$2a$10$Aak1ULhNPzU9MRMyFAMT4OvUEPtMVvNIqt9IW2R5K2XR.P0ubG4he', '테스트학생', 'STUDENT', '010-9999-9999'),
  ('s01@test.kr', '$2a$10$Aak1ULhNPzU9MRMyFAMT4OvUEPtMVvNIqt9IW2R5K2XR.P0ubG4he', '김민수', 'STUDENT', '010-1111-0001'),
  ('s02@test.kr', '$2a$10$Aak1ULhNPzU9MRMyFAMT4OvUEPtMVvNIqt9IW2R5K2XR.P0ubG4he', '이지영', 'STUDENT', '010-1111-0002'),
  ('s03@test.kr', '$2a$10$Aak1ULhNPzU9MRMyFAMT4OvUEPtMVvNIqt9IW2R5K2XR.P0ubG4he', '박준호', 'STUDENT', '010-1111-0003'),
  ('s04@test.kr', '$2a$10$Aak1ULhNPzU9MRMyFAMT4OvUEPtMVvNIqt9IW2R5K2XR.P0ubG4he', '최서연', 'STUDENT', '010-1111-0004'),
  ('s05@test.kr', '$2a$10$Aak1ULhNPzU9MRMyFAMT4OvUEPtMVvNIqt9IW2R5K2XR.P0ubG4he', '정도윤', 'STUDENT', '010-1111-0005'),
  ('s06@test.kr', '$2a$10$Aak1ULhNPzU9MRMyFAMT4OvUEPtMVvNIqt9IW2R5K2XR.P0ubG4he', '강하은', 'STUDENT', '010-1111-0006'),
  ('s07@test.kr', '$2a$10$Aak1ULhNPzU9MRMyFAMT4OvUEPtMVvNIqt9IW2R5K2XR.P0ubG4he', '윤지후', 'STUDENT', '010-1111-0007'),
  ('s08@test.kr', '$2a$10$Aak1ULhNPzU9MRMyFAMT4OvUEPtMVvNIqt9IW2R5K2XR.P0ubG4he', '장예린', 'STUDENT', '010-1111-0008'),
  ('s09@test.kr', '$2a$10$Aak1ULhNPzU9MRMyFAMT4OvUEPtMVvNIqt9IW2R5K2XR.P0ubG4he', '임현우', 'STUDENT', '010-1111-0009'),
  ('s10@test.kr', '$2a$10$Aak1ULhNPzU9MRMyFAMT4OvUEPtMVvNIqt9IW2R5K2XR.P0ubG4he', '한소희', 'STUDENT', '010-1111-0010');

INSERT INTO public.student_profiles (user_id, school_grade)
SELECT id, CASE WHEN email IN ('12345', 's01@test.kr', 's02@test.kr', 's03@test.kr', 's04@test.kr') THEN '고3' ELSE '고2' END
FROM public.users
WHERE role = 'STUDENT';

INSERT INTO public.instructors (name, subject, one_up_capacity) VALUES
  ('김민철', '국어', 5),
  ('이수진', '영어', 5),
  ('박성호', '수학', 5),
  ('최은영', '사탐', 3),
  ('정태웅', '과탐', 3),
  ('송지원', '국어', 4),
  ('한동수', '수학', 4);

INSERT INTO public.academic_periods
  (name, period_type, start_date, end_date, billing_days, is_active)
VALUES
  ('2026년 7월 정규학기', 'SEMESTER', DATE '2026-07-06', DATE '2026-07-31', 26, 1);

INSERT INTO public.registration_windows
  (period_id, name, opens_at, closes_at, add_drop_closes_at)
VALUES
  (
    (SELECT id FROM public.academic_periods WHERE name = '2026년 7월 정규학기'),
    '2026년 7월 수강신청',
    TIMESTAMP '2026-01-01 00:00:00',
    TIMESTAMP '2027-12-31 18:00:00',
    TIMESTAMP '2027-12-31 18:00:00'
  );

-- Exactly 15 test courses: 10 normal, 3 one-up, 1 special, 1 essay special.
INSERT INTO public.courses (code, name, description, subject) VALUES
  ('KOR-01', '국어', '수능 국어 영역 대비', '국어'),
  ('KOR-02', '국어 심화', '1등급 목표 국어 심화', '국어'),
  ('ENG-01', '영어', '수능 영어 영역 대비', '영어'),
  ('ENG-02', '영어 심화', '1등급 목표 영어 심화', '영어'),
  ('MATH-01', '수학', '수능 수학 공통', '수학'),
  ('MATH-02', '수학 심화', '미적분 심화', '수학'),
  ('MATH-03', '확률과통계', '확률과 통계', '수학'),
  ('SOC-01', '사회문화', '사회문화 대비', '사탐'),
  ('SCI-01', '물리학I', '물리학I 대비', '과탐'),
  ('SCI-02', '생명과학I', '생명과학I 대비', '과탐'),
  ('ONEUP-KOR', '국어 원업', '1:1 국어 개별지도', '국어'),
  ('ONEUP-ENG', '영어 원업', '1:1 영어 개별지도', '영어'),
  ('ONEUP-MATH', '수학 원업', '1:1 수학 개별지도', '수학'),
  ('SPC-ALL', '여름방학 특강', '4회 집중 특강', '종합'),
  ('ESSAY-MATH', '수리논술 특강', '4주 수업 및 첨삭', '논술');

-- 15 offerings.
WITH offering_seed(course_code, instructor_name, section_code, category, capacity, room) AS (
  VALUES
    ('KOR-01', '김민철', 'N1', 'NORMAL_SEASON', 20, '201호'),
    ('KOR-02', '송지원', 'N2', 'NORMAL_SEASON', 20, '202호'),
    ('ENG-01', '이수진', 'N3', 'NORMAL_SEASON', 20, '203호'),
    ('ENG-02', '이수진', 'N4', 'NORMAL_SEASON', 20, '204호'),
    ('MATH-01', '박성호', 'N5', 'NORMAL_SEASON', 25, '301호'),
    ('MATH-02', '한동수', 'N6', 'NORMAL_SEASON', 25, '302호'),
    ('MATH-03', '박성호', 'N7', 'NORMAL_SEASON', 20, '303호'),
    ('SOC-01', '최은영', 'N8', 'NORMAL_SEASON', 15, '401호'),
    ('SCI-01', '정태웅', 'N9', 'NORMAL_SEASON', 15, '402호'),
    ('SCI-02', '정태웅', 'N10', 'NORMAL_SEASON', 15, '403호'),
    ('ONEUP-KOR', '김민철', 'O1', 'ONE_UP', 5, NULL),
    ('ONEUP-ENG', '이수진', 'O2', 'ONE_UP', 5, NULL),
    ('ONEUP-MATH', '박성호', 'O3', 'ONE_UP', 5, NULL),
    ('SPC-ALL', '김민철', 'SP1', 'SPECIAL', 30, '대강당'),
    ('ESSAY-MATH', '한동수', 'E1', 'ESSAY_SPECIAL', 10, '논술실')
)
INSERT INTO public.offerings
  (course_id, period_id, instructor_id, section_code, category, capacity, status, room)
SELECT
  c.id,
  p.id,
  i.id,
  s.section_code,
  s.category::public.offering_category,
  s.capacity,
  'PUBLISHED'::public.offering_status,
  s.room
FROM offering_seed s
JOIN public.courses c ON c.code = s.course_code
JOIN public.instructors i ON i.name = s.instructor_name
CROSS JOIN (
  SELECT id
  FROM public.academic_periods
  WHERE name = '2026년 7월 정규학기'
) p;

-- Four weekly sessions for normal and package offerings.
WITH schedule(section_code, first_date, start_time, end_time) AS (
  VALUES
    ('N1', DATE '2026-07-06', TIME '09:00', TIME '09:50'),
    ('N2', DATE '2026-07-08', TIME '09:00', TIME '09:50'),
    ('N3', DATE '2026-07-07', TIME '10:00', TIME '10:50'),
    ('N4', DATE '2026-07-09', TIME '10:00', TIME '10:50'),
    ('N5', DATE '2026-07-06', TIME '11:00', TIME '11:50'),
    ('N6', DATE '2026-07-08', TIME '11:00', TIME '11:50'),
    ('N7', DATE '2026-07-10', TIME '09:00', TIME '09:50'),
    ('N8', DATE '2026-07-07', TIME '13:00', TIME '13:50'),
    ('N9', DATE '2026-07-06', TIME '14:00', TIME '14:50'),
    ('N10', DATE '2026-07-08', TIME '14:00', TIME '14:50'),
    ('SP1', DATE '2026-07-10', TIME '15:00', TIME '16:30'),
    ('E1', DATE '2026-07-09', TIME '15:00', TIME '17:00')
)
INSERT INTO public.offering_sessions (offering_id, session_date, start_time, end_time)
SELECT o.id, s.first_date + (g.week_number * 7), s.start_time, s.end_time
FROM schedule s
JOIN public.offerings o ON o.section_code = s.section_code
CROSS JOIN generate_series(0, 3) AS g(week_number);

INSERT INTO public.pricing_templates (category, price_model_type, label) VALUES
  ('NORMAL_SEASON', 'TIERED_MONTHLY', '일반 정규수업'),
  ('ONE_UP', 'PER_SESSION', '원업'),
  ('SPECIAL', 'FIXED_PACKAGE', '특강'),
  ('ESSAY_SPECIAL', 'FIXED_PACKAGE', '논술특강');

INSERT INTO public.pricing_template_versions (template_id, version, config)
VALUES
  ((SELECT id FROM public.pricing_templates WHERE category = 'NORMAL_SEASON'), 1, '{"billingDivisor":29.4,"tiers":[{"min":0,"max":3,"monthlySurcharge":0},{"min":4,"max":6,"monthlySurcharge":100000},{"min":7,"max":9,"monthlySurcharge":200000},{"min":10,"max":999,"monthlySurcharge":300000}]}'::jsonb),
  ((SELECT id FROM public.pricing_templates WHERE category = 'ONE_UP'), 1, '{"amountPerSession":25000,"sessionsPerMonth":4,"autoCarry":true}'::jsonb),
  ((SELECT id FROM public.pricing_templates WHERE category = 'SPECIAL'), 1, '{"sessions":4,"packageTotal":144000}'::jsonb),
  ((SELECT id FROM public.pricing_templates WHERE category = 'ESSAY_SPECIAL'), 1, '{"sessions":4,"packageTotal":320000,"includesCorrection":true}'::jsonb);

INSERT INTO public.offering_pricing
  (offering_id, template_version_id, price_amount_per_session, session_count, package_total)
SELECT
  o.id,
  (SELECT v.id FROM public.pricing_template_versions v JOIN public.pricing_templates t ON t.id = v.template_id WHERE t.category = 'NORMAL_SEASON' AND v.version = 1),
  0,
  1,
  0
FROM public.offerings o
WHERE o.category = 'NORMAL_SEASON';

INSERT INTO public.offering_pricing
  (offering_id, template_version_id, price_amount_per_session, session_count, package_total)
SELECT
  o.id,
  (SELECT v.id FROM public.pricing_template_versions v JOIN public.pricing_templates t ON t.id = v.template_id WHERE t.category = 'ONE_UP' AND v.version = 1),
  25000,
  4,
  100000
FROM public.offerings o
WHERE o.category = 'ONE_UP';

INSERT INTO public.offering_pricing
  (offering_id, template_version_id, price_amount_per_session, session_count, package_total)
SELECT
  o.id,
  (SELECT v.id FROM public.pricing_template_versions v JOIN public.pricing_templates t ON t.id = v.template_id WHERE t.category = 'SPECIAL' AND v.version = 1),
  36000,
  4,
  144000
FROM public.offerings o
WHERE o.category = 'SPECIAL';

INSERT INTO public.offering_pricing
  (offering_id, template_version_id, price_amount_per_session, session_count, package_total)
SELECT
  o.id,
  (SELECT v.id FROM public.pricing_template_versions v JOIN public.pricing_templates t ON t.id = v.template_id WHERE t.category = 'ESSAY_SPECIAL' AND v.version = 1),
  80000,
  4,
  320000
FROM public.offerings o
WHERE o.category = 'ESSAY_SPECIAL';

-- One registration batch for each student.
INSERT INTO public.registration_batches (user_id, window_id, review_token)
SELECT
  u.id,
  (SELECT id FROM public.registration_windows WHERE name = '2026년 7월 수강신청'),
  'seed-' || u.id::text
FROM public.users u
WHERE u.role = 'STUDENT';

-- Give every student one confirmed class so staff schedules have data.
INSERT INTO public.registrations (batch_id, user_id, offering_id, status)
SELECT
  b.id,
  b.user_id,
  (SELECT id FROM public.offerings WHERE section_code = 'N1'),
  'CONFIRMED'
FROM public.registration_batches b;

-- Test student receives two additional classes for timetable testing.
INSERT INTO public.registrations (batch_id, user_id, offering_id, status)
SELECT b.id, b.user_id, o.id, 'CONFIRMED'
FROM public.registration_batches b
JOIN public.users u ON u.id = b.user_id AND u.email = '12345'
JOIN public.offerings o ON o.section_code IN ('N3', 'N5');

INSERT INTO public.registration_disclosures
  (batch_id, disclosure_text, normal_count, tier_monthly_surcharge)
SELECT id, '초기 테스트 데이터', CASE WHEN user_id = (SELECT id FROM public.users WHERE email = '12345') THEN 3 ELSE 1 END, 0
FROM public.registration_batches;

INSERT INTO public.registration_events
  (registration_id, actor_id, action, new_state, reason)
SELECT r.id, r.user_id, 'SEED_ENROLL', jsonb_build_object('status', r.status, 'offeringId', r.offering_id), '초기 테스트 데이터'
FROM public.registrations r;

COMMIT;
