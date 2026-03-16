import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const STATUS_STYLES: Record<string, { color: string; bg: string; icon: string; headline: string; body: string }> = {
  Confirmed: {
    color: '#16a34a',
    bg: '#dcfce7',
    icon: '✅',
    headline: 'Your Booking is Confirmed!',
    body: 'Great news! Our team has reviewed and confirmed your appointment. We look forward to seeing you.',
  },
  Complete: {
    color: '#2563eb',
    bg: '#dbeafe',
    icon: '🎉',
    headline: 'Service Completed!',
    body: 'Your service has been marked as complete. Thank you for choosing SlickTech Solutions! Log in to download your completion certificate.',
  },
  Rejected: {
    color: '#dc2626',
    bg: '#fee2e2',
    icon: '❌',
    headline: 'Booking Could Not Be Confirmed',
    body: 'Unfortunately, we were unable to confirm your booking at this time. Please log in and book a new appointment at a different time, or contact us for assistance.',
  },
  Pending: {
    color: '#d97706',
    bg: '#fef3c7',
    icon: '⏳',
    headline: 'Booking Updated to Pending',
    body: 'Your booking status has been updated. Our team will review it shortly.',
  },
};

export async function POST(request: NextRequest) {
  try {
    const {
      userEmail,
      userName,
      service,
      date,
      time,
      status,
      bookingId,
      customMessage,
    } = await request.json();

    if (!userEmail || !userName || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const style = STATUS_STYLES[status] ?? STATUS_STYLES['Pending'];

    const customSection = customMessage
      ? `
        <div style="margin-top:24px; padding:20px; background:#f0f4f8; border-left:4px solid #1e40af; border-radius:6px;">
          <p style="margin:0 0 8px; font-weight:bold; color:#1e40af;">Message from SlickTech Team:</p>
          <p style="margin:0; color:#374151;">${customMessage}</p>
        </div>`
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8" /></head>
        <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f9fafb;">
          <div style="max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:linear-gradient(135deg,#1e40af 0%,#1e3a8a 100%);color:white;padding:30px;border-radius:8px 8px 0 0;text-align:center;">
              <h1 style="margin:0;font-size:24px;">SlickTech Solutions</h1>
              <p style="margin:8px 0 0;opacity:0.85;">Booking Status Update</p>
            </div>

            <div style="background:white;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;">
              <div style="text-align:center;margin-bottom:24px;">
                <span style="font-size:48px;">${style.icon}</span>
                <h2 style="color:${style.color};margin:12px 0 0;">${style.headline}</h2>
              </div>

              <p>Hello <strong>${userName}</strong>,</p>
              <p>${style.body}</p>

              <div style="background:${style.bg};border:1px solid ${style.color}33;border-radius:8px;padding:20px;margin:20px 0;">
                <p style="margin:0 0 8px;font-weight:bold;color:${style.color};">Booking #${bookingId ?? '—'} — Status: ${status}</p>
                ${service ? `<p style="margin:4px 0;color:#374151;"><strong>Service:</strong> ${service}</p>` : ''}
                ${date ? `<p style="margin:4px 0;color:#374151;"><strong>Date:</strong> ${date}</p>` : ''}
                ${time ? `<p style="margin:4px 0;color:#374151;"><strong>Time:</strong> ${time}</p>` : ''}
              </div>

              ${customSection}

              <p style="margin-top:24px;">Log in to your account to view full booking details and manage your appointments.</p>

              <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
                <p>© 2026 SlickTech Solutions. All rights reserved.</p>
                <p>If you did not request this, please contact us immediately.</p>
              </div>
            </div>
          </div>
        </body>
      </html>`;

    const subject = customMessage
      ? `Message from SlickTech — Booking #${bookingId ?? ''}`
      : `Booking ${status} — ${service ?? 'SlickTech Solutions'}`;

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'SlickTech Solutions <onboarding@resend.dev>',
      to: userEmail,
      subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, messageId: (result as any).data?.id ?? null }, { status: 200 });
  } catch (error) {
    console.error('Error sending status notification:', error);
    return NextResponse.json({ error: 'Failed to send notification email' }, { status: 500 });
  }
}
