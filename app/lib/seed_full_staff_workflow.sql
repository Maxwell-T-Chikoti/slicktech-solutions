-- Full staff workflow test seed
-- This script does all-in-one:
-- 1) reset assignments + related progress
-- 2) assign jobs round-robin to staff
-- 3) seed staff_unavailability
-- 4) seed checklist progress + chat messages
--
-- Prerequisites:
-- - staff_features_migration.sql
-- - staff_calendar_checklist_chat_migration.sql
-- - chat_features_migration.sql (optional, for read/pin fields)

BEGIN;

-- ---------------------------------------------------------------------------
-- Step 1: Reset assignment-dependent data so script is rerunnable
-- ---------------------------------------------------------------------------
UPDATE public.bookings
SET
  assigned_staff_id = NULL,
  staff_acknowledged_at = NULL,
  staff_notes = NULL,
  staff_completion_report = NULL,
  staff_completed_at = NULL
WHERE status IN ('Pending', 'Confirmed', 'Complete');

DELETE FROM public.staff_unavailability;
DELETE FROM public.booking_checklist_items;
DELETE FROM public.booking_staff_chat_messages;

-- ---------------------------------------------------------------------------
-- Step 2: Assign active jobs to staff (round-robin)
-- ---------------------------------------------------------------------------
WITH staff AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY first_name, surname, id) AS rn
  FROM public.profiles
  WHERE role = 'staff'
),
staff_count AS (
  SELECT COUNT(*) AS cnt FROM staff
),
targets AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY date, time, id) AS rn
  FROM public.bookings
  WHERE status IN ('Pending', 'Confirmed', 'Complete')
)
UPDATE public.bookings b
SET assigned_staff_id = s.id
FROM targets t
JOIN staff_count sc ON sc.cnt > 0
JOIN staff s ON ((t.rn - 1) % sc.cnt) + 1 = s.rn
WHERE b.id = t.id;

-- ---------------------------------------------------------------------------
-- Step 3: Seed staff availability blocks
-- ---------------------------------------------------------------------------
INSERT INTO public.staff_unavailability (staff_id, unavailable_date, start_time, end_time, note)
SELECT p.id, CURRENT_DATE + 1, '09:00'::time, '11:00'::time, 'Training block'
FROM public.profiles p
WHERE p.role = 'staff'
ON CONFLICT (staff_id, unavailable_date, start_time, end_time) DO NOTHING;

INSERT INTO public.staff_unavailability (staff_id, unavailable_date, start_time, end_time, note)
SELECT p.id, CURRENT_DATE + 2, '14:00'::time, '16:00'::time, 'Field travel buffer'
FROM public.profiles p
WHERE p.role = 'staff'
ON CONFLICT (staff_id, unavailable_date, start_time, end_time) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Step 4A: Seed checklist templates for your services
-- ---------------------------------------------------------------------------
INSERT INTO public.checklist_templates (service_name, checklist_items)
VALUES
  ('The "Digital " Audit', '["Run baseline diagnostics", "Capture security posture", "Document top 3 risks", "Share remediation plan"]'::jsonb),
  ('Senior Tech Concierge', '["Confirm client priorities", "Set up devices", "Verify account access", "Provide handover notes"]'::jsonb),
  ('EMERGENCY', '["Triage incident", "Stabilize service", "Confirm recovery", "Post-incident summary"]'::jsonb),
  ('System Speed TestNetwork Overview', '["Run speed tests", "Map network nodes", "Identify bottlenecks", "Recommend optimizations"]'::jsonb)
ON CONFLICT (service_name) DO UPDATE
SET checklist_items = EXCLUDED.checklist_items;

-- ---------------------------------------------------------------------------
-- Step 4B: Materialize checklist items from templates for assigned bookings
-- ---------------------------------------------------------------------------
WITH assigned_bookings AS (
  SELECT b.id AS booking_id, b.service, b.assigned_staff_id
  FROM public.bookings b
  WHERE b.assigned_staff_id IS NOT NULL
    AND b.status IN ('Pending', 'Confirmed', 'Complete')
),
expanded AS (
  SELECT
    ab.booking_id,
    ab.assigned_staff_id,
    item.value::text AS item_text,
    item.ordinality - 1 AS item_order
  FROM assigned_bookings ab
  JOIN public.checklist_templates ct
    ON lower(trim(ct.service_name)) = lower(trim(ab.service))
  JOIN LATERAL jsonb_array_elements_text(ct.checklist_items) WITH ORDINALITY AS item(value, ordinality)
    ON TRUE
)
INSERT INTO public.booking_checklist_items (booking_id, item_text, item_order, is_completed, completed_by, completed_at)
SELECT
  e.booking_id,
  e.item_text,
  e.item_order,
  CASE
    WHEN e.item_order = 0 THEN TRUE
    WHEN e.item_order = 1 AND (e.booking_id % 2 = 0) THEN TRUE
    ELSE FALSE
  END AS is_completed,
  CASE
    WHEN e.item_order = 0 THEN e.assigned_staff_id
    WHEN e.item_order = 1 AND (e.booking_id % 2 = 0) THEN e.assigned_staff_id
    ELSE NULL
  END AS completed_by,
  CASE
    WHEN e.item_order = 0 THEN NOW() - INTERVAL '2 hours'
    WHEN e.item_order = 1 AND (e.booking_id % 2 = 0) THEN NOW() - INTERVAL '45 minutes'
    ELSE NULL
  END AS completed_at
FROM expanded e
ON CONFLICT (booking_id, item_text) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Step 4C: Seed chat messages between admin and assigned staff
-- ---------------------------------------------------------------------------
WITH admin_user AS (
  SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY id LIMIT 1
),
assigned AS (
  SELECT b.id AS booking_id, b.assigned_staff_id
  FROM public.bookings b
  WHERE b.assigned_staff_id IS NOT NULL
    AND b.status IN ('Pending', 'Confirmed', 'Complete')
)
INSERT INTO public.booking_staff_chat_messages (
  booking_id,
  sender_id,
  sender_role,
  message,
  created_at,
  read_by_admin_at,
  read_by_staff_at,
  is_pinned,
  pinned_by,
  pinned_at
)
SELECT
  a.booking_id,
  au.id,
  'admin',
  'Please share quick status update before end of day.',
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '20 minutes',
  NOW() - INTERVAL '15 minutes',
  FALSE,
  NULL,
  NULL
FROM assigned a
CROSS JOIN admin_user au
UNION ALL
SELECT
  a.booking_id,
  a.assigned_staff_id,
  'staff',
  CASE
    WHEN a.booking_id % 2 = 0 THEN 'Acknowledged. Diagnostics are underway.'
    ELSE 'On-site now. Will post findings shortly.'
  END,
  NOW() - INTERVAL '10 minutes',
  NOW() - INTERVAL '5 minutes',
  NOW() - INTERVAL '2 minutes',
  CASE WHEN a.booking_id % 3 = 0 THEN TRUE ELSE FALSE END,
  CASE WHEN a.booking_id % 3 = 0 THEN a.assigned_staff_id ELSE NULL END,
  CASE WHEN a.booking_id % 3 = 0 THEN NOW() - INTERVAL '1 minute' ELSE NULL END
FROM assigned a;

COMMIT;

-- Quick sanity checks
-- SELECT id, service, date, time, assigned_staff_id FROM public.bookings ORDER BY date, time, id;
-- SELECT booking_id, sender_role, message, is_pinned FROM public.booking_staff_chat_messages ORDER BY booking_id, created_at;
-- SELECT booking_id, item_text, is_completed FROM public.booking_checklist_items ORDER BY booking_id, item_order;
