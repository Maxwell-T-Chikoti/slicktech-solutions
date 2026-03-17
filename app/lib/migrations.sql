-- Add image_url column to services for uploaded images (separate from gradient)
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for service images (run in Supabase dashboard or via SQL editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('service-images', 'service-images', true)
--   ON CONFLICT (id) DO NOTHING;

-- Storage policy: public read, admin write
-- CREATE POLICY "Public read service images" ON storage.objects FOR SELECT USING (bucket_id = 'service-images');
-- CREATE POLICY "Admins manage service images" ON storage.objects FOR ALL
--   USING (bucket_id = 'service-images' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add password_hash column for local authentication
ALTER TABLE profiles ADD COLUMN password_hash TEXT;

-- Add role column to profiles table to differentiate between users and admins
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create services table
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  price TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can manage services
CREATE POLICY "only admins can manage services"
  ON services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Optional: Create a function to make it easier to promote/demote users
CREATE OR REPLACE FUNCTION set_admin_role(user_id UUID, is_admin BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET role = CASE WHEN is_admin THEN 'admin' ELSE 'user' END
  WHERE id = user_id;
END;
$$;

-- RLS Policy: Users can only see all bookings details if they are admin
-- Regular users only see their own bookings
CREATE POLICY "users see own bookings, admins see all"
  ON bookings FOR SELECT
  USING (
    (auth.uid() = user_id)
    OR (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ))
  );

-- RLS Policy: Only admins can update booking status
CREATE POLICY "only admins can update bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Users can only see their own profile, admins can see all
CREATE POLICY "users see own profile, admins see all"
  ON profiles FOR SELECT
  USING (
    (auth.uid() = id)
    OR (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ))
  );
