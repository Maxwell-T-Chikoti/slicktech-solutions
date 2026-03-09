# SlickTech Solutions

A Next.js application for booking tech services with a complete authentication system.

## Features

- User registration and login (no email verification required)
- Service booking and management
- Admin dashboard for managing bookings
- Profile management
- Responsive design with Tailwind CSS

## Authentication System

This app uses a custom local authentication system that stores user credentials securely in the database without requiring email verification.

### Database Setup

Before running the app, you need to add the required columns to your Supabase database:

1. Run these SQL commands in your Supabase SQL Editor:

```sql
-- Add password_hash column for local authentication
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add created_at column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
```

### Environment Variables

Make sure you have these environment variables set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for migrations)

## Getting Started

First, install dependencies:

```bash
npm install
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## User Registration

Users can register without any email verification. The system:
- Stores user data directly in the profiles table
- Uses basic password hashing for security
- Creates immediate user sessions via localStorage
- No emails are sent during registration

## Admin Access

To create an admin user, update a user's role in the database:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
```

Admins can access the admin dashboard through the "Admin Login" option.
