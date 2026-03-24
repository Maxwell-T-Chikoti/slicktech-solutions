-- Chat feature upgrades: attachments, read receipts, and pinned messages.

ALTER TABLE public.booking_staff_chat_messages
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS read_by_admin_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS read_by_staff_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_booking_staff_chat_pinned
  ON public.booking_staff_chat_messages (booking_id, is_pinned, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_staff_chat_unread_admin
  ON public.booking_staff_chat_messages (booking_id, sender_role, read_by_admin_at)
  WHERE sender_role = 'staff';

CREATE INDEX IF NOT EXISTS idx_booking_staff_chat_unread_staff
  ON public.booking_staff_chat_messages (booking_id, sender_role, read_by_staff_at)
  WHERE sender_role = 'admin';
