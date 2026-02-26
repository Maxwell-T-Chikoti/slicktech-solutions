# Admin Role Setup Guide

## What Changed

✅ Added a `role` column to the `profiles` table
✅ Updated login flows to check user role
✅ Admin login now verifies admin privileges
✅ Regular user login rejects admins
✅ Admin dashboard verifies authorization

## Steps to Implement

### 1. Run the SQL Migration in Supabase

Go to your Supabase project → SQL Editor → create a new query and paste the contents of `app/lib/migrations.sql`, then run it.

**This will:**
- Add the `role` column (default: `'user'`)
- Create a helper function `set_admin_role()`
- Add RLS policies for data access control

### 2. Promote a User to Admin

Once the migration is done, update any user to be an admin by running this SQL in Supabase:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

Or use the helper function:
```sql
SELECT set_admin_role('user-uuid-here', true);
```

### 3. Test the Flows

**Regular User Login:**
1. Go to login screen
2. Enter regular user email/password
3. Should log in normally to user dashboard
4. If user is an admin, it will be rejected with "Admins must use the admin login portal"

**Admin Login:**
1. Click the admin icon (shield icon) on login screen
2. Enter admin email/password
3. Should verify admin role and show admin dashboard
4. If user is not an admin, shows "You do not have admin privileges"

### 4. Testing with Sample Data

To test locally, you can:

1. Create two test accounts (one regular, one that you'll promote to admin)
2. Run the SQL to promote one to admin
3. Test login flows from both accounts

## How It Works

- **New signups** automatically get `role = 'user'` (default)
- **Login verification** checks the `profiles.role` column and branches accordingly
- **RLS Policies** (added via migration) ensure:
  - Regular users only see their own bookings
  - Admins can see all bookings and update statuses
  - Regular users only see their own profile

## Next Steps (Optional)

- Add an admin panel to manage users and promote/demote them
- Add email notifications when bookings are confirmed
- Add admin analytics dashboard
