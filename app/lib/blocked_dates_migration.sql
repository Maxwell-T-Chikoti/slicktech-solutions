-- Blocked/unavailable dates table for service availability management
CREATE TABLE IF NOT EXISTS blocked_dates (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  reason TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- Admins can manage blocked dates
CREATE POLICY "admins manage blocked dates"
  ON blocked_dates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Anyone can read blocked dates (needed for booking calendar)
CREATE POLICY "public can read blocked dates"
  ON blocked_dates FOR SELECT
  USING (true);
