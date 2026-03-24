-- Staff calendar availability, checklist templates, and booking chat support.

CREATE TABLE IF NOT EXISTS public.staff_unavailability (
  id BIGSERIAL PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unavailable_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_unavailability_unique_slot
  ON public.staff_unavailability (staff_id, unavailable_date, start_time, end_time);

ALTER TABLE public.staff_unavailability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff manage own unavailability" ON public.staff_unavailability;
CREATE POLICY "staff manage own unavailability"
  ON public.staff_unavailability FOR ALL
  USING (
    auth.uid() = staff_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'staff'
    )
  )
  WITH CHECK (
    auth.uid() = staff_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'staff'
    )
  );

DROP POLICY IF EXISTS "admins read all unavailability" ON public.staff_unavailability;
CREATE POLICY "admins read all unavailability"
  ON public.staff_unavailability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id BIGSERIAL PRIMARY KEY,
  service_name TEXT NOT NULL UNIQUE,
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage checklist templates" ON public.checklist_templates;
CREATE POLICY "admins manage checklist templates"
  ON public.checklist_templates FOR ALL
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

DROP POLICY IF EXISTS "staff read checklist templates" ON public.checklist_templates;
CREATE POLICY "staff read checklist templates"
  ON public.checklist_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'staff'
    )
  );

CREATE OR REPLACE FUNCTION public.set_checklist_templates_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS checklist_templates_set_updated_at ON public.checklist_templates;
CREATE TRIGGER checklist_templates_set_updated_at
BEFORE UPDATE ON public.checklist_templates
FOR EACH ROW
EXECUTE FUNCTION public.set_checklist_templates_updated_at();

CREATE TABLE IF NOT EXISTS public.booking_checklist_items (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  item_order INT NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_checklist_unique_item
  ON public.booking_checklist_items (booking_id, item_text);

ALTER TABLE public.booking_checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage booking checklist items" ON public.booking_checklist_items;
CREATE POLICY "admins manage booking checklist items"
  ON public.booking_checklist_items FOR ALL
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

DROP POLICY IF EXISTS "staff manage assigned booking checklist items" ON public.booking_checklist_items;
CREATE POLICY "staff manage assigned booking checklist items"
  ON public.booking_checklist_items FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE b.id = booking_checklist_items.booking_id
        AND b.assigned_staff_id = auth.uid()
        AND p.role = 'staff'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE b.id = booking_checklist_items.booking_id
        AND b.assigned_staff_id = auth.uid()
        AND p.role = 'staff'
    )
  );

CREATE TABLE IF NOT EXISTS public.booking_staff_chat_messages (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'staff')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_staff_chat_booking_created
  ON public.booking_staff_chat_messages (booking_id, created_at);

ALTER TABLE public.booking_staff_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage booking chat" ON public.booking_staff_chat_messages;
CREATE POLICY "admins manage booking chat"
  ON public.booking_staff_chat_messages FOR ALL
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

DROP POLICY IF EXISTS "staff manage assigned booking chat" ON public.booking_staff_chat_messages;
CREATE POLICY "staff manage assigned booking chat"
  ON public.booking_staff_chat_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE b.id = booking_staff_chat_messages.booking_id
        AND b.assigned_staff_id = auth.uid()
        AND p.role = 'staff'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE b.id = booking_staff_chat_messages.booking_id
        AND b.assigned_staff_id = auth.uid()
        AND p.role = 'staff'
    )
  );
