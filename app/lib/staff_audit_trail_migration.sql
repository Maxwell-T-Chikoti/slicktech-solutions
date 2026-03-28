-- Persistent staff audit trail for assignments, completions, and archival reporting.

CREATE TABLE IF NOT EXISTS public.staff_directory (
  staff_user_id UUID PRIMARY KEY,
  first_name TEXT,
  surname TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.staff_job_audit (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  booking_id BIGINT,
  event_type TEXT NOT NULL CHECK (event_type IN ('assigned', 'unassigned', 'completed')),
  staff_user_id UUID NOT NULL,
  previous_staff_user_id UUID,
  completed_at TIMESTAMPTZ,
  booking_status TEXT,
  staff_first_name TEXT,
  staff_surname TEXT,
  staff_email TEXT,
  staff_phone TEXT,
  staff_location TEXT,
  booking_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_staff_job_audit_staff_created
  ON public.staff_job_audit (staff_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_staff_job_audit_booking_created
  ON public.staff_job_audit (booking_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_staff_job_audit_event_type
  ON public.staff_job_audit (event_type);

CREATE TABLE IF NOT EXISTS public.staff_job_counters (
  staff_user_id UUID PRIMARY KEY,
  total_assignments INTEGER NOT NULL DEFAULT 0,
  total_unassignments INTEGER NOT NULL DEFAULT 0,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff_audit_documents (
  id BIGSERIAL PRIMARY KEY,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by_user_id UUID,
  title TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('csv', 'json', 'xlsx')),
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload_json JSONB,
  payload_text TEXT
);

ALTER TABLE public.staff_audit_documents
DROP CONSTRAINT IF EXISTS staff_audit_documents_format_check;

ALTER TABLE public.staff_audit_documents
ADD CONSTRAINT staff_audit_documents_format_check
CHECK (format IN ('csv', 'json', 'xlsx'));

CREATE OR REPLACE FUNCTION public.upsert_staff_directory_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role = 'staff' THEN
    INSERT INTO public.staff_directory (
      staff_user_id,
      first_name,
      surname,
      email,
      phone,
      location,
      created_at,
      last_seen_at,
      is_active,
      archived_at
    )
    VALUES (
      NEW.id,
      NEW.first_name,
      NEW.surname,
      NEW.email,
      NEW.phone,
      NEW.location,
      NOW(),
      NOW(),
      TRUE,
      NULL
    )
    ON CONFLICT (staff_user_id)
    DO UPDATE SET
      first_name = EXCLUDED.first_name,
      surname = EXCLUDED.surname,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      location = EXCLUDED.location,
      last_seen_at = NOW(),
      is_active = TRUE,
      archived_at = NULL;
  ELSIF OLD.role = 'staff' AND NEW.role IS DISTINCT FROM 'staff' THEN
    UPDATE public.staff_directory
    SET is_active = FALSE,
        archived_at = NOW(),
        last_seen_at = NOW()
    WHERE staff_user_id = OLD.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_staff_directory_from_profile ON public.profiles;
CREATE TRIGGER trg_staff_directory_from_profile
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.upsert_staff_directory_from_profile();

CREATE OR REPLACE FUNCTION public.capture_staff_booking_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_staff_id UUID;
  target_first_name TEXT;
  target_surname TEXT;
  target_email TEXT;
  target_phone TEXT;
  target_location TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.assigned_staff_id IS NULL THEN
      RETURN NEW;
    END IF;

    target_first_name := NULL;
    target_surname := NULL;
    target_email := NULL;
    target_phone := NULL;
    target_location := NULL;

    SELECT staff_first_name, staff_surname, staff_email, staff_phone, staff_location
    INTO target_first_name, target_surname, target_email, target_phone, target_location
    FROM public.staff_job_audit
    WHERE staff_user_id = NEW.assigned_staff_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF target_first_name IS NULL AND target_surname IS NULL AND target_email IS NULL THEN
      SELECT first_name, surname, email, phone, location
      INTO target_first_name, target_surname, target_email, target_phone, target_location
      FROM public.profiles
      WHERE id = NEW.assigned_staff_id;
    END IF;

    INSERT INTO public.staff_job_audit (
      booking_id,
      event_type,
      staff_user_id,
      booking_status,
      staff_first_name,
      staff_surname,
      staff_email,
      staff_phone,
      staff_location,
      booking_snapshot,
      metadata
    )
    VALUES (
      NEW.id,
      'assigned',
      NEW.assigned_staff_id,
      NEW.status,
      target_first_name,
      target_surname,
      target_email,
      target_phone,
      target_location,
      to_jsonb(NEW),
      jsonb_build_object('source', 'trigger:bookings-insert')
    );

    RETURN NEW;
  END IF;

  IF NEW.assigned_staff_id IS DISTINCT FROM OLD.assigned_staff_id THEN
    IF OLD.assigned_staff_id IS NOT NULL THEN
      target_first_name := NULL;
      target_surname := NULL;
      target_email := NULL;
      target_phone := NULL;
      target_location := NULL;

      SELECT staff_first_name, staff_surname, staff_email, staff_phone, staff_location
      INTO target_first_name, target_surname, target_email, target_phone, target_location
      FROM public.staff_job_audit
      WHERE staff_user_id = OLD.assigned_staff_id
      ORDER BY created_at DESC
      LIMIT 1;

      IF target_first_name IS NULL AND target_surname IS NULL AND target_email IS NULL THEN
        SELECT first_name, surname, email, phone, location
        INTO target_first_name, target_surname, target_email, target_phone, target_location
        FROM public.profiles
        WHERE id = OLD.assigned_staff_id;
      END IF;

      INSERT INTO public.staff_job_audit (
        booking_id,
        event_type,
        staff_user_id,
        previous_staff_user_id,
        booking_status,
        staff_first_name,
        staff_surname,
        staff_email,
        staff_phone,
        staff_location,
        booking_snapshot,
        metadata
      )
      VALUES (
        NEW.id,
        'unassigned',
        OLD.assigned_staff_id,
        NEW.assigned_staff_id,
        NEW.status,
        target_first_name,
        target_surname,
        target_email,
        target_phone,
        target_location,
        to_jsonb(NEW),
        jsonb_build_object('source', 'trigger:bookings-update')
      );
    END IF;

    IF NEW.assigned_staff_id IS NOT NULL THEN
      target_first_name := NULL;
      target_surname := NULL;
      target_email := NULL;
      target_phone := NULL;
      target_location := NULL;

      SELECT staff_first_name, staff_surname, staff_email, staff_phone, staff_location
      INTO target_first_name, target_surname, target_email, target_phone, target_location
      FROM public.staff_job_audit
      WHERE staff_user_id = NEW.assigned_staff_id
      ORDER BY created_at DESC
      LIMIT 1;

      IF target_first_name IS NULL AND target_surname IS NULL AND target_email IS NULL THEN
        SELECT first_name, surname, email, phone, location
        INTO target_first_name, target_surname, target_email, target_phone, target_location
        FROM public.profiles
        WHERE id = NEW.assigned_staff_id;
      END IF;

      INSERT INTO public.staff_job_audit (
        booking_id,
        event_type,
        staff_user_id,
        previous_staff_user_id,
        booking_status,
        staff_first_name,
        staff_surname,
        staff_email,
        staff_phone,
        staff_location,
        booking_snapshot,
        metadata
      )
      VALUES (
        NEW.id,
        'assigned',
        NEW.assigned_staff_id,
        OLD.assigned_staff_id,
        NEW.status,
        target_first_name,
        target_surname,
        target_email,
        target_phone,
        target_location,
        to_jsonb(NEW),
        jsonb_build_object('source', 'trigger:bookings-update')
      );
    END IF;
  END IF;

  IF (
    (COALESCE(OLD.status, '') <> 'Complete' AND NEW.status = 'Complete')
    OR (OLD.staff_completed_at IS NULL AND NEW.staff_completed_at IS NOT NULL)
  ) THEN
    target_staff_id := COALESCE(NEW.assigned_staff_id, OLD.assigned_staff_id);

    IF target_staff_id IS NOT NULL THEN
      target_first_name := NULL;
      target_surname := NULL;
      target_email := NULL;
      target_phone := NULL;
      target_location := NULL;

      SELECT staff_first_name, staff_surname, staff_email, staff_phone, staff_location
      INTO target_first_name, target_surname, target_email, target_phone, target_location
      FROM public.staff_job_audit
      WHERE staff_user_id = target_staff_id
      ORDER BY created_at DESC
      LIMIT 1;

      IF target_first_name IS NULL AND target_surname IS NULL AND target_email IS NULL THEN
        SELECT first_name, surname, email, phone, location
        INTO target_first_name, target_surname, target_email, target_phone, target_location
        FROM public.profiles
        WHERE id = target_staff_id;
      END IF;

      INSERT INTO public.staff_job_audit (
        booking_id,
        event_type,
        staff_user_id,
        completed_at,
        booking_status,
        staff_first_name,
        staff_surname,
        staff_email,
        staff_phone,
        staff_location,
        booking_snapshot,
        metadata
      )
      VALUES (
        NEW.id,
        'completed',
        target_staff_id,
        COALESCE(NEW.staff_completed_at, NOW()),
        NEW.status,
        target_first_name,
        target_surname,
        target_email,
        target_phone,
        target_location,
        to_jsonb(NEW),
        jsonb_build_object('source', 'trigger:bookings-complete')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_staff_booking_audit ON public.bookings;
CREATE TRIGGER trg_staff_booking_audit
AFTER INSERT OR UPDATE OF assigned_staff_id, status, staff_completed_at ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.capture_staff_booking_audit();

CREATE OR REPLACE FUNCTION public.apply_staff_job_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.staff_job_counters (staff_user_id)
  VALUES (NEW.staff_user_id)
  ON CONFLICT (staff_user_id) DO NOTHING;

  UPDATE public.staff_job_counters
  SET total_assignments = total_assignments + CASE WHEN NEW.event_type = 'assigned' THEN 1 ELSE 0 END,
      total_unassignments = total_unassignments + CASE WHEN NEW.event_type = 'unassigned' THEN 1 ELSE 0 END,
      completed_jobs = completed_jobs + CASE WHEN NEW.event_type = 'completed' THEN 1 ELSE 0 END,
      last_completed_at = CASE
        WHEN NEW.event_type = 'completed' THEN COALESCE(NEW.completed_at, NOW())
        ELSE last_completed_at
      END,
      updated_at = NOW()
  WHERE staff_user_id = NEW.staff_user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_staff_job_counter ON public.staff_job_audit;
CREATE TRIGGER trg_apply_staff_job_counter
AFTER INSERT ON public.staff_job_audit
FOR EACH ROW
EXECUTE FUNCTION public.apply_staff_job_counter();

-- Bootstrap existing staff directory rows so history is available immediately.
INSERT INTO public.staff_directory (
  staff_user_id,
  first_name,
  surname,
  email,
  phone,
  location,
  created_at,
  last_seen_at,
  is_active,
  archived_at
)
SELECT
  p.id,
  p.first_name,
  p.surname,
  p.email,
  p.phone,
  p.location,
  NOW(),
  NOW(),
  TRUE,
  NULL
FROM public.profiles p
WHERE p.role = 'staff'
ON CONFLICT (staff_user_id)
DO UPDATE SET
  first_name = EXCLUDED.first_name,
  surname = EXCLUDED.surname,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  location = EXCLUDED.location,
  last_seen_at = NOW(),
  is_active = TRUE,
  archived_at = NULL;

-- Bootstrap current assignments for existing bookings (idempotent).
INSERT INTO public.staff_job_audit (
  booking_id,
  event_type,
  staff_user_id,
  booking_status,
  staff_first_name,
  staff_surname,
  staff_email,
  staff_phone,
  staff_location,
  booking_snapshot,
  metadata
)
SELECT
  b.id,
  'assigned',
  b.assigned_staff_id,
  b.status,
  p.first_name,
  p.surname,
  p.email,
  p.phone,
  p.location,
  to_jsonb(b),
  jsonb_build_object('source', 'bootstrap:existing-bookings')
FROM public.bookings b
LEFT JOIN public.profiles p ON p.id = b.assigned_staff_id
WHERE b.assigned_staff_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.staff_job_audit a
    WHERE a.booking_id = b.id
      AND a.event_type = 'assigned'
      AND a.staff_user_id = b.assigned_staff_id
  );

-- Bootstrap completed jobs for existing bookings (idempotent).
INSERT INTO public.staff_job_audit (
  booking_id,
  event_type,
  staff_user_id,
  completed_at,
  booking_status,
  staff_first_name,
  staff_surname,
  staff_email,
  staff_phone,
  staff_location,
  booking_snapshot,
  metadata
)
SELECT
  b.id,
  'completed',
  b.assigned_staff_id,
  COALESCE(b.staff_completed_at, NOW()),
  b.status,
  p.first_name,
  p.surname,
  p.email,
  p.phone,
  p.location,
  to_jsonb(b),
  jsonb_build_object('source', 'bootstrap:existing-bookings')
FROM public.bookings b
LEFT JOIN public.profiles p ON p.id = b.assigned_staff_id
WHERE b.assigned_staff_id IS NOT NULL
  AND (b.status = 'Complete' OR b.staff_completed_at IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1
    FROM public.staff_job_audit a
    WHERE a.booking_id = b.id
      AND a.event_type = 'completed'
      AND a.staff_user_id = b.assigned_staff_id
  );

-- Rebuild counters from the audit table so totals stay correct after bootstrap.
INSERT INTO public.staff_job_counters (
  staff_user_id,
  total_assignments,
  total_unassignments,
  completed_jobs,
  last_completed_at,
  updated_at
)
SELECT
  a.staff_user_id,
  COUNT(*) FILTER (WHERE a.event_type = 'assigned')::INTEGER,
  COUNT(*) FILTER (WHERE a.event_type = 'unassigned')::INTEGER,
  COUNT(*) FILTER (WHERE a.event_type = 'completed')::INTEGER,
  MAX(a.completed_at) FILTER (WHERE a.event_type = 'completed'),
  NOW()
FROM public.staff_job_audit a
GROUP BY a.staff_user_id
ON CONFLICT (staff_user_id)
DO UPDATE SET
  total_assignments = EXCLUDED.total_assignments,
  total_unassignments = EXCLUDED.total_unassignments,
  completed_jobs = EXCLUDED.completed_jobs,
  last_completed_at = EXCLUDED.last_completed_at,
  updated_at = NOW();

ALTER TABLE public.staff_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_job_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_job_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_audit_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins can read staff directory" ON public.staff_directory;
CREATE POLICY "admins can read staff directory"
  ON public.staff_directory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "admins can read staff job audit" ON public.staff_job_audit;
CREATE POLICY "admins can read staff job audit"
  ON public.staff_job_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "admins can read staff job counters" ON public.staff_job_counters;
CREATE POLICY "admins can read staff job counters"
  ON public.staff_job_counters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "admins can read staff audit documents" ON public.staff_audit_documents;
CREATE POLICY "admins can read staff audit documents"
  ON public.staff_audit_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "admins can insert staff audit documents" ON public.staff_audit_documents;
CREATE POLICY "admins can insert staff audit documents"
  ON public.staff_audit_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
