"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import AppAlertDialog from '@/app/components/AppAlertDialog';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaChevronLeft, FaChevronRight, FaDownload, FaStar } from 'react-icons/fa';
import supabase from '@/app/lib/supabaseClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { buildCertificateId, buildVerificationUrl, downloadInvoicePDF, generateQrDataUrl } from '@/app/lib/pdfUtils';
import SlickTechLogo from '../Assets/SlickTech_Logo.png';

interface BookingDetailsProps {
  booking: any;
  setBookings: React.Dispatch<React.SetStateAction<any[]>>;
  onNavigate: (page: string, payload?: any) => void;
  onLogout: () => void;
  startReschedule?: boolean;
}

const ALL_TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

const BookingDetails = ({ booking, setBookings, onNavigate, onLogout, startReschedule = false }: BookingDetailsProps) => {
  const [rescheduling, setRescheduling] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('');  const [loading, setLoading] = useState(true);
  // bookedSlots: a Set of "date||time" strings pulled directly from DB
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [existingReview, setExistingReview] = useState<any | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [serviceAverageRating, setServiceAverageRating] = useState(0);
  const [bookingQrUrl, setBookingQrUrl] = useState('');
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'alert' | 'confirm';
    onConfirm?: () => void | Promise<void>;
  }>(
    {
      isOpen: false,
      title: '',
      message: '',
      variant: 'alert',
    }
  );

  const showAlertDialog = (message: string, title = 'Notice') => {
    setDialog({
      isOpen: true,
      title,
      message,
      variant: 'alert',
    });
  };

  const showConfirmDialog = (message: string, onConfirm: () => void | Promise<void>, title = 'Confirm action') => {
    setDialog({
      isOpen: true,
      title,
      message,
      variant: 'confirm',
      onConfirm,
    });
  };

  // Date picker state
  const [currentDate] = useState(new Date());
  const [displayMonth, setDisplayMonth] = useState(currentDate.getMonth());
  const [displayYear, setDisplayYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    // Show loading animation for at least 1 second
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const handlePreviousMonth = () => {
    if (displayMonth === 0) { setDisplayMonth(11); setDisplayYear(displayYear - 1); }
    else setDisplayMonth(displayMonth - 1);
  };

  const handleNextMonth = () => {
    if (displayMonth === 11) { setDisplayMonth(0); setDisplayYear(displayYear + 1); }
    else setDisplayMonth(displayMonth + 1);
  };

  const isDatePassed = (month: number, day: number, year: number) => {
    const selected = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today;
  };

  // A day is fully booked only if every time slot on that day is taken
  const isDateFullyBooked = (month: number, day: number, year: number) => {
    const dateStr = `${monthNames[month]} ${day}, ${year}`;
    return ALL_TIME_SLOTS.every(slot => bookedSlots.has(`${dateStr}||${slot}`));
  };

  // A specific time slot is booked on the currently selected date
  const isTimeSlotBooked = (time: string) => {
    if (!tempDate) return false;
    return bookedSlots.has(`${tempDate}||${time}`);
  };

  // Fetch ALL confirmed bookings from DB except the current one, build a Set of "date||time" keys
  const fetchBookedSlots = async () => {
    setLoadingSlots(true);
    try {
      const [bookingsRes, blockedRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('date, time, status, id')
          .eq('status', 'Confirmed')
          .neq('id', booking.id),
        supabase.from('blocked_dates').select('date')
      ]);

      if (bookingsRes.error) {
        console.error('Error fetching booked slots:', bookingsRes.error);
      } else {
        console.log('Raw DB confirmed bookings (excluding current):', bookingsRes.data);
        const slots = new Set<string>();
        bookingsRes.data?.forEach(b => {
          if (b.date && b.time) {
            slots.add(`${b.date}||${b.time}`);
          }
        });
        console.log('Booked slots set:', Array.from(slots));
        setBookedSlots(slots);
      }

      if (blockedRes.data) {
        setBlockedDates(new Set(blockedRes.data.map((r: any) => r.date)));
      }
    } finally {
      setLoadingSlots(false);
    }
  };

  // Fetch when rescheduling panel opens
  React.useEffect(() => {
    if (rescheduling && booking?.id) {
      fetchBookedSlots();
    }
  }, [rescheduling, booking?.id]);

  React.useEffect(() => {
    if (startReschedule && booking && booking.reschedules < 1) {
      setRescheduling(true);
    }
  }, [startReschedule, booking]);

  React.useEffect(() => {
    const loadReviewData = async () => {
      if (!booking?.id) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [reviewRes, serviceReviewsRes] = await Promise.all([
        user
          ? supabase
              .from('reviews')
              .select('*')
              .eq('booking_id', booking.id)
              .eq('user_id', user.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null } as any),
        supabase.from('reviews').select('rating').eq('service', booking.service),
      ]);

      if (reviewRes?.data) {
        setExistingReview(reviewRes.data);
        setReviewRating(reviewRes.data.rating);
        setReviewComment(reviewRes.data.comment || '');
      } else {
        setExistingReview(null);
        setReviewRating(0);
        setReviewComment('');
      }

      if (serviceReviewsRes.data?.length) {
        const average = serviceReviewsRes.data.reduce((sum: number, review: any) => sum + review.rating, 0) / serviceReviewsRes.data.length;
        setServiceAverageRating(average);
      } else {
        setServiceAverageRating(0);
      }

      const verificationUrl = buildVerificationUrl({ booking: String(booking.id), type: 'booking' });
      if (verificationUrl) {
        setBookingQrUrl(await generateQrDataUrl(verificationUrl));
      }
    };

    loadReviewData();
  }, [booking?.id, booking?.service]);

  const handleSubmitReview = async () => {
    if (!booking?.id || reviewRating < 1) {
      showAlertDialog('Please select a rating before submitting your review.');
      return;
    }

    setSavingReview(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showAlertDialog('You need to be logged in to submit a review.');
        return;
      }

      const { data, error } = await supabase
        .from('reviews')
        .upsert([
          {
            booking_id: booking.id,
            user_id: user.id,
            service: booking.service,
            rating: reviewRating,
            comment: reviewComment.trim(),
          },
        ], { onConflict: 'booking_id' })
        .select()
        .single();

      if (error) {
        console.error('Error saving review:', error);
        showAlertDialog('Failed to save review. Please try again.');
        return;
      }

      setExistingReview(data);
      const { data: serviceReviews } = await supabase.from('reviews').select('rating').eq('service', booking.service);
      if (serviceReviews?.length) {
        setServiceAverageRating(serviceReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / serviceReviews.length);
      }
      showAlertDialog(existingReview ? 'Review updated successfully.' : 'Thank you for your review!', 'Review saved');
    } finally {
      setSavingReview(false);
    }
  };

  const handleDateSelect = (dateStr: string) => {
    setTempDate(dateStr);
    setTempTime(''); // reset time when date changes
  };

  const handleSaveReschedule = async () => {
    if (!tempDate || !tempTime) {
      showAlertDialog('Please select both a date and time');
      return;
    }

    // Final fresh DB check right before saving to catch race conditions
    const { data: latestBookings, error } = await supabase
      .from('bookings')
      .select('date, time, status, id')
      .eq('status', 'Confirmed')
      .neq('id', booking.id);

    if (error) {
      console.error('Error during final availability check:', error);
      showAlertDialog('Something went wrong. Please try again.');
      return;
    }

    const isSlotTaken = latestBookings?.some(b => b.date === tempDate && b.time === tempTime);

    if (isSlotTaken) {
      showAlertDialog('This date and time slot is already booked. Please select a different time.', 'Slot unavailable');
      // Refresh booked slots so UI reflects latest data
      await fetchBookedSlots();
      setTempTime('');
      return;
    }

    // Save to DB
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ date: tempDate, time: tempTime, reschedules: booking.reschedules + 1 })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      showAlertDialog('Failed to save reschedule. Please try again.');
      return;
    }

    // Update local state
    setBookings(prev =>
      prev.map(b =>
        b.id === booking.id
          ? { ...b, date: tempDate, time: tempTime, reschedules: (b.reschedules || 0) + 1 }
          : b
      )
    );

    setRescheduling(false);
    onNavigate('bookings');
  };

  const handleCancel = async () => {
    showConfirmDialog('Are you sure you want to cancel this booking?', async () => {
      setBookings(prev => prev.filter(b => b.id !== booking.id));
      onNavigate('bookings');
      const { error } = await supabase.from('bookings').delete().eq('id', booking.id);
      if (error) {
        console.error('Error deleting booking:', error);
      }
    }, 'Cancel booking');
  };

  const handleStartReschedule = () => {
    if (booking.reschedules >= 1) return;
    setRescheduling(true);
  };

  const downloadBookingPDF = async () => {
    const pdf = new jsPDF();
    const bookingVerifyUrl = buildVerificationUrl({ booking: String(booking.id), type: 'booking' });
    const bookingQrDataUrl = bookingVerifyUrl ? await generateQrDataUrl(bookingVerifyUrl) : '';
    
    // Create a temporary div for PDF content
    const pdfContent = document.createElement('div');
    pdfContent.style.width = '210mm';
    pdfContent.style.padding = '20mm';
    pdfContent.style.fontFamily = 'Arial, sans-serif';
    pdfContent.style.backgroundColor = '#ffffff';
    pdfContent.style.position = 'absolute';
    pdfContent.style.left = '-9999px';
    pdfContent.style.top = '-9999px';
    pdfContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
        <img src="${SlickTechLogo.src}" alt="SlickTech Logo" style="height: 200px; margin-bottom: 15px;" />
        <h1 style="color: #1e293b; font-size: 28px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 2px;">SLICKTECH</h1>
        <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Professional Tech Solutions</p>
      </div>
      
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="color: #1e293b; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Booking Confirmation</h2>
        <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Booking ID: ${booking.id}</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h3 style="color: #1e293b; font-size: 16px; font-weight: bold; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">Service Details</h3>
          <div style="margin-bottom: 10px;">
            <strong style="color: #374151; font-size: 14px;">Service:</strong>
            <span style="color: #1e293b; font-size: 14px; margin-left: 8px;">${booking.service}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #374151; font-size: 14px;">Price:</strong>
            <span style="color: #2563eb; font-size: 16px; font-weight: bold; margin-left: 8px;">${booking.price}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #374151; font-size: 14px;">Status:</strong>
            <span style="color: ${booking.status === 'Confirmed' ? '#059669' : '#d97706'}; font-size: 14px; font-weight: bold; margin-left: 8px;">${booking.status}</span>
          </div>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h3 style="color: #1e293b; font-size: 16px; font-weight: bold; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">Schedule Information</h3>
          <div style="margin-bottom: 10px;">
            <strong style="color: #374151; font-size: 14px;">📅 Date:</strong>
            <span style="color: #1e293b; font-size: 14px; margin-left: 8px;">${booking.date}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #374151; font-size: 14px;">🕐 Time:</strong>
            <span style="color: #1e293b; font-size: 14px; margin-left: 8px;">${booking.time}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <strong style="color: #374151; font-size: 14px;">📍 Location:</strong>
            <span style="color: #1e293b; font-size: 14px; margin-left: 8px;">${booking.location}</span>
          </div>
        </div>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
        <h3 style="color: #1e293b; font-size: 16px; font-weight: bold; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">Service Description</h3>
        <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">${booking.description}</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
        <h3 style="color: #1e293b; font-size: 16px; font-weight: bold; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px;">Additional Information</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <strong style="color: #374151; font-size: 14px;">Reschedules Used:</strong>
            <span style="color: #1e293b; font-size: 14px; margin-left: 8px;">${booking.reschedules || 0}/1</span>
          </div>
          <div>
            <strong style="color: #374151; font-size: 14px;">Booking Date:</strong>
            <span style="color: #1e293b; font-size: 14px; margin-left: 8px;">${new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div style="background: #eff6ff; padding: 20px; border-radius: 12px; border: 1px solid #bfdbfe; margin-bottom: 30px; display: flex; align-items: center; justify-content: space-between; gap: 20px;">
        <div>
          <h3 style="color: #1d4ed8; font-size: 16px; font-weight: bold; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Booking verification</h3>
          <p style="color: #334155; font-size: 13px; margin: 0; line-height: 1.6;">Scan the QR code to verify this booking online.</p>
          <p style="color: #64748b; font-size: 12px; margin: 10px 0 0 0;">Reference: BOOK-${booking.id}</p>
        </div>
        ${bookingQrDataUrl ? `<img src="${bookingQrDataUrl}" alt="Booking QR" style="width: 110px; height: 110px; border-radius: 10px; background: white; padding: 8px;" />` : ''}
      </div>
      
      <div style="text-align: center; border-top: 2px solid #e2e8f0; padding-top: 30px; margin-top: 40px;">
        <p style="color: #64748b; font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Thank you for choosing SlickTech</p>
        <p style="color: #64748b; font-size: 10px; margin: 5px 0 0 0;">For any questions, please contact our support team</p>
        <p style="color: #64748b; font-size: 10px; margin: 5px 0 0 0;">© 2026 SlickTech Technologies | All rights reserved</p>
      </div>
    `;
    
    document.body.appendChild(pdfContent);
    
    try {
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123 // A4 height in pixels at 96 DPI
      });
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297); // A4 dimensions in mm
      
      pdf.save(`SlickTech_Booking_${booking.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlertDialog('Failed to generate PDF. Please try again.', 'PDF error');
    } finally {
      document.body.removeChild(pdfContent);
    }
  };

  const downloadCompletionCertificate = async () => {
    const pdf = new jsPDF('landscape');
    const certificateId = buildCertificateId(booking.id);
    const verificationUrl = buildVerificationUrl({ cert: certificateId, type: 'certificate' });
    const certificateQrDataUrl = verificationUrl ? await generateQrDataUrl(verificationUrl) : '';

    const certificateContent = document.createElement('div');
    certificateContent.style.width = '297mm';
    certificateContent.style.height = '210mm';
    certificateContent.style.padding = '20mm';
    certificateContent.style.fontFamily = 'Times New Roman, serif';
    certificateContent.style.backgroundColor = '#ffffff';
    certificateContent.style.position = 'absolute';
    certificateContent.style.left = '-9999px';
    certificateContent.style.top = '-9999px';

    const certificateHTML = `
<div style="
width:100%;
height:100%;
background:#f7f7f5;
padding:60px;
font-family: 'Times New Roman', serif;
border:6px solid #c9a227;
border-radius:12px;
position:relative;
display:flex;
flex-direction:column;
justify-content:center;
align-items:center;
text-align:center;
">

<!-- Gold Corner Decoration -->
<div style="
position:absolute;
top:0;
right:0;
width:300px;
height:300px;
background:linear-gradient(135deg,#000,#c9a227);
border-bottom-left-radius:300px;
opacity:0.9;
"></div>

<div style="
position:absolute;
bottom:0;
left:0;
width:300px;
height:300px;
background:linear-gradient(135deg,#c9a227,#000);
border-top-right-radius:300px;
opacity:0.9;
"></div>

<!-- Logo -->
<img src="${SlickTechLogo.src}" style="height:230px;margin-bottom:15px;z-index:2"/>

<!-- Title -->
<h1 style="
font-size:46px;
letter-spacing:8px;
margin:0;
color:#333;
z-index:2;
">
CERTIFICATE
</h1>

<p style="
font-size:18px;
letter-spacing:4px;
margin-top:5px;
color:#666;
z-index:2;
">
OF COMPLETION
</p>

<!-- Description -->
<p style="
margin-top:40px;
font-size:22px;
color:#555;
z-index:2;
">
This certificate is proudly presented to
</p>

<!-- Name -->
<h2 style="
font-size:48px;
color:#c9a227;
margin:20px 0;
font-weight:500;
font-family:'Brush Script MT',cursive;
z-index:2;
">
${booking.user_name || 'Valued Client'}
</h2>

<!-- Line -->
<div style="
width:500px;
height:2px;
background:#444;
margin-bottom:30px;
z-index:2;
"></div>

<!-- Service -->
<p style="
font-size:20px;
max-width:800px;
line-height:1.6;
color:#444;
z-index:2;
">
For successfully completing the service

<strong>${booking.service}</strong>

with SlickTech Solutions on

${new Date().toLocaleDateString('en-US',{
year:'numeric',
month:'long',
day:'numeric'
})}
</p>

<!-- Signature -->
<div style="
display:flex;
justify-content:space-between;
width:70%;
margin-top:80px;
z-index:2;
">

<div style="text-align:center">
<div style="border-bottom:2px solid #333;width:220px;margin-bottom:8px"></div>
<p style="margin:0;font-weight:bold">Authorized Signature</p>
<p style="margin:0;color:#666">SlickTech Solutions</p>
</div>

<div style="text-align:center">
<div style="border-bottom:2px solid #333;width:220px;margin-bottom:8px"></div>
<p style="margin:0;font-weight:bold">Date Issued</p>
<p style="margin:0;color:#666">
${new Date().toLocaleDateString()}
</p>
</div>

</div>

<!-- Certificate ID -->
<p style="
position:absolute;
bottom:20px;
font-size:14px;
color:#777;
">
Certificate ID: ${certificateId}
</p>

${certificateQrDataUrl ? `<div style="position:absolute;top:24px;left:24px;background:white;padding:10px;border-radius:16px;z-index:3;box-shadow:0 8px 24px rgba(0,0,0,0.1);">
<img src="${certificateQrDataUrl}" style="width:120px;height:120px;display:block" />
<p style="margin:8px 0 0;font-size:12px;color:#444;text-align:center;">Verify online</p>
</div>` : ''}

</div>
`;

    certificateContent.innerHTML = certificateHTML;
    document.body.appendChild(certificateContent);

    try {
      const images = Array.from(certificateContent.querySelectorAll('img')) as HTMLImageElement[];
      const imagePromises = images.map((img) => new Promise<void>((resolve, reject) => {
        if (img.complete) {
          resolve();
          return;
        }
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image failed to load'));
      }));

      await Promise.all(imagePromises);

      const canvas = await html2canvas(certificateContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1123,
        height: 794
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      pdf.save(`SlickTech_Completion_Certificate_${booking.id}.pdf`);
    } catch (error) {
      console.error('Error generating certificate:', error);
      showAlertDialog('Failed to generate certificate. Please try again.', 'Certificate error');
    } finally {
      document.body.removeChild(certificateContent);
    }
  };

  // const downloadCompletionCertificate = async () => {
  //   const pdf = new jsPDF();
    
  //   // Create a temporary div for certificate content
  //   const certificateContent = document.createElement('div');
  //   certificateContent.style.width = '210mm';
  //   certificateContent.style.height = '297mm';
  //   certificateContent.style.padding = '20mm';
  //   certificateContent.style.fontFamily = 'Arial, sans-serif';
  //   certificateContent.style.backgroundColor = '#ffffff';
  //   certificateContent.style.position = 'absolute';
  //   certificateContent.style.left = '-9999px';
  //   certificateContent.style.top = '-9999px';
  //   certificateContent.innerHTML = `
  //     <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; border: 8px solid #1e40af; border-radius: 20px; padding: 40px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">
        
  //       <!-- Header with Logo -->
  //       <div style="margin-bottom: 30px;">
  //         <img src="${SlickTechLogo.src}" alt="SlickTech Logo" style="height: 80px; margin-bottom: 20px;" />
  //         <h1 style="color: #1e293b; font-size: 36px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 3px;">SLICKTECH</h1>
  //         <p style="color: #64748b; font-size: 16px; margin: 5px 0 0 0; font-style: italic;">Professional Tech Solutions</p>
  //       </div>
        
  //       <!-- Certificate Title -->
  //       <div style="margin-bottom: 40px;">
  //         <h2 style="color: #1e293b; font-size: 28px; font-weight: bold; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">Certificate of Completion</h2>
  //         <div style="width: 200px; height: 3px; background: linear-gradient(90deg, #3b82f6, #1d4ed8); margin: 0 auto;"></div>
  //       </div>
        
  //       <!-- Main Content -->
  //       <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; margin-bottom: 40px;">
  //         <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">This is to certify that</p>
          
  //         <h3 style="color: #1e293b; font-size: 32px; font-weight: bold; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1px;">${booking.user_name || 'Valued Customer'}</h3>
          
  //         <p style="color: #374151; font-size: 18px; margin: 0 0 30px 0; line-height: 1.6;">
  //           has successfully completed their technology consultation and solution implementation with <strong>SlickTech Solutions</strong>.
  //         </p>
          
  //         <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 15px; border: 2px solid #3b82f6; margin: 30px 0;">
  //           <h4 style="color: #1e40af; font-size: 20px; font-weight: bold; margin: 0 0 15px 0;">Service Completed:</h4>
  //           <p style="color: #1e293b; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">${booking.service}</p>
  //           <p style="color: #374151; font-size: 16px; margin: 0;">Completed on: ${new Date().toLocaleDateString('en-US', { 
  //             year: 'numeric', 
  //             month: 'long', 
  //             day: 'numeric' 
  //           })}</p>
  //         </div>
          
  //         <p style="color: #1e293b; font-size: 20px; font-weight: bold; margin: 30px 0; line-height: 1.6;">
  //           🎉 <span style="color: #059669;">You are currently secured and protected by SlickTech Solutions!</span> 🎉
  //         </p>
          
  //         <p style="color: #374151; font-size: 16px; margin: 20px 0; line-height: 1.6;">
  //           This certificate confirms that all recommended solutions have been successfully implemented and your systems are now optimized for peak performance and security.
  //         </p>
  //       </div>
        
  //       <!-- Footer -->
  //       <div style="margin-top: 40px; width: 100%;">
  //       <div style="display: flex; justify-content: space-between; align-items: flex-end;">
  //         <div style="text-align: left;">
  //           <p style="color: #64748b; font-size: 12px; margin: 0;">Certificate ID: STC-${booking.id}-${Date.now()}</p>
  //           <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0;">Issued: ${new Date().toLocaleDateString()}</p>
  //         </div>
  //         <div style="text-align: right;">
  //           <div style="width: 150px; height: 60px; border-bottom: 2px solid #1e293b; margin-bottom: 5px;"></div>
  //           <p style="color: #374151; font-size: 12px; margin: 0; font-weight: bold;">Authorized Signature</p>
  //           <p style="color: #64748b; font-size: 10px; margin: 2px 0 0 0;">SlickTech Solutions</p>
  //         </div>
  //       </div>
  //     </div>
        
  //       <!-- Bottom Border -->
  //       <div style="position: absolute; bottom: 20px; left: 20px; right: 20px; text-align: center;">
  //         <p style="color: #64748b; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">© 2026 SlickTech Technologies | All rights reserved</p>
  //       </div>
  //     </div>
  //   `;
    
  //   document.body.appendChild(certificateContent);
    
  //   try {
  //     const canvas = await html2canvas(certificateContent, {
  //       scale: 2,
  //       useCORS: true,
  //       allowTaint: true,
  //       backgroundColor: '#ffffff',
  //       width: 794,
  //       height: 1123
  //     });
      
  //     const imgData = canvas.toDataURL('image/png');
  //     pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      
  //     pdf.save(`SlickTech_Completion_Certificate_${booking.id}.pdf`);
  //   } catch (error) {
  //     console.error('Error generating certificate:', error);
  //     // handle certificate generation error here.
  //   } finally {
  //     document.body.removeChild(certificateContent);
  //   }
  // };

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No booking selected.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Navigation Skeleton */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="px-4 md:px-8 py-8 max-w-2xl mx-auto">
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse mb-6"></div>

          <div className="bg-white rounded-[2.5rem] border-2 border-gray-200 shadow-sm p-8 md:p-12">
            <div className="w-64 h-8 bg-gray-200 rounded animate-pulse mb-8"></div>

            <div className="space-y-4 mb-8 pb-8 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-28 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="w-18 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="w-14 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-full h-20 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="flex justify-between mt-8">
              <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-28 h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Footer Skeleton */}
        <footer className="bg-gray-200 px-4 md:px-8 py-8 mt-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-5 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-48 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div>
              <div className="w-20 h-5 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-2">
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-14 h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-18 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            <div>
              <div className="w-24 h-5 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-2">
                <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-28 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            <div>
              <div className="w-20 h-5 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="flex space-x-4">
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-4 flex flex-col md:flex-row items-center justify-between">
            <div className="w-48 h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-56 h-3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar currentPage="bookings" onNavigate={onNavigate} onLogout={onLogout} />

      <div className="px-4 md:px-8 py-8 max-w-2xl mx-auto">
        <button
          onClick={() => onNavigate('bookings')}
          className="text-blue-600 hover:text-blue-800 font-semibold mb-6 flex items-center space-x-2 transition-colors"
        >
          <FaChevronLeft />
          <span>Back to bookings</span>
        </button>

        <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">Booking Details</h1>

          <div className="space-y-4 mb-8 pb-8 border-b border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Service</p>
                <p className="text-lg font-bold text-slate-900">{booking.service}</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                <p className={`text-lg font-bold ${booking.status === 'Confirmed' ? 'text-emerald-600' : 'text-orange-600'}`}>{booking.status}</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</p>
                <p className="text-lg font-bold text-slate-900 flex items-center gap-2"><FaCalendarAlt className="text-blue-600" /> {booking.date}</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Time</p>
                <p className="text-lg font-bold text-slate-900 flex items-center gap-2"><FaClock className="text-blue-600" /> {booking.time}</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Location</p>
                <p className="text-lg font-bold text-slate-900 flex items-center gap-2"><FaMapMarkerAlt className="text-blue-600" /> {booking.location}</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Price</p>
                <p className="text-lg font-bold text-blue-600">{booking.price}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
              <p className="text-slate-700 leading-relaxed">{booking.description}</p>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Reschedules Used</p>
              <p className="text-lg font-bold text-slate-900">{booking.reschedules || 0}/1</p>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Service Rating</p>
              <p className="text-lg font-bold text-slate-900">{serviceAverageRating ? `${serviceAverageRating.toFixed(1)} ★` : 'Not rated yet'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadBookingPDF}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-1.5 px-3 rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
            >
              <FaDownload className="text-lg" />
              Download PDF
            </button>
            <button
              onClick={() => downloadInvoicePDF(booking)}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-1.5 px-3 rounded-xl transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
            >
              <FaDownload className="text-lg" />
              Invoice
            </button>
            {booking.status === 'Complete' && (
              <button
                onClick={downloadCompletionCertificate}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-black py-1.5 px-3 rounded-xl transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
              >
                <FaDownload className="text-lg" />
                Download Certificate
              </button>
            )}
            <button
              onClick={handleStartReschedule}
              disabled={booking.reschedules >= 1}
              className={`flex-1 py-1.5 px-3 font-black rounded-xl transition-all ${booking.reschedules >= 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'}`}
            >
              Reschedule
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-1.5 px-3 rounded-xl transition-all shadow-lg shadow-red-200"
            >
              Cancel
            </button>
          </div>

          {bookingQrUrl && (
            <div className="mt-8 rounded-[2rem] border border-blue-200 bg-blue-50 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">QR Booking Confirmation</p>
                <h3 className="text-xl font-black text-slate-900">Booking reference BOOK-{booking.id}</h3>
                <p className="text-sm text-slate-600 mt-2">Scan this code to open the public verification page for this booking.</p>
                {(booking.status === 'Confirmed' || booking.status === 'Complete') && (
                  <p className="text-sm text-slate-600 mt-2">Certificate ID: <span className="font-bold text-slate-900">{buildCertificateId(booking.id)}</span></p>
                )}
              </div>
              <img src={bookingQrUrl} alt="Booking verification QR" className="w-32 h-32 rounded-2xl border border-blue-200 bg-white p-2" />
            </div>
          )}

          {booking.status === 'Complete' && (
            <div className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Reviews & Ratings</p>
                  <h3 className="text-xl font-black text-slate-900">Rate your completed service</h3>
                </div>
                {existingReview && (
                  <span className="text-xs font-black px-3 py-2 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-widest">
                    Review submitted
                  </span>
                )}
              </div>

              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={`text-2xl transition-transform ${star <= reviewRating ? 'text-yellow-500 scale-105' : 'text-slate-300 hover:text-yellow-400'}`}
                    title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>

              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                placeholder="Tell us about your experience with SlickTech..."
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                <p className="text-sm text-slate-500">Your review helps improve service quality and updates admin analytics.</p>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={savingReview || reviewRating < 1}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 px-5 py-3 text-white font-black transition-all"
                >
                  {savingReview ? 'Saving review…' : existingReview ? 'Update Review' : 'Submit Review'}
                </button>
              </div>
            </div>
          )}

          {rescheduling && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="font-black text-lg text-slate-900 mb-6">Pick New Date & Time</h3>

              {loadingSlots ? (
                <p className="text-sm text-slate-400 font-medium animate-pulse">Loading availability from database...</p>
              ) : (
                <>
                  {/* Calendar picker */}
                  <div className="mb-6">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Date</label>
                    <div className="bg-white rounded-2xl p-4 border-2 border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={handlePreviousMonth} className="text-slate-600 hover:text-slate-900 font-bold">
                          <FaChevronLeft />
                        </button>
                        <span className="text-sm font-black text-slate-900">{monthNames[displayMonth]} {displayYear}</span>
                        <button type="button" onClick={handleNextMonth} className="text-slate-600 hover:text-slate-900 font-bold">
                          <FaChevronRight />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-2 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-xs font-black text-slate-500">{day}</div>
                        ))}
                        {Array.from({ length: getFirstDayOfMonth(displayMonth, displayYear) }).map((_, i) => (
                          <div key={`empty-${i}`} className="text-center text-sm py-2" />
                        ))}
                        {Array.from({ length: getDaysInMonth(displayMonth, displayYear) }).map((_, i) => {
                          const dateStr = `${monthNames[displayMonth]} ${i + 1}, ${displayYear}`;
                          const isoDate = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                          const isPassed = isDatePassed(displayMonth, i + 1, displayYear);
                          const isFullyBooked = isDateFullyBooked(displayMonth, i + 1, displayYear);
                          const isBlocked = blockedDates.has(isoDate);
                          const isDisabled = isPassed || isFullyBooked || isBlocked;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => !isDisabled && handleDateSelect(dateStr)}
                              disabled={isDisabled}
                              className={`text-center text-sm py-2 rounded font-bold transition-all ${
                                tempDate === dateStr
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                  : isBlocked
                                  ? 'bg-red-100 text-red-400 cursor-not-allowed line-through'
                                  : isDisabled
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-slate-50 text-slate-900 hover:bg-blue-100'
                              }`}
                              title={isBlocked ? 'Unavailable — this date is blocked' : isFullyBooked ? 'All slots on this day are booked' : isPassed ? 'Date has passed' : ''}
                            >
                              {i + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Time picker - only shown after date is selected */}
                  <div className="mb-6">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Time</label>
                    {!tempDate ? (
                      <p className="text-sm text-slate-400 font-medium">Please select a date first.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {ALL_TIME_SLOTS.map(time => {
                            const isBooked = isTimeSlotBooked(time);
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => !isBooked && setTempTime(time)}
                                disabled={isBooked}
                                className={`py-3 px-4 rounded-xl font-bold transition-all ${
                                  tempTime === time
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : isBooked
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                                    : 'bg-slate-50 text-slate-900 hover:bg-blue-100 border border-slate-200'
                                }`}
                                title={isBooked ? 'This time slot is already booked' : ''}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-slate-500 mt-3 font-medium">
                          Selected date: <span className="font-bold text-slate-900">{tempDate}</span>
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Action buttons */}
              <div className="flex gap-4 pt-6 border-t border-slate-200">
                <button
                  onClick={handleSaveReschedule}
                  disabled={loadingSlots}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-200"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => { setRescheduling(false); setTempDate(''); setTempTime(''); }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-black py-3 px-6 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AppAlertDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        variant={dialog.variant}
        onConfirm={() => {
          const run = dialog.onConfirm;
          setDialog((prev) => ({ ...prev, isOpen: false }));
          if (run) {
            void run();
          }
        }}
        onCancel={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
        confirmLabel={dialog.variant === 'confirm' ? 'Yes, continue' : 'OK'}
      />
    </div>
  );
};

export default BookingDetails;
