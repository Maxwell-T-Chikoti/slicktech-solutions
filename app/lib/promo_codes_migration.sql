-- Promo codes table for percentage-based discounts
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  percentage_off NUMERIC(5,2) NOT NULL CHECK (percentage_off > 0 AND percentage_off <= 100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage promo codes" ON public.promo_codes;
CREATE POLICY "admins manage promo codes"
  ON public.promo_codes FOR ALL
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

-- Keep updated_at in sync automatically.
CREATE OR REPLACE FUNCTION public.set_promo_codes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS promo_codes_set_updated_at ON public.promo_codes;
CREATE TRIGGER promo_codes_set_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.set_promo_codes_updated_at();
