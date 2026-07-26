-- Aligns the live Supabase DB with lib/db/schema/users.ts (studentProfiles).
-- The live DB was provisioned with an older supabase-setup.sql that lacked
-- class_code / high_school; the app queries both, so /staff/students and
-- student create/update fail until this runs.
--
-- Safe to run repeatedly (IF NOT EXISTS + COALESCE backfill preserves data).
-- Run in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/eysamlflwidgvkitkonc/sql/new

BEGIN;

ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS class_code varchar(10);
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS high_school varchar(100);

-- Backfill seed students with the same values supabase-setup.sql would have inserted.
UPDATE public.student_profiles sp SET
  class_code = COALESCE(sp.class_code, CASE u.email
    WHEN 's01@test.kr' THEN 'MK' WHEN 's02@test.kr' THEN 'MJ' WHEN 's03@test.kr' THEN 'MW'
    WHEN 's04@test.kr' THEN 'ES' WHEN 's05@test.kr' THEN 'EK' WHEN 's06@test.kr' THEN 'HM'
    WHEN 's07@test.kr' THEN 'HW' WHEN 's08@test.kr' THEN 'DM' WHEN 's09@test.kr' THEN 'DW'
    WHEN 's10@test.kr' THEN 'KM' WHEN '12345' THEN 'KW' END),
  high_school = COALESCE(sp.high_school, CASE u.email
    WHEN 's01@test.kr' THEN '이천고등학교' WHEN 's02@test.kr' THEN '장호원고등학교'
    WHEN 's03@test.kr' THEN '이천제일고등학교' WHEN 's04@test.kr' THEN '이천양정여자고등학교'
    WHEN 's05@test.kr' THEN '효양고등학교' WHEN 's06@test.kr' THEN '부발고등학교'
    WHEN 's07@test.kr' THEN '이천고등학교' WHEN 's08@test.kr' THEN '이천양정여자고등학교'
    WHEN 's09@test.kr' THEN '장호원고등학교' WHEN 's10@test.kr' THEN '효양고등학교'
    WHEN '12345' THEN '이천제일고등학교' END)
FROM public.users u
WHERE u.id = sp.user_id;

COMMIT;
