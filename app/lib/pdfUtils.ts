"use client";

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import SlickTechLogo from '../Assets/SlickTech_Logo.png';

export const buildCertificateId = (bookingId: number | string) => `ST-${bookingId}`;
export const buildInvoiceNumber = (bookingId: number | string) => `INV-${new Date().getFullYear()}-${bookingId}`;
export const buildBookingToken = (bookingId: number | string) => `BOOK-${bookingId}`;

export const buildVerificationUrl = (params: Record<string, string>) => {
  if (typeof window === 'undefined') return '';
  const search = new URLSearchParams(params);
  return `${window.location.origin}/verify-certificate?${search.toString()}`;
};

export const generateQrDataUrl = async (text: string) => {
  return QRCode.toDataURL(text, {
    width: 180,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
};

const renderPdfFromHtml = async (html: string, fileName: string, options?: { orientation?: 'portrait' | 'landscape'; width?: number; height?: number; format?: 'a4' }) => {
  const orientation = options?.orientation ?? 'portrait';
  const pdf = new jsPDF(orientation, 'mm', options?.format ?? 'a4');
  const container = document.createElement('div');
  container.style.width = orientation === 'landscape' ? '297mm' : '210mm';
  container.style.minHeight = orientation === 'landscape' ? '210mm' : '297mm';
  container.style.padding = '20mm';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const images = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(images.map((img) => new Promise<void>((resolve, reject) => {
      if (img.complete) {
        resolve();
        return;
      }
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image failed to load'));
    })));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: options?.width ?? (orientation === 'landscape' ? 1123 : 794),
      height: options?.height ?? (orientation === 'landscape' ? 794 : 1123),
    });

    const imgData = canvas.toDataURL('image/png');
    if (orientation === 'landscape') {
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
    } else {
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    }
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
};

export const downloadInvoicePDF = async (booking: any) => {
  const invoiceNumber = buildInvoiceNumber(booking.id);
  const verifyUrl = buildVerificationUrl({ booking: String(booking.id), type: 'booking' });
  const qrDataUrl = await generateQrDataUrl(verifyUrl);

  const html = `
    <div style="border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;background:#ffffff;">
      <div style="background:linear-gradient(135deg,#0f172a,#1d4ed8);padding:24px 28px;color:white;display:flex;justify-content:space-between;align-items:center;gap:24px;">
        <div>
          <img src="${SlickTechLogo.src}" alt="SlickTech Logo" style="height:72px;margin-bottom:10px;" />
          <h1 style="margin:0;font-size:28px;font-weight:800;letter-spacing:1px;">SlickTech Invoice</h1>
          <p style="margin:8px 0 0;opacity:.85;">Professional technology services</p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;opacity:.8;">Invoice Number</p>
          <p style="margin:0;font-size:20px;font-weight:800;">${invoiceNumber}</p>
          <p style="margin:10px 0 0;font-size:12px;opacity:.85;">Issued ${new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div style="padding:28px;display:grid;grid-template-columns:1.3fr .7fr;gap:24px;">
        <div>
          <div style="margin-bottom:20px;padding:18px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;">
            <h2 style="margin:0 0 12px;font-size:16px;color:#0f172a;">Client & Booking Details</h2>
            <p style="margin:6px 0;"><strong>Customer:</strong> ${booking.user_name || 'SlickTech Client'}</p>
            <p style="margin:6px 0;"><strong>Email:</strong> ${booking.user_email || 'N/A'}</p>
            <p style="margin:6px 0;"><strong>Booking ID:</strong> ${booking.id}</p>
            <p style="margin:6px 0;"><strong>Status:</strong> ${booking.status}</p>
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:14px;overflow:hidden;border-radius:14px;border:1px solid #e2e8f0;">
            <thead>
              <tr style="background:#eff6ff;">
                <th style="padding:12px;border-bottom:1px solid #dbeafe;text-align:left;color:#1e3a8a;">Service</th>
                <th style="padding:12px;border-bottom:1px solid #dbeafe;text-align:left;color:#1e3a8a;">Schedule</th>
                <th style="padding:12px;border-bottom:1px solid #dbeafe;text-align:left;color:#1e3a8a;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:14px;border-bottom:1px solid #e2e8f0;">${booking.service}</td>
                <td style="padding:14px;border-bottom:1px solid #e2e8f0;">${booking.date}<br/><span style="font-size:12px;color:#64748b;">${booking.time}</span></td>
                <td style="padding:14px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#1d4ed8;">${booking.price || 'R0.00'}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top:20px;padding:18px;border-radius:16px;background:#0f172a;color:white;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <p style="margin:0;font-size:12px;text-transform:uppercase;opacity:.75;">Total Due</p>
              <p style="margin:6px 0 0;font-size:28px;font-weight:800;">${booking.price || 'R0.00'}</p>
            </div>
            <div style="text-align:right;">
              <p style="margin:0;font-size:12px;opacity:.75;">Payment terms</p>
              <p style="margin:6px 0 0;font-size:14px;">Due on service date</p>
            </div>
          </div>
        </div>

        <div>
          <div style="padding:18px;border:1px solid #e2e8f0;border-radius:16px;background:#ffffff;text-align:center;">
            <p style="margin:0 0 10px;font-size:12px;text-transform:uppercase;color:#64748b;letter-spacing:1px;">Scan to verify booking</p>
            <img src="${qrDataUrl}" alt="Booking QR" style="width:160px;height:160px;border-radius:12px;border:1px solid #e2e8f0;" />
            <p style="margin:12px 0 0;font-size:12px;color:#475569;line-height:1.5;">This QR opens your booking verification page for quick confirmation.</p>
          </div>

          <div style="margin-top:18px;padding:18px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;">
            <h3 style="margin:0 0 10px;font-size:15px;color:#0f172a;">Notes</h3>
            <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">Thank you for choosing SlickTech Solutions. Please keep this invoice for your records. For support, contact our team with invoice number ${invoiceNumber}.</p>
          </div>
        </div>
      </div>
    </div>`;

  await renderPdfFromHtml(html, `SlickTech_Invoice_${booking.id}.pdf`);
};
