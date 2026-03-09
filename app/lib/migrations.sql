-- Add password_hash column for local authentication
ALTER TABLE profiles ADD COLUMN password_hash TEXT;

-- Add role column to profiles table to differentiate between users and admins
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

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
