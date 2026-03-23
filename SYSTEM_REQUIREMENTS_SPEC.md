# System Requirements Specification (SRS)

## Document Control

- **Project Name:** SlickTech Solutions
- **Document Title:** System Requirements Specification (SRS)
- **Document Version:** 1.0
- **Status:** Baseline (As-Built)
- **Date:** 2026-03-18
- **Prepared For:** SlickTech Solutions stakeholders
- **Prepared By:** Technical specification generated from current repository implementation

## 1. Introduction

### 1.1 Purpose

This document defines the functional and non-functional requirements for the SlickTech Solutions platform. It serves as the reference for stakeholders, developers, testers, and deployment/operations teams.

### 1.2 Scope

SlickTech Solutions is a web-based IT service booking and operations platform that supports:

- Customer registration, login, profile management, and password reset
- Service browsing and booking lifecycle management
- Admin operations for bookings, services, staff, and availability
- Staff account lifecycle and assigned job workflows
- AI chat assistant and AI operational insights
- Email confirmations and booking status notifications
- Booking/certificate verification and PDF-related output support

### 1.3 Definitions and Acronyms

- **SRS:** System Requirements Specification
- **RLS:** Row Level Security
- **API:** Application Programming Interface
- **SSR:** Server-Side Rendering
- **UI:** User Interface
- **Auth:** Authentication

### 1.4 References

- `README.md`
- `APP_DOCUMENTATION.md`
- `ADMIN_SETUP.md`
- `EMAIL_SETUP.md`
- `DEPLOYMENT_GUIDE.md`
- `app/lib/migrations.sql`
- `app/lib/blocked_dates_migration.sql`
- `app/lib/premium_features_migration.sql`
- `app/lib/staff_features_migration.sql`

## 2. Overall Description

### 2.1 Product Perspective

The system is implemented as a single Next.js application using App Router with frontend pages and backend API route handlers under one codebase.

### 2.2 Product Functions (High Level)

- User authentication and role-based access (`user`, `admin`, `staff`)
- Service booking creation and lifecycle management
- Booking conflict handling and blocked-date controls
- Admin dashboard operations for service and booking governance
- Staff provisioning and account administration APIs
- AI-assisted chat and decision support (scheduling/demand/message drafting/service explanation)
- Automated transactional email dispatch
- Notifications and verification utilities

### 2.3 User Classes and Characteristics

- **Customer (`user`):** Books services, tracks appointments, submits reviews
- **Administrator (`admin`):** Full operational management authority
- **Staff (`staff`):** Handles assigned bookings and staff-specific updates

### 2.4 Operating Environment

- Web browser clients (modern evergreen browsers)
- Node.js runtime (`>=20.9.0`)
- Next.js server runtime for API routes and rendering
- Supabase cloud backend (database + auth)

### 2.5 Design and Implementation Constraints

- Platform stack is fixed to Next.js, TypeScript, React, Supabase, and Tailwind
- Third-party integrations (Groq, Resend, Supabase) must be available for full feature set
- Security posture depends on correct RLS policies and server-only secret handling

### 2.6 Assumptions and Dependencies

- Supabase schema migrations are applied successfully
- Required environment variables are configured per environment
- Deployment platform supports Next.js API routes and SSR behavior

## 3. System Architecture and Context

### 3.1 Technology Stack

- **Framework:** Next.js 16.1.6
- **Language:** TypeScript 5.9.3
- **UI:** React 19.2.3, Tailwind CSS v4
- **Data/Auth:** Supabase (`@supabase/supabase-js`)
- **AI:** Groq OpenAI-compatible API
- **Email:** Resend
- **Supporting Libraries:** `jspdf`, `html2canvas`, `qrcode`, `recharts`

### 3.2 Main Routes

- `/` Home
- `/about` About
- `/booking` Application entry (internal screen routing)
- `/chat` Full chat page
- `/reset-password` Password reset view
- `/verify-certificate` Booking/certificate verification

### 3.3 API Route Surface

- `POST /api/chat`
- `POST /api/ai-insights`
- `POST /api/send-booking-confirmation`
- `POST /api/send-status-notification`
- `POST /api/admin/create-staff`
- `GET /api/admin/staff-management`
- `PATCH /api/admin/staff-management`
- `DELETE /api/admin/staff-management`

### 3.4 Not Yet Implemented Endpoints

- `app/api/admin/create-admin/route.ts` (placeholder)
- `app/api/payments/record/` (no active `route.ts`)
- `app/api/reminders/process/` (no active `route.ts`)

## 4. External Interface Requirements

### 4.1 User Interface Requirements

- Responsive UI for desktop and mobile
- Dashboard navigation between customer and admin screens
- Notification indicator and read-state handling
- Chatbot modal/global access and dedicated chat page

### 4.2 Software Interfaces

- **Supabase:** Auth + database CRUD + admin auth APIs
- **Groq API:** chat completions endpoint for AI features
- **Resend API:** transactional email delivery

### 4.3 Communication Interfaces

- HTTPS-based JSON APIs between frontend and backend routes
- Server-side outbound HTTPS to Groq and Resend

## 5. Functional Requirements

Requirement IDs use `FR-xxx` for traceability.

### 5.1 Authentication and Profile

- **FR-001:** The system shall allow user sign-up and sign-in using Supabase Auth.
- **FR-002:** The system shall support password reset initiation and secure password update.
- **FR-003:** The system shall maintain user profile records in `profiles`.
- **FR-004:** The system shall enforce role-aware behavior (`user`, `admin`, `staff`).

### 5.2 Booking and Scheduling

- **FR-005:** The system shall allow authenticated users to create service bookings.
- **FR-006:** The system shall create bookings with lifecycle status tracking.
- **FR-007:** The system shall allow users to view their own bookings.
- **FR-008:** The system shall allow users to cancel bookings.
- **FR-009:** The system shall allow one reschedule per booking in current UI logic.
- **FR-010:** The system shall block date selection for unavailable/blocked dates.
- **FR-011:** The system shall evaluate booking conflicts against existing bookings and blocked dates.

### 5.3 Services, Reviews, and Notifications

- **FR-012:** The system shall support a service catalog backed by `services` data.
- **FR-013:** The system shall support per-booking review create/update in `reviews`.
- **FR-014:** The system shall enforce review rating limits (1 to 5).
- **FR-015:** The system shall create and display in-app notifications for users.
- **FR-016:** The system shall support marking notifications as read.

### 5.4 Email Communications

- **FR-017:** The system shall send booking confirmation emails after booking creation.
- **FR-018:** The system shall send booking status update emails for key states.
- **FR-019:** The system shall support optional custom message content in status notification emails.

### 5.5 AI Features

- **FR-020:** The system shall provide customer chat assistance through `POST /api/chat`.
- **FR-021:** The chat assistant shall be grounded by company knowledge and IT-service relevance constraints.
- **FR-022:** The system shall provide AI insights through `POST /api/ai-insights`.
- **FR-023:** AI insights shall support request types: `scheduling`, `demand`, `message-draft`, `service-explain`.
- **FR-024:** AI insights endpoint shall parse and return strict JSON result payloads.

### 5.6 Admin and Staff Management

- **FR-025:** The system shall allow admin-only creation of staff accounts.
- **FR-026:** The system shall allow admin-only staff listing and account-state retrieval.
- **FR-027:** The system shall allow admin-only staff account updates: disable, enable, reset-password, update-name.
- **FR-028:** The system shall allow admin-only staff account deletion.
- **FR-029:** The system shall support booking assignment and staff workflow fields in `bookings`.
- **FR-030:** The system shall enforce token-based authorization and role checks for staff management APIs.

### 5.7 Verification and Artifacts

- **FR-031:** The system shall provide booking/certificate verification via `/verify-certificate`.
- **FR-032:** The system shall provide PDF-related utility support for booking artifacts.

## 6. Data Requirements

### 6.1 Core Entities

- `profiles`
- `bookings`
- `services`
- `blocked_dates`
- `reviews`
- `notifications`

### 6.2 Staff Workflow Extensions in Bookings

- `assigned_staff_id`
- `staff_notes`
- `staff_acknowledged_at`
- `staff_completion_report`
- `staff_completed_at`

### 6.3 Business Rule Constraints (Current)

- Role values include `user`, `admin`, `staff` (as migrated)
- Reviews are one-per-booking by unique `booking_id`
- `blocked_dates.date` must be unique
- Booking status values in use include `Pending`, `Confirmed`, `Complete`, `Rejected`

## 7. Security Requirements

Requirement IDs use `SR-xxx`.

- **SR-001:** RLS shall be enabled for protected tables and enforced in Supabase.
- **SR-002:** Data access shall be role-scoped with user ownership restrictions.
- **SR-003:** Admin-only APIs shall require valid bearer token and role validation.
- **SR-004:** Service role credentials shall remain server-side only.
- **SR-005:** Sensitive operations (staff provisioning/account actions) shall run through secure server routes.
- **SR-006:** Password reset and update flows shall use Supabase auth mechanisms.

## 8. Non-Functional Requirements

Requirement IDs use `NFR-xxx`.

### 8.1 Performance and Reliability

- **NFR-001:** The system should respond to normal user interactions without perceptible lag under expected small-business load.
- **NFR-002:** API routes shall return explicit status codes and structured JSON errors.
- **NFR-003:** The system shall support production builds via `next build`.

### 8.2 Usability

- **NFR-004:** UI shall be responsive across desktop and mobile form factors.
- **NFR-005:** Workflow language and feedback messages shall be clear to non-technical users.

### 8.3 Maintainability

- **NFR-006:** Codebase shall remain TypeScript-based and modularized by feature routes/screens.
- **NFR-007:** Database changes shall be captured in migration SQL files.

### 8.4 Portability and Deployment

- **NFR-008:** The system shall be deployable on Next.js-compatible hosting platforms.
- **NFR-009:** Vercel is the preferred hosting target for operational compatibility.
- **NFR-010:** Netlify deployments shall include `@netlify/plugin-nextjs` when used.

## 9. Environment and Configuration Requirements

### 9.1 Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`
- `RESEND_API_KEY`

### 9.2 Optional Environment Variables

- `GROQ_MODEL` (default fallback in code)
- `RESEND_FROM_EMAIL`

## 10. API Contract Requirements (Summary)

### 10.1 `POST /api/chat`

- **Input:** `message` (required), `history` (optional)
- **Output:** assistant message + timestamp
- **Errors:** `400`, `502`, `503`, `500`

### 10.2 `POST /api/ai-insights`

- **Input:** `type` and `payload` (required)
- **Output:** `{ result: <json> }`
- **Errors:** `400`, `502`, `503`, `500`

### 10.3 `POST /api/send-booking-confirmation`

- **Required Input:** `userEmail`, `userName`, `service`, `date`, `time`
- **Output:** success flag and message id

### 10.4 `POST /api/send-status-notification`

- **Required Input:** `userEmail`, `userName`, `status`
- **Optional Input:** service/date/time/bookingId/customMessage
- **Output:** success flag and message id

### 10.5 Staff Admin Endpoints

- **Create:** `POST /api/admin/create-staff`
- **List:** `GET /api/admin/staff-management`
- **Update:** `PATCH /api/admin/staff-management`
- **Delete:** `DELETE /api/admin/staff-management?staffId=...`
- **Requirement:** valid bearer token + admin role

## 11. Deployment and Operations Requirements

- Apply SQL migrations before first full use.
- Configure runtime environment variables in host platform settings.
- Verify outgoing email sender identity in Resend for production usage.
- Validate AI provider key and model availability before enabling AI features in production.

## 12. Known Gaps and Exclusions (Current Baseline)

- Admin self-provisioning endpoint exists only as placeholder (`create-admin`).
- Payments recording endpoint is not yet implemented.
- Reminders processing endpoint is not yet implemented.
- Some session handling paths combine auth state and local storage user object (future consolidation recommended).

## 13. Verification and Acceptance Criteria

Requirement IDs use `AC-xxx`.

- **AC-001:** A customer can sign up, sign in, and access booking features.
- **AC-002:** A customer can create a booking and receive confirmation email.
- **AC-003:** A customer can view, cancel, and reschedule booking according to current rules.
- **AC-004:** Admin can update booking statuses and trigger status notifications.
- **AC-005:** Admin can create, list, disable/enable, rename, reset password, and delete staff accounts.
- **AC-006:** AI chat endpoint returns context-grounded responses.
- **AC-007:** AI insights endpoint returns valid JSON for all supported request types.
- **AC-008:** Verification page resolves valid booking/certificate identifiers.
- **AC-009:** RLS and role checks prevent unauthorized cross-user data access.

## 14. Traceability Matrix (High-Level)

- Booking lifecycle: `FR-005` to `FR-011`, validated by `AC-002` and `AC-003`
- Admin/staff governance: `FR-025` to `FR-030`, validated by `AC-005`
- AI capabilities: `FR-020` to `FR-024`, validated by `AC-006` and `AC-007`
- Security controls: `SR-001` to `SR-006`, validated by `AC-009`

## 15. Approval and Sign-Off

- **Business Owner:** ____________________  Date: __________
- **Product/Operations Lead:** ____________  Date: __________
- **Technical Lead:** ____________________  Date: __________
- **QA/Validation Lead:** ________________  Date: __________

---

This SRS reflects the implemented repository baseline as of 2026-03-18 and should be updated when scope, architecture, or regulatory constraints change.
