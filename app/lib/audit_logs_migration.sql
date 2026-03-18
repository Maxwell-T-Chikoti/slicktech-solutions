-- Persistent audit log storage for admin investigations and compliance export.

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actor_user_id UUID,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  source TEXT DEFAULT 'web',
  target_type TEXT,
  target_id TEXT,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs (category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON audit_logs (actor_user_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can read all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "authenticated users can insert their own audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (
      actor_user_id IS NULL
      OR actor_user_id = auth.uid()
    )
  );

-- Optional DB-level auditing for key business tables.
-- This captures create/update/delete changes even if UI logging is missed.
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor UUID;
  target_id_value TEXT;
BEGIN
  BEGIN
    actor := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    actor := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    target_id_value := COALESCE((OLD.id)::TEXT, NULL);
  ELSE
    target_id_value := COALESCE((NEW.id)::TEXT, NULL);
  END IF;

  INSERT INTO audit_logs (
    actor_user_id,
    actor_role,
    action,
    category,
    source,
    target_type,
    target_id,
    metadata
  ) VALUES (
    actor,
    CASE WHEN actor IS NULL THEN 'system' ELSE 'authenticated' END,
    CONCAT('DB ', TG_OP, ' on ', TG_TABLE_NAME),
    'data-change',
    'db-trigger',
    TG_TABLE_NAME,
    target_id_value,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.bookings') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_audit_bookings ON bookings';
    EXECUTE 'CREATE TRIGGER trg_audit_bookings AFTER INSERT OR UPDATE OR DELETE ON bookings FOR EACH ROW EXECUTE FUNCTION audit_table_changes()';
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_audit_profiles ON profiles';
    EXECUTE 'CREATE TRIGGER trg_audit_profiles AFTER INSERT OR UPDATE OR DELETE ON profiles FOR EACH ROW EXECUTE FUNCTION audit_table_changes()';
  END IF;

  IF to_regclass('public.services') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_audit_services ON services';
    EXECUTE 'CREATE TRIGGER trg_audit_services AFTER INSERT OR UPDATE OR DELETE ON services FOR EACH ROW EXECUTE FUNCTION audit_table_changes()';
  END IF;

  IF to_regclass('public.reviews') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_audit_reviews ON reviews';
    EXECUTE 'CREATE TRIGGER trg_audit_reviews AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION audit_table_changes()';
  END IF;

  IF to_regclass('public.notifications') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_audit_notifications ON notifications';
    EXECUTE 'CREATE TRIGGER trg_audit_notifications AFTER INSERT OR UPDATE OR DELETE ON notifications FOR EACH ROW EXECUTE FUNCTION audit_table_changes()';
  END IF;

  IF to_regclass('public.blocked_dates') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_audit_blocked_dates ON blocked_dates';
    EXECUTE 'CREATE TRIGGER trg_audit_blocked_dates AFTER INSERT OR UPDATE OR DELETE ON blocked_dates FOR EACH ROW EXECUTE FUNCTION audit_table_changes()';
  END IF;
END;
$$;
