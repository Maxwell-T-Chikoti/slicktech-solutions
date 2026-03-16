import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const {
      userEmail,
      userName,
      service,
      date,
      time,
      description,
      extraServices,
      bookingId,
    } = await request.json();

    // Validate required fields
    if (!userEmail || !userName || !service || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create email HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .header {
              background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
              color: white;
              padding: 30px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 8px 8px;
              border: 1px solid #e5e7eb;
            }
            .booking-details {
              background-color: #f0f4f8;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: bold;
              width: 150px;
              color: #1e40af;
            }
            .detail-value {
              flex: 1;
              color: #666;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #999;
              text-align: center;
            }
            .button {
              display: inline-block;
              background-color: #1e40af;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmation</h1>
              <p>Your appointment has been successfully scheduled</p>
            </div>
            
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>Thank you for booking with SlickTech Solutions! We're excited to help you with your service request.</p>
              
              <div class="booking-details">
                <div class="detail-row">
                  <div class="detail-label">Booking ID:</div>
                  <div class="detail-value">#${bookingId || 'Pending'}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Service:</div>
                  <div class="detail-value">${service}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Date:</div>
                  <div class="detail-value">${date}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Time:</div>
                  <div class="detail-value">${time}</div>
                </div>
                ${extraServices ? `
                <div class="detail-row">
                  <div class="detail-label">Extra Services:</div>
                  <div class="detail-value">${extraServices}</div>
                </div>
                ` : ''}
                ${description ? `
                <div class="detail-row">
                  <div class="detail-label">Description:</div>
                  <div class="detail-value">${description}</div>
                </div>
                ` : ''}
              </div>
              
              <p>Your booking status is currently <strong>Pending</strong>. Our team will review your request and confirm your appointment shortly.</p>
              
              <p>If you need to reschedule or have any questions, please log into your account and manage your bookings from the dashboard.</p>
              
              <div class="footer">
                <p>© 2026 SlickTech Solutions. All rights reserved.</p>
                <p>Phone: (254)6578900 | Email: company@email.com</p>
                <p>If you did not make this booking, please contact us immediately.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'SlickTech Solutions <onboarding@resend.dev>',
      to: userEmail,
      subject: `Booking Confirmation - ${service}`,
      html: htmlContent,
    });

    // `result` may wrap the response inside a `data` property according to types
    return NextResponse.json(
      { success: true, messageId: (result as any).data?.id ?? null },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send confirmation email' },
      { status: 500 }
    );
  }
}
