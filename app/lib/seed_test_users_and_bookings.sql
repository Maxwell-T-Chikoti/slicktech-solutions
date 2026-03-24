-- Seed 10 test users (auth.users + profiles) + 20 bookings for QA
-- Run in Supabase SQL Editor.

BEGIN;

-- 1) Define test users
WITH seed_users AS (
  SELECT *
  FROM (VALUES
    ('Mia', 'Ngwenya', 'test.user01@slicktech.local', '+263771001001', 'Harare CBD', 'user'),
    ('Tariro', 'Moyo', 'test.user02@slicktech.local', '+263771001002', 'Borrowdale', 'user'),
    ('Kuda', 'Sibanda', 'test.user03@slicktech.local', '+263771001003', 'Avondale', 'user'),
    ('Rudo', 'Dube', 'test.user04@slicktech.local', '+263771001004', 'Marlborough', 'user'),
    ('Farai', 'Mlambo', 'test.user05@slicktech.local', '+263771001005', 'Msasa', 'user'),
    ('Nyasha', 'Maphosa', 'test.user06@slicktech.local', '+263771001006', 'Belgravia', 'user'),
    ('Tawanda', 'Chari', 'test.user07@slicktech.local', '+263771001007', 'Greendale', 'user'),
    ('Chipo', 'Ncube', 'test.user08@slicktech.local', '+263771001008', 'Westgate', 'user'),
    ('Prince', 'Gumbo', 'test.user09@slicktech.local', '+263771001009', 'Ruwa', 'user'),
    ('Lindiwe', 'Mtetwa', 'test.user10@slicktech.local', '+263771001010', 'Mount Pleasant', 'user')
  ) AS t(first_name, surname, email, phone, location, role)
)
-- 2) Ensure each test email exists in auth.users (bookings.user_id FK target)
-- Temporary password for all seeded auth users: TempPass123!
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  s.email,
  crypt('TempPass123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('first_name', s.first_name, 'surname', s.surname),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
FROM seed_users s
WHERE NOT EXISTS (
  SELECT 1
  FROM auth.users u
  WHERE lower(u.email) = lower(s.email)
);

-- Ensure matching email identities exist for seeded auth users
WITH seed_users AS (
  SELECT *
  FROM (VALUES
    ('Mia', 'Ngwenya', 'test.user01@slicktech.local', '+263771001001', 'Harare CBD', 'user'),
    ('Tariro', 'Moyo', 'test.user02@slicktech.local', '+263771001002', 'Borrowdale', 'user'),
    ('Kuda', 'Sibanda', 'test.user03@slicktech.local', '+263771001003', 'Avondale', 'user'),
    ('Rudo', 'Dube', 'test.user04@slicktech.local', '+263771001004', 'Marlborough', 'user'),
    ('Farai', 'Mlambo', 'test.user05@slicktech.local', '+263771001005', 'Msasa', 'user'),
    ('Nyasha', 'Maphosa', 'test.user06@slicktech.local', '+263771001006', 'Belgravia', 'user'),
    ('Tawanda', 'Chari', 'test.user07@slicktech.local', '+263771001007', 'Greendale', 'user'),
    ('Chipo', 'Ncube', 'test.user08@slicktech.local', '+263771001008', 'Westgate', 'user'),
    ('Prince', 'Gumbo', 'test.user09@slicktech.local', '+263771001009', 'Ruwa', 'user'),
    ('Lindiwe', 'Mtetwa', 'test.user10@slicktech.local', '+263771001010', 'Mount Pleasant', 'user')
  ) AS t(first_name, surname, email, phone, location, role)
)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at,
  last_sign_in_at
)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  NOW(),
  NOW(),
  NOW()
FROM auth.users u
JOIN seed_users s
  ON lower(u.email) = lower(s.email)
WHERE NOT EXISTS (
  SELECT 1
  FROM auth.identities i
  WHERE i.user_id = u.id
    AND i.provider = 'email'
);

-- 3) Create/update matching profiles using auth.users.id
WITH seed_users AS (
  SELECT *
  FROM (VALUES
    ('Mia', 'Ngwenya', 'test.user01@slicktech.local', '+263771001001', 'Harare CBD', 'user'),
    ('Tariro', 'Moyo', 'test.user02@slicktech.local', '+263771001002', 'Borrowdale', 'user'),
    ('Kuda', 'Sibanda', 'test.user03@slicktech.local', '+263771001003', 'Avondale', 'user'),
    ('Rudo', 'Dube', 'test.user04@slicktech.local', '+263771001004', 'Marlborough', 'user'),
    ('Farai', 'Mlambo', 'test.user05@slicktech.local', '+263771001005', 'Msasa', 'user'),
    ('Nyasha', 'Maphosa', 'test.user06@slicktech.local', '+263771001006', 'Belgravia', 'user'),
    ('Tawanda', 'Chari', 'test.user07@slicktech.local', '+263771001007', 'Greendale', 'user'),
    ('Chipo', 'Ncube', 'test.user08@slicktech.local', '+263771001008', 'Westgate', 'user'),
    ('Prince', 'Gumbo', 'test.user09@slicktech.local', '+263771001009', 'Ruwa', 'user'),
    ('Lindiwe', 'Mtetwa', 'test.user10@slicktech.local', '+263771001010', 'Mount Pleasant', 'user')
  ) AS t(first_name, surname, email, phone, location, role)
)
INSERT INTO public.profiles (id, first_name, surname, email, phone, location, role)
SELECT u.id, s.first_name, s.surname, s.email, s.phone, s.location, s.role
FROM seed_users s
JOIN auth.users u
  ON lower(u.email) = lower(s.email)
ON CONFLICT (id) DO UPDATE
SET
  first_name = EXCLUDED.first_name,
  surname = EXCLUDED.surname,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  location = EXCLUDED.location,
  role = EXCLUDED.role;

-- 2) Create 20 bookings mapped to those users
WITH booking_seed AS (
  SELECT *
  FROM (VALUES
    ('test.user01@slicktech.local', 'The "Digital " Audit', '2026-03-25', '09:00', 'Pending',   '$120', 'Full office diagnostics and report.', 'Harare CBD'),
    ('test.user02@slicktech.local', 'Senior Tech Concierge', '2026-03-25', '10:30', 'Confirmed', '$180', 'Executive device setup and handover.', 'Borrowdale'),
    ('test.user03@slicktech.local', 'EMERGENCY', '2026-03-25', '12:00', 'Pending',   '$250', 'Critical outage response for internet.', 'Avondale'),
    ('test.user04@slicktech.local', 'System Speed TestNetwork Overview', '2026-03-25', '14:00', 'Pending', '$95', 'Performance baseline and network map.', 'Marlborough'),
    ('test.user05@slicktech.local', 'The "Digital " Audit', '2026-03-26', '09:30', 'Confirmed', '$130', 'Audit with priority findings summary.', 'Msasa'),
    ('test.user06@slicktech.local', 'Senior Tech Concierge', '2026-03-26', '11:00', 'Pending',   '$175', 'Home office optimization and sync.', 'Belgravia'),
    ('test.user07@slicktech.local', 'EMERGENCY', '2026-03-26', '13:30', 'Complete',  '$260', 'Same-day malware containment.', 'Greendale'),
    ('test.user08@slicktech.local', 'System Speed TestNetwork Overview', '2026-03-26', '15:00', 'Pending', '$90', 'Router and switch topology review.', 'Westgate'),
    ('test.user09@slicktech.local', 'The "Digital " Audit', '2026-03-27', '08:30', 'Pending',   '$115', 'Laptop fleet compliance checks.', 'Ruwa'),
    ('test.user10@slicktech.local', 'Senior Tech Concierge', '2026-03-27', '10:00', 'Confirmed', '$190', 'Boardroom AV and conferencing setup.', 'Mount Pleasant'),
    ('test.user01@slicktech.local', 'EMERGENCY', '2026-03-27', '11:30', 'Pending',   '$240', 'Server restart and service restore.', 'Harare CBD'),
    ('test.user02@slicktech.local', 'System Speed TestNetwork Overview', '2026-03-27', '14:30', 'Complete', '$100', 'Bandwidth bottleneck analysis.', 'Borrowdale'),
    ('test.user03@slicktech.local', 'The "Digital " Audit', '2026-03-28', '09:00', 'Rejected',  '$125', 'Security baseline review request.', 'Avondale'),
    ('test.user04@slicktech.local', 'Senior Tech Concierge', '2026-03-28', '10:30', 'Pending',   '$170', 'Device migration to new workspace.', 'Marlborough'),
    ('test.user05@slicktech.local', 'EMERGENCY', '2026-03-28', '12:30', 'Confirmed', '$255', 'Payment terminal outage recovery.', 'Msasa'),
    ('test.user06@slicktech.local', 'System Speed TestNetwork Overview', '2026-03-28', '15:30', 'Pending', '$92', 'Wi-Fi dead-zone investigation.', 'Belgravia'),
    ('test.user07@slicktech.local', 'The "Digital " Audit', '2026-03-29', '09:15', 'Pending',   '$118', 'Cloud access and policy audit.', 'Greendale'),
    ('test.user08@slicktech.local', 'Senior Tech Concierge', '2026-03-29', '11:15', 'Complete',  '$185', 'On-site premium support session.', 'Westgate'),
    ('test.user09@slicktech.local', 'EMERGENCY', '2026-03-29', '13:45', 'Pending',   '$245', 'Critical printer and POS outage.', 'Ruwa'),
    ('test.user10@slicktech.local', 'System Speed TestNetwork Overview', '2026-03-29', '16:00', 'Confirmed', '$98', 'Latency and packet loss deep-dive.', 'Mount Pleasant')
  ) AS t(user_email, service, date, time, status, price, description, location)
)
INSERT INTO public.bookings (service, date, time, status, price, description, location, user_id, reschedules)
SELECT
  b.service,
  b.date::date,
  b.time,
  b.status,
  b.price,
  b.description,
  b.location,
  u.id,
  0
FROM booking_seed b
JOIN auth.users u
  ON lower(u.email) = lower(b.user_email);

COMMIT;

-- Note:
-- This script seeds auth.users with a temporary password: TempPass123!
