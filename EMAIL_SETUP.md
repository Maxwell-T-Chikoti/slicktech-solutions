# Email Confirmation Setup Guide

## Overview
Your booking system is now configured to send confirmation emails to users when they make a booking. We're using **Resend**, a modern email service that's perfect for Next.js applications.

## Setup Instructions

### Step 1: Create a Resend Account
1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get Your API Key
1. Log into your Resend dashboard
2. Navigate to **API Keys** section
3. Create a new API key (or copy your existing one)
4. Copy the entire API key

### Step 3: Add Environment Variable
1. Open `.env.local` in your project root
2. Add the following lines:
   ```
   RESEND_API_KEY=your_api_key_here
   ```
3. Replace the placeholder value with your actual API key
4. Save the file

### Step 4: Verify Setup
1. Run your development server: `npm run dev`
2. Make a test booking in your application
3. Check your email inbox for the confirmation email
4. The email should contain all booking details

## Email Features

The confirmation emails include:
- ✅ Professional HTML template with SlickTech branding
- ✅ Complete booking details (date, time, service, etc.)
- ✅ Booking ID for reference
- ✅ Contact information
- ✅ Instructions for rescheduling

## Testing in Development

**Free Tier Limitation:**
- Resend free tier requires you to verify the sender email domain
- During development, use your email address for testing
- In production, you'll want to set up a proper domain (resend.com provides guides)

### Test with Your Email
1. Open your Resend dashboard
2. Add your email to the "Verified Senders" list
3. Make a booking using your account
4. You should receive the confirmation email

## Deployment (Netlify)

When deploying to Netlify:
1. Go to **Site Settings → Build & deploy → Environment**
2. Click **Edit variables**
3. Add `RESEND_API_KEY` with your Resend API key
4. Save and redeploy

## Troubleshooting

**Email not received?**
- Check spam/junk folder
- Verify the email address is correct in your Supabase user profile
- Check browser console for errors
- Check Resend dashboard activity logs for failed sends

**API Key issues?**
- Ensure the key is correct (copy from Resend dashboard again)
- Check that the .env.local file has no extra spaces
- Restart your development server after adding the key

**Domain/Sender email issues?**
- In development, make sure your email is verified in Resend
- For production, consider setting up a custom domain in Resend

## Future Enhancements

You can later add:
- Email templates for different services
- Admin notification emails
- Rescheduling confirmation emails
- Email reminders before bookings
- Invoice/receipt emails

## Support

For Resend issues, visit: https://resend.com/docs
