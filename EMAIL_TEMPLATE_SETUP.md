# Reset Password Email Setup Instructions

## How to Apply the Custom Email Template

Your beautiful new password reset email template has been created! Follow these steps to apply it:

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Configure Password Reset Email
1. Click on **Password Reset** email template
2. You'll see two tabs: **Text** and **HTML**
3. Click the **HTML** tab

### Step 3: Copy the Template
The template file has been created at: `app/api/email-templates/reset-password-template.html`

Copy the entire HTML content from that file.

### Step 4: Paste into Supabase
1. Clear the existing HTML in the Supabase template editor
2. Paste the new template HTML
3. Click **Save**

## Available Variables in the Template

The template uses these Supabase variables (they'll be automatically replaced):

- `{{ .ConfirmationURL }}` - The password reset link (replace with your redirect URL)
- `{{ .Email }}` - User's email address (optional to add)
- `{{ .Data }}` - Custom data (if needed)

## Customization Options

You can customize:

### Colors
- **Primary Blue**: Change `#2563eb` to your brand color
- **Secondary Blue**: Change `#1e40af` for hover states
- **Accent Colors**: Modify warning/alert colors as needed

### Logo
Replace "SLICKTECH" text with your actual logo URL:
```html
<img src="YOUR_LOGO_URL" alt="SlickTech Logo" width="120" height="120">
```

### Support Email
Replace `support@slicktech.com` with your actual support email

### Links
Replace these with your actual links:
- `https://slicktech.com/help` - Your help center
- `https://slicktech.com/privacy` - Privacy policy
- `https://slicktech.com/terms` - Terms of service

## Email Template Features

✅ **Modern Design**
- Gradient backgrounds matching your app
- Responsive layout that works on all devices
- Professional typography

✅ **User-Friendly**
- Clear call-to-action button
- Alternative copy-paste link option
- Security notices for safety
- Features/benefits section

✅ **Mobile Optimized**
- Responsive design
- Large, easy-to-tap buttons
- Readable on all screen sizes

✅ **Branded**
- Matches your SlickTech design system
- Consistent color scheme
- Professional footer

## Tips for Best Results

1. **Test Emails**: Always send a test password reset to yourself before going live
2. **Preview**: Test the email on different email clients (Gmail, Outlook, Apple Mail, etc.)
3. **Button Color**: Make sure the button color has good contrast and matches your brand
4. **Mobile Testing**: Open the email on a mobile device to ensure it looks good

## Alternative: Email Clients

The template is designed to work with all major email clients:
- ✅ Gmail
- ✅ Outlook
- ✅ Apple Mail
- ✅ Phone email apps
- ✅ Web-based email

## Need More Help?

If you want to make further customizations:
1. Modify the HTML file directly
2. Test it in an email preview tool
3. Re-upload to Supabase

Enjoy your new professional password reset email! 🎉
