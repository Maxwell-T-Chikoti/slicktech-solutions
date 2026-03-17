"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import AppAlertDialog from '@/app/components/AppAlertDialog';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import supabase from '@/app/lib/supabaseClient';

interface NewBookingScreenProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  selectedService?: string;
}

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

type SuggestedSlot = {
  date: string;
  time: string;
  reason: string;
  cancellationRisk: number;
};

type ServiceItem = {
  title: string;
  price: string;
  description?: string;
  features?: string[];
};

type ServiceExplainResult = {
  plainExplanation: string;
  whatToExpect: string[];
  prepChecklist: string[];
};

const formatPriceCAD = (rawPrice: string) => {
  const numeric = parseFloat(String(rawPrice || '').replace(/[^0-9.]/g, ''));
  if (Number.isNaN(numeric)) return rawPrice || '';
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(numeric);
};

const NewBookingScreen = ({ onNavigate, onLogout, selectedService }: NewBookingScreenProps) => {
  const [bookingData, setBookingData] = useState({
    service: selectedService || '',
    price: '',
    date: '',
    time: '9:00 AM',
    extraServices: '',
    description: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [suggestedSlot, setSuggestedSlot] = useState<SuggestedSlot | null>(null);
  const [backupSlots, setBackupSlots] = useState<SuggestedSlot[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isExplainingService, setIsExplainingService] = useState(false);
  const [serviceExplainResult, setServiceExplainResult] = useState<ServiceExplainResult | null>(null);
  const [uiNotice, setUiNotice] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });
  
  // Date picker state
  const [currentDate] = useState(new Date());
  const [displayMonth, setDisplayMonth] = useState(currentDate.getMonth());
  const [displayYear, setDisplayYear] = useState(currentDate.getFullYear());

  // fetch services from database
  React.useEffect(() => {
    const fetch = async () => {
      const [svcRes, bdRes] = await Promise.all([
        supabase.from('services').select('title, price, description, features').order('id'),
        supabase.from('blocked_dates').select('date'),
      ]);
      if (svcRes.data) {
        setServices(
          svcRes.data.map((s: any) => ({
            title: s.title,
            price: s.price || '',
            description: s.description || '',
            features: Array.isArray(s.features) ? s.features : [],
          }))
        );
      } else if (svcRes.error) {
        console.error('Error fetching services:', svcRes.error);
      }
      if (bdRes.data) {
        setBlockedDates(new Set(bdRes.data.map((r: any) => r.date)));
      }
      setLoadingServices(false);
      // Show loading animation for at least 1 second
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };
    fetch();
  }, []);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'service') {
      const matched = services.find(s => s.title === value);
      setServiceExplainResult(null);
      setBookingData({
        ...bookingData,
        service: value,
        price: matched?.price ? formatPriceCAD(matched.price) : ''
      });
    } else {
      setBookingData({
        ...bookingData,
        [name]: value
      });
    }
  };

  const handleDateChange = (date: string) => {
    setBookingData({
      ...bookingData,
      date: date
    });
  };

  const handlePreviousMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  const isDatePassed = (month: number, day: number, year: number) => {
    const selectedDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  const parseBookingDate = (rawDate: string) => {
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    return null;
  };

  const toDisplayDate = (dateObj: Date) => {
    return `${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
  };

  const toIsoDate = (dateObj: Date) => {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  };

  const handleGenerateAISuggestion = async () => {
    const showNotice = (message: string, title = 'Notice') => {
      setUiNotice({ isOpen: true, title, message });
    };

    if (!bookingData.service) {
      showNotice('Please select a service first so we can generate a smart schedule suggestion.');
      return;
    }

    setIsSuggesting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('date, time, service, user_id, status, reschedules')
        .in('status', ['Pending', 'Confirmed', 'Complete']);

      const allBookings = Array.isArray(bookingsData) ? bookingsData : [];
      const normalizedBookings = allBookings
        .map((booking: any) => {
          const parsedDate = parseBookingDate(booking.date);
          return {
            ...booking,
            parsedDate,
          };
        })
        .filter((booking: any) => booking.parsedDate);

      const serviceBookings = normalizedBookings.filter((b: any) => b.service === bookingData.service);
      const userServiceBookings = serviceBookings.filter((b: any) => user && b.user_id === user.id);

      const userPreferredSlots = new Set(userServiceBookings.map((b: any) => b.time));

      try {
        const aiPayload = {
          service: bookingData.service,
          today: new Date().toISOString(),
          availableTimeSlots: TIME_SLOTS,
          blockedDates: Array.from(blockedDates.values()),
          userPreferredSlots: Array.from(userPreferredSlots.values()),
          serviceBookings: serviceBookings
            .slice(-300)
            .map((b: any) => ({
              date: toDisplayDate(b.parsedDate),
              isoDate: toIsoDate(b.parsedDate),
              time: b.time,
              status: b.status,
              reschedules: Number(b.reschedules || 0),
            })),
        };

        const aiResponse = await fetch('/api/ai-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'scheduling',
            payload: aiPayload,
          }),
        });

        if (!aiResponse.ok) {
          throw new Error('AI scheduling endpoint is unavailable.');
        }

        const aiJson = await aiResponse.json();
        const aiResult = aiJson?.result;

        const normalizeSlot = (slot: any): SuggestedSlot | null => {
          if (!slot || typeof slot !== 'object') return null;
          if (!slot.date || !slot.time) return null;
          const risk = Math.min(100, Math.max(0, Number(slot.cancellationRisk ?? 20)));
          return {
            date: String(slot.date),
            time: String(slot.time),
            reason: String(slot.reason || 'AI-recommended slot based on demand and history.'),
            cancellationRisk: Math.round(risk),
          };
        };

        const primary = normalizeSlot(aiResult?.primary);
        const backups = Array.isArray(aiResult?.backups)
          ? aiResult.backups.map(normalizeSlot).filter((slot: SuggestedSlot | null) => !!slot) as SuggestedSlot[]
          : [];

        if (primary) {
          setSuggestedSlot(primary);
          setBackupSlots(backups.slice(0, 2));
          return;
        }

        setSuggestedSlot(null);
        setBackupSlots([]);
        showNotice('AI responded but did not return a valid suggestion.');
        return;
      } catch (aiError) {
        console.warn('AI model scheduling suggestion failed:', aiError);
        setSuggestedSlot(null);
        setBackupSlots([]);
        showNotice('AI scheduling is unavailable right now. Fallback is disabled for testing.');
        return;
      }
    } catch (error) {
      console.error('Error generating AI schedule suggestion:', error);
      showNotice('Unable to generate a suggestion right now. Please try again.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const applySuggestedSlot = (slot: SuggestedSlot) => {
    if (!slot) return;
    setBookingData((prev) => ({
      ...prev,
      date: slot.date,
      time: slot.time,
    }));
  };

  const handleExplainService = async () => {
    if (!bookingData.service) {
      setUiNotice({ isOpen: true, title: 'Notice', message: 'Please select a service first.' });
      return;
    }

    const selected = services.find((s) => s.title === bookingData.service);
    setIsExplainingService(true);
    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'service-explain',
          payload: {
            service: bookingData.service,
            serviceDescription: selected?.description || '',
            serviceFeatures: selected?.features || [],
            userIssue: bookingData.description || '',
            extraServices: bookingData.extraServices || '',
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Service explanation endpoint unavailable');
      }

      const json = await res.json();
      const result = json?.result;
      if (!result?.plainExplanation || !Array.isArray(result?.whatToExpect) || !Array.isArray(result?.prepChecklist)) {
        throw new Error('Invalid response shape');
      }

      setServiceExplainResult({
        plainExplanation: String(result.plainExplanation),
        whatToExpect: result.whatToExpect.map((item: any) => String(item)).slice(0, 4),
        prepChecklist: result.prepChecklist.map((item: any) => String(item)).slice(0, 6),
      });
    } catch (error) {
      console.warn('Service explanation fallback used:', error);
      setServiceExplainResult({
        plainExplanation: `The ${bookingData.service} service helps identify and fix your issue with guided diagnosis and professional support tailored to your setup.`,
        whatToExpect: [
          'A quick initial assessment of your reported issue.',
          'Hands-on troubleshooting and fix recommendations.',
          'A summary of what was done and suggested next steps.',
        ],
        prepChecklist: [
          'Keep your device charged and connected to the internet.',
          'Write down the error message or behavior you are seeing.',
          'Have login credentials available if system access is needed.',
        ],
      });
    } finally {
      setIsExplainingService(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const showNotice = (message: string, title = 'Notice') => {
      setUiNotice({ isOpen: true, title, message });
    };

    if (!bookingData.service || !bookingData.date) {
      showNotice('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const insertObj: any = {
        service: bookingData.service,
        date: bookingData.date,
        time: bookingData.time,
        extra_services: bookingData.extraServices,
        description: bookingData.description,
        status: 'Pending',
        reschedules: 0,
        location: '',
        price: bookingData.price,
      };

      if (user) {
        insertObj.user_id = user.id;
      }

      const { data, error } = await supabase.from('bookings').insert([insertObj]);
      if (error) {
        console.error('Error inserting booking:', error);
        console.error('Error as JSON:', JSON.stringify(error, null, 2));
        console.error('error details:', error);
        showNotice('There was an error saving your booking. Please try again.');
      } else {
        console.log('Booking inserted:', data);
        const insertedBookingId = (data as any)?.[0]?.id || null;

        if (user && insertedBookingId) {
          await supabase.from('notifications').insert([
            {
              user_id: user.id,
              title: 'Booking received',
              message: `Your ${bookingData.service} booking for ${bookingData.date} at ${bookingData.time} has been created successfully.`,
              type: 'success',
              booking_id: insertedBookingId,
            },
          ]);
        }
        
        // Send confirmation email
        if (user) {
          try {
            await fetch('/api/send-booking-confirmation', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userEmail: user.email,
                userName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                service: bookingData.service,
                date: bookingData.date,
                time: bookingData.time,
                description: bookingData.description,
                extraServices: bookingData.extraServices,
                // Supabase insert returns an array of rows; cast to any to satisfy TypeScript
                bookingId: insertedBookingId || 'Pending',
              }),
            });
          } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Don't fail the booking if email fails
          }
        }
        
        setBookingConfirmed(true);
        // navigate to bookings page immediately so the new record is visible
        onNavigate('bookings');
      }
    } catch (err) {
      console.error('Unexpected error inserting booking:', err);
    }

    setIsLoading(false);
    setBookingConfirmed(true);
  };

  if (loadingServices) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="bookings" onNavigate={onNavigate} onLogout={onLogout} />
        
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-blue-700 rounded-full animate-spin"></div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing your booking...</h2>
            <p className="text-gray-600">Please wait while we confirm your appointment</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
        <div className="px-4 md:px-8 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-8"></div>

            {/* Form Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <div className="w-48 h-5 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="w-24 h-5 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <div className="w-40 h-5 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="w-36 h-5 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="w-full h-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Calendar Skeleton */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[...Array(35)].map((_, i) => (
                  <div key={i} className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Time Slots Skeleton */}
            <div className="mt-8">
              <div className="w-28 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Submit Button Skeleton */}
            <div className="mt-8 flex justify-end">
              <div className="w-32 h-12 bg-gray-200 rounded animate-pulse"></div>
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

  if (bookingConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="bookings" onNavigate={onNavigate} onLogout={onLogout} />
        
        <div className="px-4 md:px-8 py-8">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Booking Confirmed</h1>
            
            <p className="text-lg text-gray-700 mb-6">Your appointment has been successfully scheduled.</p>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded">
              <h3 className="font-bold text-slate-900 mb-4">Your Appointment Details:</h3>
              <div className="space-y-2 text-gray-700">
                <p><span className="font-semibold">Service:</span> {bookingData.service}</p>
                <p><span className="font-semibold">Date:</span> {bookingData.date}</p>
                <p><span className="font-semibold">Time:</span> {bookingData.time}</p>
                {bookingData.extraServices && (
                  <p><span className="font-semibold">Extra Services:</span> {bookingData.extraServices}</p>
                )}
              </div>
            </div>

            <div className="text-gray-700 space-y-4 mb-8">
              <p>A confirmation with your booking details has been sent to your email and phone.</p>
              
              <p>If you need to reschedule or cancel, you can manage your booking from your dashboard.<br />We look forward to seeing you.</p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="2" />
                  <path
                    d="M 35 50 L 45 60 L 70 35"
                    stroke="#10b981"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <button
              onClick={() => onNavigate('home')}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded transition-colors text-lg"
            >
              Go to dashboard
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-200 px-4 md:px-8 py-8 mt-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gray-400 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">S</span>
                </div>
                <span className="font-bold text-slate-800">SlickTech</span>
              </div>
              <p className="text-xs text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">COMPANY</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs text-gray-600 hover:text-slate-900">About Us</a></li>
                <li><a href="#" className="text-xs text-gray-600 hover:text-slate-900">Services</a></li>
                <li><a href="#" className="text-xs text-gray-600 hover:text-slate-900">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">CONTACT INFO</h4>
              <ul className="space-y-2">
                <li className="text-xs text-gray-600">Phone: (254)6578900</li>
                <li className="text-xs text-gray-600">Email: company@email.com</li>
                <li className="text-xs text-gray-600">Location: 901 Smart Street, BC</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">FOLLOW US</h4>
              <div className="flex space-x-4">
                <FaFacebook className="text-blue-600 cursor-pointer hover:scale-110 transition-transform" />
                <FaTwitter className="text-blue-400 cursor-pointer hover:scale-110 transition-transform" />
                <FaInstagram className="text-pink-600 cursor-pointer hover:scale-110 transition-transform" />
                <FaLinkedin className="text-blue-700 cursor-pointer hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
          <div className="border-t border-gray-300 pt-4 flex flex-col md:flex-row items-center justify-between text-xs text-gray-600">
            <p>© 2026 SlickTech Technologies | All rights reserved</p>
            <p>Created with love by SlickTech Technologies</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="bookings" onNavigate={onNavigate} onLogout={onLogout} />

      <div className="px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">New Booking</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Service and Extra Services */}
              <div className="space-y-6">
                {/* Select Service Required */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Service Required</label>
                  <select
                    name="service"
                    value={bookingData.service}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-full px-4 py-3 text-gray-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose a service...</option>
                    {services.map((service) => (
                      <option key={service.title} value={service.title}>
                        {service.title}{service.price ? ` — ${formatPriceCAD(service.price)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Options */}
                {bookingData.service && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm font-semibold text-slate-900 mb-3">Included Services:</p>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center">
                        <span className="text-blue-600 mr-2">✓</span> {bookingData.service}
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-gray-400 mr-2">✓</span> Quick consultation included
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-gray-400 mr-2">✓</span> Professional assessment
                      </li>
                    </ul>
                  </div>
                )}

                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-sm font-semibold text-indigo-900">Explain My Service</p>
                    <button
                      type="button"
                      onClick={handleExplainService}
                      disabled={isExplainingService}
                      className="px-3 py-2 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white"
                    >
                      {isExplainingService ? 'Explaining...' : 'Explain with AI'}
                    </button>
                  </div>
                  <p className="text-xs text-indigo-700">Get a plain-language explanation of this service based on your issue.</p>

                  {serviceExplainResult && (
                    <div className="mt-3 rounded-lg bg-white border border-indigo-100 p-3 space-y-3">
                      <p className="text-sm text-slate-700">{serviceExplainResult.plainExplanation}</p>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 mb-1">What to expect</p>
                        <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                          {serviceExplainResult.whatToExpect.map((item, idx) => (
                            <li key={`expect-${idx}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 mb-1">Prep checklist</p>
                        <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                          {serviceExplainResult.prepChecklist.map((item, idx) => (
                            <li key={`prep-${idx}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Extra Services Required */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Extra Services Required</label>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-3">
                    <p className="text-xs text-gray-600">Specify if there are any extra services that will be needed with your booking.</p>
                  </div>
                  <textarea
                    name="extraServices"
                    value={bookingData.extraServices}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Describe any additional services you may require..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Right Column - Date, Time, and Description */}
              <div className="space-y-6">
                {/* Date and Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Pick Appointment Date and Time</label>
                  <div className="bg-white rounded-lg p-4 border border-gray-300">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <p className="text-xs text-gray-600">Get a smart recommendation based on current availability and your booking patterns.</p>
                      <button
                        type="button"
                        onClick={handleGenerateAISuggestion}
                        disabled={isSuggesting}
                        className={`px-3 py-2 rounded text-xs font-semibold transition-colors ${
                          isSuggesting
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-700 hover:bg-blue-800 text-white'
                        }`}
                      >
                        {isSuggesting ? 'Analyzing...' : 'Get AI Suggestion'}
                      </button>
                    </div>

                    {suggestedSlot && (
                      <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3">
                        <p className="text-sm font-semibold text-emerald-800">Recommended: {suggestedSlot.date} at {suggestedSlot.time}</p>
                        <p className="text-xs text-emerald-700 mt-1">Why: {suggestedSlot.reason}</p>
                        <p className="text-xs text-emerald-700 mt-1">Predicted cancellation risk: {suggestedSlot.cancellationRisk}%</p>
                        <button
                          type="button"
                          onClick={() => applySuggestedSlot(suggestedSlot)}
                          className="mt-3 px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                        >
                          Apply suggestion
                        </button>

                        {backupSlots.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-emerald-200">
                            <p className="text-xs font-semibold text-emerald-800 mb-2">Backup slots (if this time becomes unavailable):</p>
                            <div className="flex flex-wrap gap-2">
                              {backupSlots.map((slot, index) => (
                                <button
                                  key={`${slot.date}-${slot.time}-${index}`}
                                  type="button"
                                  onClick={() => applySuggestedSlot(slot)}
                                  className="px-3 py-2 rounded border border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-100 text-xs font-semibold"
                                >
                                  {slot.date} • {slot.time}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Simple date picker */}
                    <div className="flex items-center justify-between mb-4">
                      <button type="button" onClick={handlePreviousMonth} className="text-gray-600 hover:text-slate-900">
                        <FaChevronLeft />
                      </button>
                      <span className="text-sm font-semibold text-slate-900">{monthNames[displayMonth]} {displayYear}</span>
                      <button type="button" onClick={handleNextMonth} className="text-gray-600 hover:text-slate-900">
                        <FaChevronRight />
                      </button>
                    </div>

                    {/* Simple calendar grid */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-xs font-semibold text-gray-600">
                          {day}
                        </div>
                      ))}
                      {Array.from({ length: getFirstDayOfMonth(displayMonth, displayYear) }).map((_, i) => (
                        <div key={`empty-${i}`} className="text-center text-sm py-2"></div>
                      ))}
                      {Array.from({ length: getDaysInMonth(displayMonth, displayYear) }).map((_, i) => {
                        const dateStr = `${monthNames[displayMonth]} ${i + 1}, ${displayYear}`;
                        const isPassed = isDatePassed(displayMonth, i + 1, displayYear);
                        // Convert to YYYY-MM-DD for blocked_dates comparison
                        const isoDate = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                        const isBlocked = blockedDates.has(isoDate);
                        const disabled = isPassed || isBlocked;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => !disabled && handleDateChange(dateStr)}
                            disabled={disabled}
                            title={isBlocked ? 'Unavailable — this date is blocked' : undefined}
                            className={`text-center text-sm py-2 rounded font-medium ${
                              bookingData.date === dateStr
                                ? 'bg-blue-700 text-white font-bold'
                                : isBlocked
                                ? 'bg-red-100 text-red-400 cursor-not-allowed line-through'
                                : disabled
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                : 'text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>

                    {/* Time Selection */}
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-2 block">Time</label>
                      <select
                        name="time"
                        value={bookingData.time}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500"
                      >
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description of Problem to be picked */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Description of Problem to be picked</label>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-3">
                    <p className="text-xs text-gray-600">Enter an objective... (To narrow forward configurations and server intricate logic.</p>
                  </div>
                  <textarea
                    name="description"
                    value={bookingData.description}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Describe the issue or problem you need help with..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-16 rounded transition-colors text-lg"
              >
                SUBMIT
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-200 px-4 md:px-8 py-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gray-400 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="font-bold text-slate-800">SlickTech</span>
            </div>
            <p className="text-xs text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">COMPANY</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-xs text-gray-600 hover:text-slate-900">About Us</a></li>
              <li><a href="#" className="text-xs text-gray-600 hover:text-slate-900">Services</a></li>
              <li><a href="#" className="text-xs text-gray-600 hover:text-slate-900">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">CONTACT INFO</h4>
            <ul className="space-y-2">
              <li className="text-xs text-gray-600">Phone: (254)6578900</li>
              <li className="text-xs text-gray-600">Email: company@email.com</li>
              <li className="text-xs text-gray-600">Location: 901 Smart Street, BC</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">FOLLOW US</h4>
            <div className="flex space-x-4">
              <FaFacebook className="text-blue-600 cursor-pointer hover:scale-110 transition-transform" />
              <FaTwitter className="text-blue-400 cursor-pointer hover:scale-110 transition-transform" />
              <FaInstagram className="text-pink-600 cursor-pointer hover:scale-110 transition-transform" />
              <FaLinkedin className="text-blue-700 cursor-pointer hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 pt-4 flex flex-col md:flex-row items-center justify-between text-xs text-gray-600">
          <p>© 2026 SlickTech Technologies | All rights reserved</p>
          <p>Created with love by SlickTech Technologies</p>
        </div>
      </footer>

      <AppAlertDialog
        isOpen={uiNotice.isOpen}
        title={uiNotice.title}
        message={uiNotice.message}
        onConfirm={() => setUiNotice((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default NewBookingScreen;
