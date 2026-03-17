-- 1) Extend profile roles to include staff.
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('user', 'admin', 'staff'));

-- 2) Add booking assignment columns for staff workflow.
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS staff_notes TEXT,
ADD COLUMN IF NOT EXISTS staff_acknowledged_at TIMESTAMPTZ;

-- 2b) Add job completion columns for staff workflow.
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS staff_completion_report TEXT,
ADD COLUMN IF NOT EXISTS staff_completed_at TIMESTAMPTZ;

-- 3) RLS policy for staff to view only jobs assigned to them.
DROP POLICY IF EXISTS "staff see assigned bookings" ON public.bookings;
CREATE POLICY "staff see assigned bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'staff'
    )
    AND assigned_staff_id = auth.uid()
  );

-- 4) RLS policy for staff to acknowledge/update notes on assigned jobs.
DROP POLICY IF EXISTS "staff update assigned bookings" ON public.bookings;
CREATE POLICY "staff update assigned bookings"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'staff'
    )
    AND assigned_staff_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'staff'
    )
    AND assigned_staff_id = auth.uid()
  );

-- 5) Admins can assign staff and update staff fields.
DROP POLICY IF EXISTS "admins assign staff to bookings" ON public.bookings;
CREATE POLICY "admins assign staff to bookings"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Example SQL to set one existing user as staff after creating them in Auth:
-- UPDATE public.profiles
-- SET role = 'staff'
-- WHERE email = 'staff1@example.com';
