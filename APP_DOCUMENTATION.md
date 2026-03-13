# SlickTech Solutions - Full App Documentation

## 1. Project Overview
SlickTech Solutions is a Next.js 16 application for service booking and management with:
- Customer signup/login and profile management
- User booking lifecycle (create, view, reschedule once, cancel)
- Admin dashboard for bookings, services, and availability management
- AI chat assistant and AI-powered scheduling/demand insights
- Email notifications via Resend
- PDF invoice/booking document generation and verification links

Primary app style: a hybrid of App Router routes plus in-app screen switching under `/booking`.

## 2. Tech Stack
- Framework: Next.js 16 (`app/` router)
- Language: TypeScript + React 19
- Styling: Tailwind CSS v4 (`app/globals.css`)
- Database/Auth: Supabase (`@supabase/supabase-js`)
- Charts: Recharts
- PDF/Assets: `jspdf`, `html2canvas`, `qrcode`
- Email: Resend
- AI Provider: Groq OpenAI-compatible API
- Deployment target: Netlify (with Next.js plugin) or Vercel (recommended by repo guides)

## 3. High-Level Architecture
- Public marketing routes:
  - `/` Home page
  - `/about` About page
  - `/chat` Full-page AI chat
  - `/verify-certificate` Booking/certificate verification
- Application entry route:
  - `/booking` mounts `LoginScreen`, then navigates internally between user/admin flows
- Shared global providers in `app/layout.tsx`:
  - `ThemeProvider` (light/dark mode via `data-theme`)
  - `ChatbotProvider` and global `ChatbotModal`
- Backend endpoints are implemented with Next.js route handlers under `app/api/*`.

## 4. Route Map
### 4.1 App Router Pages
- `app/page.tsx` -> `/`
- `app/about/page.tsx` -> `/about`
- `app/booking/page.tsx` -> `/booking`
- `app/chat/page.tsx` -> `/chat`
- `app/reset-password/page.tsx` -> `/reset-password`
- `app/reset-password/page-new.tsx` -> alternate reset page implementation
- `app/verify-certificate/page.tsx` -> `/verify-certificate`

### 4.2 API Routes
- `app/api/chat/route.ts` -> `POST /api/chat`
- `app/api/ai-insights/route.ts` -> `POST /api/ai-insights`
- `app/api/send-booking-confirmation/route.ts` -> `POST /api/send-booking-confirmation`
- `app/api/send-status-notification/route.ts` -> `POST /api/send-status-notification`

### 4.3 Present but Not Yet Implemented as Route Files
- `app/api/payments/record/` (folder exists, no `route.ts`)
- `app/api/reminders/process/` (folder exists, no `route.ts`)

## 5. Internal Screen Flow Under `/booking`
`/booking` renders `app/screens/login.tsx`, then conditionally routes in component state:

### 5.1 Customer Auth Flow
- Login: `app/screens/login.tsx`
  - Supabase `auth.signInWithPassword`
  - Loads user profile from `profiles`
  - Rejects admin users from customer portal
  - Stores local session in `localStorage['slicktech_user']`
- Signup: `app/screens/signup.tsx`
  - Supabase `auth.signUp`
  - Inserts row in `profiles`
  - Stores local session in `localStorage['slicktech_user']`
- Forgot password: `app/screens/forgotPassword.tsx`
  - `auth.resetPasswordForEmail(...)` with redirect to `/reset-password`
- Reset password: `app/reset-password/ResetPasswordForm.tsx`
  - Reads recovery tokens from URL params
  - `auth.setSession(...)`
  - `auth.updateUser({ password })`

### 5.2 User Dashboard Flow
Main shell: `app/screens/dashboard.tsx`
- Loads user bookings (`bookings`) and service catalog (`services`)
- Internal pages switched by `currentPage` state:
  - `services` -> `app/screens/services.tsx`
  - `bookings` -> `app/screens/bookings.tsx`
  - `bookingdetails` -> `app/screens/bookingdetails.tsx`
  - `newbooking` -> `app/screens/newbooking.tsx`
  - `profile` -> `app/screens/profile.tsx`
  - `myaccount` -> `app/screens/myaccount.tsx`

### 5.3 Admin Flow
- Admin login: `app/screens/adminLogin.tsx`
  - Supabase auth + role check (`profiles.role === 'admin'`)
- Admin dashboard: `app/screens/adminDashboard.tsx`
  - Booking operations and status changes
  - Service management
  - Blocked dates management
  - Analytics and AI insights

## 6. Data Model (Tables Referenced in Code)
The app references these Supabase tables:
- `profiles`
- `bookings`
- `services`
- `reviews`
- `notifications`
- `blocked_dates`

Migration SQL sources:
- `app/lib/migrations.sql`
- `app/lib/blocked_dates_migration.sql`
- `app/lib/premium_features_migration.sql`

### 6.1 Notable Columns/Rules from Code and Migrations
- `profiles.role`: `'user' | 'admin'` (used for portal access control)
- `bookings.status`: used values include `Pending`, `Confirmed`, `Complete`, `Rejected`
- `bookings.reschedules`: booking can be rescheduled once in UI logic
- `blocked_dates.date`: prevents booking date selection
- `reviews`: one review per booking (`booking_id` unique)
- `notifications.is_read`: notification badge/read state in navbar

### 6.2 RLS Expectations
Migration files define RLS policies that generally enforce:
- Users can read/update their own data
- Admins can manage wider datasets
- Public read allowed for blocked dates

## 7. Core Feature Workflows
### 7.1 Booking Creation
File: `app/screens/newbooking.tsx`
1. Load services and blocked dates
2. Optional AI slot suggestion (`POST /api/ai-insights`, type `scheduling`)
3. Insert booking row with `Pending` status
4. Insert notification for user
5. Trigger booking confirmation email (`POST /api/send-booking-confirmation`)

### 7.2 Booking Management
Files: `app/screens/bookings.tsx`, `app/screens/bookingdetails.tsx`
- View booking list
- Cancel booking (`delete from bookings`)
- Reschedule flow checks conflicts against confirmed bookings + blocked dates
- Enforces one-reschedule limit in UI

### 7.3 Reviews and Service Rating
File: `app/screens/bookingdetails.tsx`
- User can submit/update review for a booking
- Upsert into `reviews` by `booking_id`
- Service average rating is recalculated from `reviews`

### 7.4 Invoices, Booking PDF, Certificates, and Verification
- PDF helpers: `app/lib/pdfUtils.ts`
- Booking details can generate PDF artifacts
- Verification URL format: `/verify-certificate?booking=<id>&type=booking` (or certificate token)
- Verification page (`app/verify-certificate/page.tsx`) validates record by ID/token and booking status

### 7.5 Notifications
- Navbar fetches latest notifications from `notifications`
- Opening notifications marks unread rows as read

## 8. AI Features
### 8.1 Customer Chat Assistant
- UI: `app/chat/page.tsx` and `app/components/ChatbotModal.tsx`
- API: `POST /api/chat`
- Model provider: Groq API
- Prompt grounding: `app/lib/companyKnowledge.ts`

### 8.2 AI Insights Endpoint
- API: `POST /api/ai-insights`
- Modes:
  - `scheduling` suggestions (primary + backups)
  - `demand` weekly forecast JSON
- Strict JSON output expected and parsed server-side

## 9. Email System
### 9.1 Booking Confirmation Email
- Endpoint: `POST /api/send-booking-confirmation`
- Provider: Resend
- Triggered after booking creation

### 9.2 Booking Status Notification Email
- Endpoint: `POST /api/send-status-notification`
- Triggered from admin status actions
- Supports styled templates per status and optional custom message

### 9.3 Password Reset Template
- HTML template file: `app/api/email-templates/reset-password-template.html`
- Applied in Supabase Auth email template settings (manual copy process documented in `EMAIL_TEMPLATE_SETUP.md`)

## 10. Theme and Global UI State
- Theme context: `app/components/ThemeProvider.tsx`
- Persisted key: `localStorage['slicktech_theme']`
- Chat modal visibility: `app/context/ChatbotContext.tsx`
- Global chat modal mounted in `app/layout.tsx`

## 11. Environment Variables
Required by code/docs:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (migration/helper usage)
- `RESEND_API_KEY` (email routes)
- `GROQ_API_KEY` (AI routes)
- `GROQ_MODEL` (optional override, default `llama-3.3-70b-versatile`)

## 12. Setup and Run
1. Install dependencies:
   - `npm install`
2. Configure env vars in `.env.local`
3. Apply SQL migrations (manual via Supabase SQL Editor):
   - `app/lib/migrations.sql`
   - `app/lib/blocked_dates_migration.sql`
   - `app/lib/premium_features_migration.sql`
4. Run app:
   - `npm run dev`
5. Optional production test:
   - `npm run build`
   - `npm start`

## 13. Deployment Notes
- Netlify config in `netlify.toml` includes `@netlify/plugin-nextjs`
- Repo docs recommend Vercel as preferred Next.js deployment target
- Ensure all runtime env vars are configured in deployment platform settings

## 14. Operational Scripts
- `migrate.js`: checks migration prerequisites and prints SQL guidance for missing schema pieces

## 15. Current Gaps / Extension Points
- API extension folders exist without active route handlers:
  - `app/api/payments/record/`
  - `app/api/reminders/process/`
- Pricing/revenue logic is spread across UI modules; consider centralizing server-side for consistency
- Session handling mixes Supabase auth session and localStorage user object (`slicktech_user`)

## 16. File-Level Reference Index
- Root layout/providers: `app/layout.tsx`
- Global styles/theme overrides: `app/globals.css`
- Supabase client: `app/lib/supabaseClient.ts`
- AI knowledge base: `app/lib/companyKnowledge.ts`
- PDF + verification helpers: `app/lib/pdfUtils.ts`
- Main customer shell: `app/screens/dashboard.tsx`
- Admin shell: `app/screens/adminDashboard.tsx`
- Route handlers: `app/api/*/route.ts`

---
Documentation generated from current repository state on 2026-03-13.
