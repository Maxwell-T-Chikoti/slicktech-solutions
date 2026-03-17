"use client";

import React, { useState, useEffect, useRef } from 'react';
import supabase from '@/app/lib/supabaseClient';
import AppAlertDialog from '@/app/components/AppAlertDialog';
import { FaCheck, FaTimes, FaEye, FaSync, FaChartBar, FaDownload, FaSearch, FaClock, FaUsers, FaSmile, FaArrowUp, FaFilePdf, FaBell, FaCheckSquare, FaSquare, FaTrash, FaUser, FaHistory, FaFilter, FaCalendar, FaCog, FaExclamationTriangle, FaMoon, FaSun, FaBars } from 'react-icons/fa';
import AnalyticsScreen from './analytics';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { downloadInvoicePDF } from '@/app/lib/pdfUtils';
import SlickTechLogo from '../Assets/SlickTech_Logo.png';
import { useTheme } from '../components/ThemeProvider';
import PhoneInputWithCountry from '@/app/components/PhoneInputWithCountry';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface BookingWithProfile {
  id: number;
  service: string;
  date: string;
  time: string;
  status: string;
  price: string;
  description: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  user_location?: string;
  assigned_staff_id?: string | null;
  staff_name?: string;
  staff_acknowledged_at?: string | null;
  staff_notes?: string | null;
  staff_completion_report?: string | null;
  staff_completed_at?: string | null;
  location?: string;
}

type StaffMember = {
  id: string;
  first_name: string;
  surname: string;
  email: string;
};

type ManagedStaffAccount = {
  id: string;
  first_name: string;
  surname: string;
  email: string;
  phone?: string;
  location?: string;
  isDisabled: boolean;
  bannedUntil?: string | null;
};

const AI_DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type DemandForecastRow = {
  day: string;
  bookings: number;
  probability: number;
  predictedLoad: 'Low' | 'Moderate' | 'High' | 'Full';
  suggestedStaff: string;
};

type DemandModelSummary = {
  busiestDay: string;
  lowDemandDay: string;
  note: string;
};

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const { theme, toggleTheme } = useTheme();
  const [bookings, setBookings] = useState<BookingWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithProfile | null>(null);
  const [viewAnalytics, setViewAnalytics] = useState<'bookings' | 'revenue' | 'busiest-days' | 'popular-services' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [showMobileTabs, setShowMobileTabs] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [newBookingAlert, setNewBookingAlert] = useState<BookingWithProfile | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'staff' | 'activity' | 'settings' | 'services'>('dashboard');
  const [customers, setCustomers] = useState<any[]>([]);
  const [managedStaff, setManagedStaff] = useState<ManagedStaffAccount[]>([]);
  const [loadingManagedStaff, setLoadingManagedStaff] = useState(false);
  const [staffActionInProgressId, setStaffActionInProgressId] = useState<string | null>(null);
  const [staffPasswordDrafts, setStaffPasswordDrafts] = useState<Record<string, string>>({});
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [staffToAssign, setStaffToAssign] = useState('');
  const [assigningStaff, setAssigningStaff] = useState(false);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    firstName: '',
    surname: '',
    email: '',
    password: '',
    phone: '',
    location: '',
  });
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    completionRate: 0,
    averageRating: 4.8,
    topService: '',
    customerCount: 0,
    dayOfWeekCounts: {
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0,
      'Sunday': 0
    },
  });
  const [serviceBreakdown, setServiceBreakdown] = useState<any[]>([]);
  // services management
  const [services, setServices] = useState<any[]>([]);
  const [newServiceTitle, setNewServiceTitle] = useState<string>('');
  const [newServicePrice, setNewServicePrice] = useState<string>('');
  const [newServiceDescription, setNewServiceDescription] = useState<string>('');
  const [newServiceFeatures, setNewServiceFeatures] = useState<string[]>([]);
  const [newFeatureInput, setNewFeatureInput] = useState<string>('');
  const [newServiceGradient, setNewServiceGradient] = useState<string>('linear-gradient(135deg, #60a5fa, #2563eb)');
  const [editingService, setEditingService] = useState<any | null>(null);
  const [newServiceImageFile, setNewServiceImageFile] = useState<File | null>(null);
  const [newServiceImagePreview, setNewServiceImagePreview] = useState<string>('');
  const serviceImageInputRef = useRef<HTMLInputElement>(null);
  // customer messaging
  const [customMessage, setCustomMessage] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isDraftingMessage, setIsDraftingMessage] = useState(false);
  // availability / blocked dates
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState<string>('');
  const [newBlockedReason, setNewBlockedReason] = useState<string>('');
  const [serviceRatings, setServiceRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [aiDemandForecast, setAiDemandForecast] = useState<DemandForecastRow[] | null>(null);
  const [aiDemandSummary, setAiDemandSummary] = useState<DemandModelSummary | null>(null);
  const [aiDemandLoading, setAiDemandLoading] = useState(false);
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'alert' | 'confirm';
    confirmLabel?: string;
    onConfirm?: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'alert',
  });

  const showAlertDialog = (message: string, title = 'Notice') => {
    setDialog({
      isOpen: true,
      title,
      message,
      variant: 'alert',
    });
  };

  const showConfirmDialog = (
    message: string,
    onConfirm: () => void | Promise<void>,
    title = 'Confirm action',
    confirmLabel = 'Yes, continue'
  ) => {
    setDialog({
      isOpen: true,
      title,
      message,
      variant: 'confirm',
      confirmLabel,
      onConfirm,
    });
  };

  // fetch services function
  const fetchServices = async () => {
    try {
      const [servicesRes, reviewsRes] = await Promise.all([
        supabase
          .from('services')
          .select('*')
          .order('title', { ascending: true }),
        supabase.from('reviews').select('service, rating'),
      ]);
      if (servicesRes.error) {
        console.error('Error fetching services:', servicesRes.error);
        return;
      }
      const ratingsMap: Record<string, { avg: number; count: number }> = {};
      const grouped: Record<string, { total: number; count: number }> = {};
      reviewsRes.data?.forEach((review: any) => {
        if (!grouped[review.service]) grouped[review.service] = { total: 0, count: 0 };
        grouped[review.service].total += review.rating;
        grouped[review.service].count += 1;
      });
      Object.entries(grouped).forEach(([service, data]) => {
        ratingsMap[service] = { avg: data.total / data.count, count: data.count };
      });
      setServiceRatings(ratingsMap);
      const overallReviews = reviewsRes.data || [];
      setMetrics((prev) => ({
        ...prev,
        averageRating: overallReviews.length
          ? overallReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / overallReviews.length
          : 0,
      }));
      setServices(servicesRes.data || []);
    } catch (e) {
      console.error('Error fetching services:', e);
    }
  };

  const createUserNotification = async (
    userId: string | undefined,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    bookingId?: number
  ) => {
    if (!userId) return;
    await supabase.from('notifications').insert([
      {
        user_id: userId,
        title,
        message,
        type,
        booking_id: bookingId,
      },
    ]);
  };

  const fetchBlockedDates = async () => {
    const { data } = await supabase
      .from('blocked_dates')
      .select('*')
      .order('date', { ascending: true });
    if (data) setBlockedDates(data);
  };

  const addBlockedDate = async () => {
    if (!newBlockedDate) return;
    const { error } = await supabase
      .from('blocked_dates')
      .insert([{ date: newBlockedDate, reason: newBlockedReason.trim() }]);
    if (error) {
      addNotification('Could not block date (already blocked or permission denied)', 'error');
    } else {
      addNotification(`${newBlockedDate} blocked successfully`, 'success');
      setNewBlockedDate('');
      setNewBlockedReason('');
      fetchBlockedDates();
    }
  };

  const removeBlockedDate = async (id: number) => {
    const { error } = await supabase.from('blocked_dates').delete().eq('id', id);
    if (!error) {
      addNotification('Date unblocked', 'success');
      fetchBlockedDates();
    }
  };

  const fetchStaffMembers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, surname, email')
      .eq('role', 'staff')
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching staff members:', error);
      return;
    }

    setStaffMembers((data || []) as StaffMember[]);
  };

  const getAdminAccessToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Missing active session token. Please sign in again.');
    }

    return session.access_token;
  };

  const fetchManagedStaff = async () => {
    setLoadingManagedStaff(true);
    try {
      const token = await getAdminAccessToken();
      const res = await fetch('/api/admin/staff-management', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to fetch staff accounts.');
      }

      setManagedStaff((json?.staff || []) as ManagedStaffAccount[]);
    } catch (error: any) {
      addNotification(error?.message || 'Could not load staff accounts.', 'error');
    } finally {
      setLoadingManagedStaff(false);
    }
  };

  const updateStaffAccount = async (
    staff: ManagedStaffAccount,
    action: 'disable' | 'enable' | 'reset-password'
  ) => {
    const draftPassword = (staffPasswordDrafts[staff.id] || '').trim();
    if (action === 'reset-password' && draftPassword.length < 8) {
      showAlertDialog('Please enter a new password with at least 8 characters.', 'Invalid password');
      return;
    }

    setStaffActionInProgressId(staff.id);
    try {
      const token = await getAdminAccessToken();
      const res = await fetch('/api/admin/staff-management', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          staffId: staff.id,
          action,
          newPassword: action === 'reset-password' ? draftPassword : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to update staff account.');
      }

      if (action === 'reset-password') {
        setStaffPasswordDrafts((prev) => ({ ...prev, [staff.id]: '' }));
      }

      addNotification(
        action === 'disable'
          ? `Disabled ${staff.first_name} ${staff.surname}`
          : action === 'enable'
          ? `Enabled ${staff.first_name} ${staff.surname}`
          : `Password reset for ${staff.first_name} ${staff.surname}`,
        'success'
      );
      logActivity(
        action === 'disable'
          ? `Disabled staff account ${staff.email}`
          : action === 'enable'
          ? `Enabled staff account ${staff.email}`
          : `Reset password for staff account ${staff.email}`
      );
      fetchManagedStaff();
    } catch (error: any) {
      showAlertDialog(error?.message || 'Could not update staff account.', 'Staff action failed');
    } finally {
      setStaffActionInProgressId(null);
    }
  };

  const deleteStaffAccount = async (staff: ManagedStaffAccount) => {
    showConfirmDialog(
      `Delete staff account for ${staff.first_name} ${staff.surname}? This action cannot be undone.`,
      async () => {
        setStaffActionInProgressId(staff.id);
        try {
          const token = await getAdminAccessToken();
          const res = await fetch(`/api/admin/staff-management?staffId=${encodeURIComponent(staff.id)}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const json = await res.json();
          if (!res.ok) {
            throw new Error(json?.error || 'Failed to delete staff account.');
          }

          addNotification(`Deleted staff account ${staff.email}`, 'success');
          logActivity(`Deleted staff account ${staff.email}`);
          fetchManagedStaff();
          fetchStaffMembers();
          fetchBookingsWithProfiles();
        } catch (error: any) {
          showAlertDialog(error?.message || 'Could not delete staff account.', 'Delete failed');
        } finally {
          setStaffActionInProgressId(null);
        }
      },
      'Delete staff account',
      'Delete account'
    );
  };

  const createStaffMember = async () => {
    const firstName = newStaffForm.firstName.trim();
    const surname = newStaffForm.surname.trim();
    const email = newStaffForm.email.trim().toLowerCase();
    const password = newStaffForm.password;

    if (!firstName || !surname || !email || !password) {
      showAlertDialog('Please fill in first name, surname, email, and password.', 'Missing information');
      return;
    }

    setCreatingStaff(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Missing active session token. Please sign in again.');
      }

      const res = await fetch('/api/admin/create-staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newStaffForm),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to create staff account.');
      }

      setNewStaffForm({
        firstName: '',
        surname: '',
        email: '',
        password: '',
        phone: '',
        location: '',
      });
      addNotification(`Staff account created for ${json?.email || email}`, 'success');
      logActivity(`Created staff account ${json?.email || email}`);
      fetchStaffMembers();
      fetchManagedStaff();
    } catch (error: any) {
      showAlertDialog(error?.message || 'Could not create staff account.', 'Create staff failed');
    } finally {
      setCreatingStaff(false);
    }
  };

  const assignStaffToBooking = async () => {
    if (!selectedBooking) return;

    setAssigningStaff(true);
    try {
      const assignId = staffToAssign || null;
      const { error } = await supabase
        .from('bookings')
        .update({ assigned_staff_id: assignId })
        .eq('id', selectedBooking.id);

      if (error) {
        throw error;
      }

      const selectedStaff = staffMembers.find((s) => s.id === staffToAssign);
      addNotification(
        selectedStaff
          ? `Assigned booking #${selectedBooking.id} to ${selectedStaff.first_name} ${selectedStaff.surname}`
          : `Removed staff assignment for booking #${selectedBooking.id}`,
        'success'
      );
      fetchBookingsWithProfiles();
      setSelectedBooking((prev) => (prev ? { ...prev, assigned_staff_id: assignId } : prev));
    } catch (error: any) {
      showAlertDialog(error?.message || 'Failed to assign staff to booking.', 'Assignment failed');
    } finally {
      setAssigningStaff(false);
    }
  };

  const fetchBookingsWithProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      showAlertDialog(`Error fetching bookings: ${error.message}`, 'Data load failed');
      setLoading(false);
      return;
    }

    if (data) {
      // Fetch user profiles for each booking
      const bookingsWithProfiles = await Promise.all(
        data.map(async (booking: any) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email, first_name, surname, location')
            .eq('id', booking.user_id)
            .single();

          // Fetch service price
          const { data: serviceData } = await supabase
            .from('services')
            .select('price')
            .eq('title', booking.service)
            .single();

          let staffName = '';
          if (booking.assigned_staff_id) {
            const { data: staffProfile } = await supabase
              .from('profiles')
              .select('first_name, surname')
              .eq('id', booking.assigned_staff_id)
              .single();
            if (staffProfile) {
              staffName = `${staffProfile.first_name} ${staffProfile.surname}`;
            }
          }

          return {
            ...booking,
            user_email: profileData?.email,
            user_name: profileData ? `${profileData.first_name} ${profileData.surname}` : 'Unknown User',
            user_location: profileData?.location || booking.location || '',
            service_price: serviceData?.price || booking.price,
            staff_name: staffName,
          };
        })
      );

      setBookings(bookingsWithProfiles);

      // Calculate advanced metrics
      const pending = bookingsWithProfiles.filter(
        (b) => b.status === 'Pending'
      ).length;
      const confirmed = bookingsWithProfiles.filter(
        (b) => b.status === 'Confirmed'
      ).length;
      
      // Total revenue only from confirmed bookings using service price
      const revenue = bookingsWithProfiles
        .filter((b) => b.status === 'Confirmed')
        .reduce((sum, b) => {
          const priceNum = parseFloat(b.service_price?.replace(/[^0-9.]/g, '') || '0');
          return sum + priceNum;
        }, 0);

      // Service breakdown
      const serviceMap = new Map<string, { count: number; revenue: number }>();
      bookingsWithProfiles.forEach((b) => {
        const priceNum = parseFloat(b.service_price?.replace(/[^0-9.]/g, '') || '0');
        if (!serviceMap.has(b.service)) {
          serviceMap.set(b.service, { count: 0, revenue: 0 });
        }
        const current = serviceMap.get(b.service)!;
        current.count += 1;
        if (b.status === 'Confirmed') current.revenue += priceNum;
      });

      const breakdown = Array.from(serviceMap.entries()).map(([service, data]) => ({
        service,
        ...data,
      })).sort((a, b) => b.revenue - a.revenue);

      setServiceBreakdown(breakdown);

      // Get unique customers
      const uniqueCustomers = new Set(bookingsWithProfiles.map((b) => b.user_id)).size;

      // Calculate completion rate and top service
      const completionRate = bookingsWithProfiles.length > 0 
        ? Math.round((confirmed / bookingsWithProfiles.length) * 100)
        : 0;

      const topService = breakdown.length > 0 ? breakdown[0].service : 'N/A';

      // Calculate bookings by day of week
      const dayOfWeekCounts = {
        'Monday': 0,
        'Tuesday': 0,
        'Wednesday': 0,
        'Thursday': 0,
        'Friday': 0,
        'Saturday': 0,
        'Sunday': 0
      };
      
      bookingsWithProfiles.forEach(booking => {
        const date = new Date(booking.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        if (dayOfWeekCounts.hasOwnProperty(dayName)) {
          dayOfWeekCounts[dayName as keyof typeof dayOfWeekCounts]++;
        }
      });

      setMetrics({
        totalBookings: bookingsWithProfiles.length,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        totalRevenue: revenue,
        completionRate: completionRate,
        averageRating: 4.8,
        topService: topService,
        customerCount: uniqueCustomers,
        dayOfWeekCounts: dayOfWeekCounts,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileData?.role !== 'admin') {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      fetchBookingsWithProfiles();
      fetchCustomers();
      fetchServices();
      fetchBlockedDates();
      fetchStaffMembers();
      fetchManagedStaff();
      logActivity('Admin logged in');

      // Set up real-time subscription for new bookings
      const channel = supabase
        .channel('bookings_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings'
        }, (payload) => {
          addNotification(`New booking received from ${payload.new.user_id}`, 'info');
          fetchBookingsWithProfiles();
        })
        .subscribe();
    };

    checkAuthAndFetch();

  }, []);

  const updateBookingStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating booking:', error);
      showAlertDialog('Failed to update booking status', 'Update failed');
    } else {
      logActivity(`Updated booking #${id} status to ${newStatus}`);
      // Send email notification to customer
      const booking = bookings.find((b) => b.id === id) ?? selectedBooking;
      if (booking?.user_id) {
        await createUserNotification(
          booking.user_id,
          newStatus === 'Complete' ? 'Certificate ready' : `Booking ${newStatus}`,
          newStatus === 'Complete'
            ? `Your ${booking.service} service is complete. Your certificate and invoice are now available.`
            : `Your ${booking.service} booking is now marked as ${newStatus}.`,
          newStatus === 'Rejected' ? 'warning' : 'success',
          booking.id
        );
      }
      if (booking?.user_email) {
        try {
          await fetch('/api/send-status-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail: booking.user_email,
              userName: booking.user_name ?? 'Customer',
              service: booking.service,
              date: booking.date,
              time: booking.time,
              status: newStatus,
              bookingId: booking.id,
            }),
          });
          addNotification(`Status updated & notification sent to ${booking.user_email}`, 'success');
        } catch (emailErr) {
          console.warn('Email notification failed:', emailErr);
          addNotification(`Status updated (email notification failed)`, 'warning');
        }
      } else {
        addNotification(`Booking #${id} status updated to ${newStatus}`, 'success');
      }
      setSelectedBooking(null);
      fetchBookingsWithProfiles();
    }
  };

  const sendCustomMessage = async () => {
    if (!selectedBooking || !customMessage.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch('/api/send-status-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: selectedBooking.user_email,
          userName: selectedBooking.user_name ?? 'Customer',
          service: selectedBooking.service,
          date: selectedBooking.date,
          time: selectedBooking.time,
          status: selectedBooking.status,
          bookingId: selectedBooking.id,
          customMessage: customMessage.trim(),
        }),
      });
      if (!res.ok) throw new Error('API error');
      await createUserNotification(
        selectedBooking.user_id,
        'Message from SlickTech',
        customMessage.trim(),
        'info',
        selectedBooking.id
      );
      addNotification(`Message sent to ${selectedBooking.user_email}`, 'success');
      setCustomMessage('');
    } catch (e) {
      addNotification('Failed to send message', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const buildFallbackCustomerMessage = (booking: BookingWithProfile) => {
    const customerName = booking.user_name || 'Customer';
    if (booking.status === 'Rejected') {
      return `Hi ${customerName},\n\nThank you for your booking request for ${booking.service}. Unfortunately, we are unable to proceed with the selected slot (${booking.date} at ${booking.time}). Please reply with an alternative date and time and we will prioritize your request.\n\nKind regards,\nSlickTech Solutions`;
    }

    return `Hi ${customerName},\n\nThis is a quick update regarding your ${booking.service} booking scheduled for ${booking.date} at ${booking.time}. Your booking is currently marked as ${booking.status}. If you need any changes or have questions, please reply to this message and we will assist you promptly.\n\nKind regards,\nSlickTech Solutions`;
  };

  const generateAiMessageDraft = async () => {
    if (!selectedBooking) return;

    setIsDraftingMessage(true);
    try {
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message-draft',
          payload: {
            customerName: selectedBooking.user_name ?? 'Customer',
            customerEmail: selectedBooking.user_email ?? '',
            service: selectedBooking.service,
            date: selectedBooking.date,
            time: selectedBooking.time,
            status: selectedBooking.status,
            price: selectedBooking.price,
            description: selectedBooking.description,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('AI draft generation failed');
      }

      const json = await response.json();
      const draft = json?.result?.draft;

      if (!draft || typeof draft !== 'string') {
        throw new Error('Invalid AI draft response');
      }

      setCustomMessage(draft.trim());
      addNotification('AI draft generated', 'success');
    } catch (error) {
      console.warn('AI draft unavailable, using fallback template:', error);
      setCustomMessage(buildFallbackCustomerMessage(selectedBooking));
      addNotification('AI unavailable. A smart template was added instead.', 'warning');
    } finally {
      setIsDraftingMessage(false);
    }
  };

  // Bulk actions
  const handleSelectAllBookings = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map((b: any) => b.id));
    }
  };

  const handleSelectBooking = (id: number) => {
    setSelectedBookings(prev =>
      prev.includes(id)
        ? prev.filter(bid => bid !== id)
        : [...prev, id]
    );
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedBookings.length === 0) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .in('id', selectedBookings);

      if (error) throw error;

      logActivity(`Bulk updated ${selectedBookings.length} bookings to ${newStatus}`);
      setSelectedBookings([]);
      fetchBookingsWithProfiles();
    } catch (error) {
      console.error('Error bulk updating:', error);
      showAlertDialog('Failed to update selected bookings', 'Bulk update failed');
    }
  };

  const bulkDeleteBookings = async () => {
    if (selectedBookings.length === 0) return;
    showConfirmDialog(
      `Are you sure you want to delete ${selectedBookings.length} bookings?`,
      async () => {
        try {
          const { error } = await supabase
            .from('bookings')
            .delete()
            .in('id', selectedBookings);

          if (error) throw error;

          logActivity(`Deleted ${selectedBookings.length} bookings`);
          setSelectedBookings([]);
          fetchBookingsWithProfiles();
        } catch (error) {
          console.error('Error deleting bookings:', error);
          showAlertDialog('Failed to delete selected bookings', 'Delete failed');
        }
      },
      'Delete bookings',
      'Delete'
    );
  };

  // Service management
  const addService = async () => {
    if (!newServiceTitle.trim() || !newServicePrice.trim()) return;

    // debug: log current session and role
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('attempting addService as user', user);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        console.log('user profile role', profile?.role);
      }
    } catch (fetchErr) {
      console.warn('could not fetch user info before addService', fetchErr);
    }

    try {
      // Upload image if one was selected
      let imageUrl: string | undefined = editingService?.image_url ?? undefined;
      if (newServiceImageFile) {
        const ext = newServiceImageFile.name.split('.').pop() ?? 'jpg';
        const path = `services/${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('service-images')
          .upload(path, newServiceImageFile, { upsert: true });
        if (uploadError) {
          // Surface storage errors clearly (bucket may not exist yet)
          const storageMsg: string = uploadError.message || JSON.stringify(uploadError);
          addNotification(`Image upload failed: ${storageMsg}. Service will be saved without image.`, 'warning');
          imageUrl = editingService?.image_url ?? undefined;
        } else {
          const { data: urlData } = supabase.storage.from('service-images').getPublicUrl(uploadData.path);
          imageUrl = urlData.publicUrl;
        }
      }

      // Build payload — only include image_url when it has a value so missing DB column doesn't error
      const servicePayload: Record<string, unknown> = {
        title: newServiceTitle.trim(),
        price: newServicePrice.trim(),
        description: newServiceDescription.trim(),
        features: newServiceFeatures,
        image: newServiceGradient,
      };
      if (imageUrl !== undefined) servicePayload.image_url = imageUrl;

      if (editingService) {
        // update existing
        const { error } = await supabase
          .from('services')
          .update(servicePayload)
          .eq('id', editingService.id);
        if (error) throw error;
        addNotification(`Service "${newServiceTitle}" updated`, 'success');
        logActivity(`Updated service ${editingService.id}`);
      } else {
        const { error } = await supabase
          .from('services')
          .insert([servicePayload]);
        if (error) throw error;
        addNotification(`Service "${newServiceTitle}" added`, 'success');
        logActivity(`Added service ${newServiceTitle}`);
      }
      setNewServiceTitle('');
      setNewServicePrice('');
      setNewServiceDescription('');
      setNewServiceFeatures([]);
      setNewFeatureInput('');
      setNewServiceGradient('linear-gradient(135deg, #60a5fa, #2563eb)');
      setNewServiceImageFile(null);
      setNewServiceImagePreview('');
      setEditingService(null);
      fetchServices();
    } catch (err) {
      // Supabase PostgrestError has non-enumerable props — extract them explicitly
      const pgErr = err as any;
      const msg: string =
        pgErr?.message ||
        pgErr?.msg ||
        (err instanceof Error ? err.message : '') ||
        (() => { try { return JSON.stringify(err); } catch { return String(err); } })();
      const code: string = pgErr?.code ?? '';
      const details: string = pgErr?.details ?? '';
      const hint: string = pgErr?.hint ?? '';
      console.error('Error adding/updating service:', msg, { code, details, hint });
      const isRls = msg.toLowerCase().includes('row-level security') || code === '42501';
      const isMissingCol = msg.toLowerCase().includes('column') && msg.toLowerCase().includes('does not exist');
      if (isRls) {
        addNotification('Permission denied: RLS policy blocked the action. Ensure your admin account has the correct role.', 'error');
      } else if (isMissingCol) {
        addNotification('Database column missing. Run the latest migration (ALTER TABLE services ADD COLUMN image_url TEXT) in Supabase.', 'error');
      } else {
        addNotification(`Failed to save service: ${msg || 'Unknown error'}`, 'error');
      }
    }
  };

  const deleteService = async (id: number) => {
    showConfirmDialog('Are you sure you want to delete this service?', async () => {
      try {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', id);
        if (error) throw error;
        addNotification('Service removed', 'success');
        if (editingService && editingService.id === id) {
          setEditingService(null);
          setNewServiceTitle('');
          setNewServicePrice('');
        }
        fetchServices();
        logActivity(`Deleted service id ${id}`);
      } catch (err) {
        console.error('Error deleting service:', err);
        addNotification(`Failed to delete service: ${(err as any)?.message || 'Unknown error'}`, 'error');
      }
    }, 'Delete service', 'Delete');
  };

  // Activity logging
  const logActivity = (action: string) => {
    const newActivity = {
      id: Date.now(),
      action,
      timestamp: new Date().toISOString(),
      admin: 'Admin'
    };
    setActivityLog(prev => [newActivity, ...prev.slice(0, 49)]); // Keep last 50 activities
  };

  // Customer management
  const fetchCustomers = async () => {
    try {
      const [{ data: profiles }, { data: servicesData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'user'),
        supabase.from('services').select('title, price'),
      ]);

      if (profiles) {
        const customersWithStats = await Promise.all(
          profiles.map(async (profile) => {
            const { data: userBookings } = await supabase
              .from('bookings')
              .select('*')
              .eq('user_id', profile.id);

            const totalSpent = userBookings?.reduce((sum, booking) => {
              if (booking.status === 'Confirmed') {
                // Use booking.price first; fall back to the service's current price
                const rawPrice =
                  booking.price ||
                  servicesData?.find((s: { title: string; price: string }) => s.title === booking.service)?.price ||
                  '0';
                return sum + parseFloat(String(rawPrice).replace(/[^0-9.]/g, '') || '0');
              }
              return sum;
            }, 0) || 0;

            return {
              ...profile,
              totalBookings: userBookings?.length || 0,
              confirmedBookings: userBookings?.filter(b => b.status === 'Confirmed').length || 0,
              totalSpent
            };
          })
        );
        setCustomers(customersWithStats);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Notifications system
  const addNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Enhanced filtering
  const getAvailableServices = () => {
    const services = [...new Set(bookings.map(b => b.service))];
    return services;
  };

  // Filter bookings based on search, status, date range, and service
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;

    const matchesService = serviceFilter === 'all' || booking.service === serviceFilter;

    const matchesDateRange = (!dateRange.start || booking.date >= dateRange.start) &&
                            (!dateRange.end || booking.date <= dateRange.end);

    return matchesSearch && matchesStatus && matchesService && matchesDateRange;
  });

  const aiDemandInsights = React.useMemo(() => {
    const dayCounts: Record<string, number> = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };

    const eligibleBookings = bookings.filter((booking) => booking.status !== 'Rejected');

    eligibleBookings.forEach((booking) => {
      const dateObj = new Date(booking.date);
      if (Number.isNaN(dateObj.getTime())) return;

      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayCounts[dayName]) return;

      dayCounts[dayName] += 1;
    });

    const maxDayBookings = Math.max(...Object.values(dayCounts), 1);

    const forecastRows: DemandForecastRow[] = AI_DAY_ORDER.map((day) => {
      const bookingsCount = dayCounts[day];
      const probability = Math.min(99, Math.round((bookingsCount / maxDayBookings) * 100));

      let predictedLoad: DemandForecastRow['predictedLoad'] = 'Low';
      if (probability >= 90) predictedLoad = 'Full';
      else if (probability >= 70) predictedLoad = 'High';
      else if (probability >= 40) predictedLoad = 'Moderate';

      const suggestedStaff =
        predictedLoad === 'Full'
          ? 'Allocate full team + overflow support'
          : predictedLoad === 'High'
          ? 'Allocate full core team'
          : predictedLoad === 'Moderate'
          ? 'Allocate standard team'
          : 'Lean team allocation';

      return {
        day,
        bookings: bookingsCount,
        probability,
        predictedLoad,
        suggestedStaff,
      };
    }).sort((a, b) => b.probability - a.probability);

    return {
      forecastRows,
      busiestDay: forecastRows[0]?.day || 'N/A',
      lowDemandDay: [...forecastRows].reverse()[0]?.day || 'N/A',
    };
  }, [bookings]);

  useEffect(() => {
    const fetchAIDemandForecast = async () => {
      if (bookings.length === 0) {
        setAiDemandForecast(null);
        setAiDemandSummary(null);
        return;
      }

      setAiDemandLoading(true);
      try {
        const payload = {
          generatedAt: new Date().toISOString(),
          weeklyDayCounts: metrics.dayOfWeekCounts,
          bookings: bookings.slice(-400).map((booking) => ({
            date: booking.date,
            time: booking.time,
            service: booking.service,
            status: booking.status,
          })),
        };

        const response = await fetch('/api/ai-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'demand',
            payload,
          }),
        });

        if (!response.ok) {
          setAiDemandForecast(null);
          setAiDemandSummary(null);
          return;
        }

        const json = await response.json();
        const result = json?.result;

        const normalizedForecast = Array.isArray(result?.forecast)
          ? result.forecast
              .map((row: any) => ({
                day: String(row?.day || ''),
                bookings: 0,
                probability: Math.max(0, Math.min(100, Number(row?.probability || 0))),
                predictedLoad:
                  row?.predictedLoad === 'Full' || row?.predictedLoad === 'High' || row?.predictedLoad === 'Moderate'
                    ? row.predictedLoad
                    : 'Low',
                suggestedStaff: String(row?.suggestedStaff || 'Allocate standard team'),
              }))
              .filter((row: DemandForecastRow) => AI_DAY_ORDER.includes(row.day))
          : [];

        const sortedForecast = normalizedForecast.sort(
          (a: DemandForecastRow, b: DemandForecastRow) => AI_DAY_ORDER.indexOf(a.day) - AI_DAY_ORDER.indexOf(b.day)
        );

        const summary = result?.summary
          ? {
              busiestDay: String(result.summary.busiestDay || aiDemandInsights.busiestDay),
              lowDemandDay: String(result.summary.lowDemandDay || aiDemandInsights.lowDemandDay),
              note: String(result.summary.note || ''),
            }
          : null;

        if (sortedForecast.length > 0) {
          setAiDemandForecast(sortedForecast);
          setAiDemandSummary(summary);
        } else {
          setAiDemandForecast(null);
          setAiDemandSummary(null);
        }
      } catch (error) {
        console.warn('AI demand forecast unavailable:', error);
        setAiDemandForecast(null);
        setAiDemandSummary(null);
      } finally {
        setAiDemandLoading(false);
      }
    };

    fetchAIDemandForecast();
  }, [bookings, metrics.dayOfWeekCounts, aiDemandInsights.busiestDay, aiDemandInsights.lowDemandDay]);

  useEffect(() => {
    if (!selectedBooking) {
      setStaffToAssign('');
      return;
    }
    setStaffToAssign(selectedBooking.assigned_staff_id || '');
  }, [selectedBooking]);

  const forecastRowsForDisplay = aiDemandForecast && aiDemandForecast.length > 0
    ? aiDemandForecast
    : [];
  const busiestPrediction = aiDemandSummary?.busiestDay || 'AI unavailable';
  const lowDemandPrediction = aiDemandSummary?.lowDemandDay || 'AI unavailable';
  const forecastNote = aiDemandSummary?.note || 'AI demand forecast unavailable. Fallback is disabled for testing.';

  // Export bookings to PDF
  const exportToPDF = async () => {
    const pdfContent = document.createElement('div');
    pdfContent.style.width = '210mm';
    pdfContent.style.padding = '20mm';
    pdfContent.style.fontFamily = 'Arial, sans-serif';
    pdfContent.style.backgroundColor = '#ffffff';
    pdfContent.style.position = 'absolute';
    pdfContent.style.left = '-9999px';
    pdfContent.style.top = '-9999px';
    
    const filteredBookings = bookings.filter((booking) => {
      const matchesSearch = 
        booking.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.service?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });

    pdfContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
        <img src="${SlickTechLogo.src}" alt="SlickTech Logo" style="height: 60px; margin-bottom: 15px;" />
        <h1 style="color: #1e293b; font-size: 28px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 2px;">SLICKTECH</h1>
        <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Professional Tech Solutions</p>
      </div>
      
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="color: #1e293b; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Bookings Report</h2>
        <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h3 style="color: #1e293b; font-size: 18px; font-weight: bold; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1px;">Summary Statistics</h3>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="color: #374151; font-size: 12px; font-weight: bold; margin-bottom: 5px;">Total Bookings</div>
            <div style="color: #1e293b; font-size: 20px; font-weight: bold;">${metrics.totalBookings}</div>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="color: #374151; font-size: 12px; font-weight: bold; margin-bottom: 5px;">Confirmed</div>
            <div style="color: #059669; font-size: 20px; font-weight: bold;">${metrics.confirmedBookings}</div>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="color: #374151; font-size: 12px; font-weight: bold; margin-bottom: 5px;">Pending</div>
            <div style="color: #d97706; font-size: 20px; font-weight: bold;">${metrics.pendingBookings}</div>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="color: #374151; font-size: 12px; font-weight: bold; margin-bottom: 5px;">Revenue</div>
            <div style="color: #2563eb; font-size: 20px; font-weight: bold;">$${metrics.totalRevenue.toFixed(2)}</div>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h3 style="color: #1e293b; font-size: 18px; font-weight: bold; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1px;">Bookings Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-weight: bold; color: #374151;">ID</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-weight: bold; color: #374151;">Client</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-weight: bold; color: #374151;">Service</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-weight: bold; color: #374151;">Date</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-weight: bold; color: #374151;">Time</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-weight: bold; color: #374151;">Status</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-weight: bold; color: #374151;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${filteredBookings.slice(0, 50).map(booking => `
              <tr>
                <td style="border: 1px solid #e2e8f0; padding: 6px; color: #374151;">${booking.id}</td>
                <td style="border: 1px solid #e2e8f0; padding: 6px; color: #374151;">${booking.user_name || 'N/A'}</td>
                <td style="border: 1px solid #e2e8f0; padding: 6px; color: #374151;">${booking.service}</td>
                <td style="border: 1px solid #e2e8f0; padding: 6px; color: #374151;">${booking.date}</td>
                <td style="border: 1px solid #e2e8f0; padding: 6px; color: #374151;">${booking.time}</td>
                <td style="border: 1px solid #e2e8f0; padding: 6px; color: ${booking.status === 'Confirmed' ? '#059669' : booking.status === 'Pending' ? '#d97706' : '#dc2626'}; font-weight: bold;">${booking.status}</td>
                <td style="border: 1px solid #e2e8f0; padding: 6px; color: #2563eb; font-weight: bold;">${booking.price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${filteredBookings.length > 50 ? `<p style="color: #64748b; font-size: 10px; margin-top: 10px;">Showing first 50 bookings. Total: ${filteredBookings.length} bookings.</p>` : ''}
      </div>
      
      <div style="text-align: center; border-top: 2px solid #e2e8f0; padding-top: 30px; margin-top: 40px;">
        <p style="color: #64748b; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Generated by SlickTech Admin Dashboard</p>
        <p style="color: #64748b; font-size: 8px; margin: 5px 0 0 0;">© 2026 SlickTech Technologies | All rights reserved</p>
      </div>
    `;
    
    document.body.appendChild(pdfContent);
    
    try {
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123
      });
      
      const pdf = new jsPDF();
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      
      pdf.save(`SlickTech_Bookings_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      showAlertDialog('Failed to generate PDF. Please try again.', 'PDF error');
    } finally {
      document.body.removeChild(pdfContent);
    }
  };

  // Export KPIs to PDF with charts (multi-page support)
  const exportKPIsToPDF = async () => {
    const pdf = new jsPDF();
    let currentPage = 1;
    
    // Helper function to add a new page
    const addNewPage = () => {
      pdf.addPage();
      currentPage++;
      // Add page number
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Page ${currentPage}`, 105, 290, { align: 'center' });
    };
    
    // Add page number to first page
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Page ${currentPage}`, 105, 290, { align: 'center' });
    
    // Page 1: Header and Main KPIs
    const page1Content = document.createElement('div');
    page1Content.style.width = '210mm';
    page1Content.style.padding = '20mm';
    page1Content.style.fontFamily = 'Arial, sans-serif';
    page1Content.style.backgroundColor = '#ffffff';
    page1Content.style.position = 'absolute';
    page1Content.style.left = '-9999px';
    page1Content.style.top = '-9999px';
    
    page1Content.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
        <img src="${SlickTechLogo.src}" alt="SlickTech Logo" style="height: 60px; margin-bottom: 15px;" />
        <h1 style="color: #1e293b; font-size: 28px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 2px;">SLICKTECH</h1>
        <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Professional Tech Solutions</p>
      </div>
      
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="color: #1e293b; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px;">KPI Dashboard Report</h2>
        <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h3 style="color: #1e293b; font-size: 20px; font-weight: bold; margin: 0 0 25px 0; text-transform: uppercase; letter-spacing: 1px;">📊 Key Performance Indicators</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px;">
          <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 12px; border: 1px solid #93c5fd;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #1e40af; font-size: 14px; font-weight: bold;">Total Bookings</span>
              <span style="font-size: 20px;">📊</span>
            </div>
            <div style="font-size: 36px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">${metrics.totalBookings}</div>
            <div style="color: #64748b; font-size: 12px;">All time bookings</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 25px; border-radius: 12px; border: 1px solid #86efac;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #166534; font-size: 14px; font-weight: bold;">Confirmed Bookings</span>
              <span style="font-size: 20px;">✅</span>
            </div>
            <div style="font-size: 36px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">${metrics.confirmedBookings}</div>
            <div style="color: #64748b; font-size: 12px;">Completed bookings</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 12px; border: 1px solid #fcd34d;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #92400e; font-size: 14px; font-weight: bold;">Pending Bookings</span>
              <span style="font-size: 20px;">⏳</span>
            </div>
            <div style="font-size: 36px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">${metrics.pendingBookings}</div>
            <div style="color: #64748b; font-size: 12px;">Awaiting confirmation</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%); padding: 25px; border-radius: 12px; border: 1px solid #a78bfa;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #6b21a8; font-size: 14px; font-weight: bold;">Total Revenue</span>
              <span style="font-size: 20px;">💰</span>
            </div>
            <div style="font-size: 28px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">$${metrics.totalRevenue.toFixed(2)}</div>
            <div style="color: #64748b; font-size: 12px;">Revenue generated</div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(page1Content);
    
    try {
      const canvas1 = await html2canvas(page1Content, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123
      });
      
      const imgData1 = canvas1.toDataURL('image/png');
      pdf.addImage(imgData1, 'PNG', 0, 0, 210, 297);
    } catch (error) {
      console.error('Error generating page 1:', error);
    } finally {
      document.body.removeChild(page1Content);
    }
    
    // Page 2: Performance Metrics and Service Performance
    addNewPage();
    
    const page2Content = document.createElement('div');
    page2Content.style.width = '210mm';
    page2Content.style.padding = '20mm';
    page2Content.style.fontFamily = 'Arial, sans-serif';
    page2Content.style.backgroundColor = '#ffffff';
    page2Content.style.position = 'absolute';
    page2Content.style.left = '-9999px';
    page2Content.style.top = '-9999px';
    
    page2Content.innerHTML = `
      <div style="margin-bottom: 40px;">
        <h3 style="color: #1e293b; font-size: 20px; font-weight: bold; margin: 0 0 25px 0; text-transform: uppercase; letter-spacing: 1px;">📈 Performance Metrics</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px;">
          <div style="background: linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%); padding: 25px; border-radius: 12px; border: 1px solid #67e8f9;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #0e7490; font-size: 14px; font-weight: bold;">Completion Rate</span>
              <span style="font-size: 20px;">🎯</span>
            </div>
            <div style="font-size: 36px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">${metrics.completionRate}%</div>
            <div style="color: #64748b; font-size: 12px;">Booking success rate</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); padding: 25px; border-radius: 12px; border: 1px solid #f9a8d4;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #be185d; font-size: 14px; font-weight: bold;">Customer Rating</span>
              <span style="font-size: 20px;">⭐</span>
            </div>
            <div style="font-size: 36px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">${metrics.averageRating}</div>
            <div style="color: #64748b; font-size: 12px;">Average satisfaction</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%); padding: 25px; border-radius: 12px; border: 1px solid #fb923c;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #c2410c; font-size: 14px; font-weight: bold;">Total Customers</span>
              <span style="font-size: 20px;">👥</span>
            </div>
            <div style="font-size: 36px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">${metrics.customerCount}</div>
            <div style="color: #64748b; font-size: 12px;">Unique customers</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%); padding: 25px; border-radius: 12px; border: 1px solid #f87171;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #dc2626; font-size: 14px; font-weight: bold;">Top Service</span>
              <span style="font-size: 20px;">🔥</span>
            </div>
            <div style="font-size: 20px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">${metrics.topService}</div>
            <div style="color: #64748b; font-size: 12px;">Most popular service</div>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h3 style="color: #1e293b; font-size: 20px; font-weight: bold; margin: 0 0 25px 0; text-transform: uppercase; letter-spacing: 1px;">🎯 Service Performance</h3>
        <div style="background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0;">
          ${serviceBreakdown.slice(0, 6).map(service => `
            <div style="display: flex; justify-between; align-items: center; margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="flex: 1;">
                <div style="font-weight: bold; color: #1e293b; margin-bottom: 5px;">${service.service}</div>
                <div style="display: flex; gap: 20px; font-size: 12px; color: #64748b;">
                  <span>Bookings: <strong>${service.count}</strong></span>
                  <span>Revenue: <strong style="color: #059669;">$${service.revenue.toFixed(2)}</strong></span>
                </div>
              </div>
              <div style="width: 100px; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                <div style="width: ${Math.min(100, (service.revenue / (metrics.totalRevenue || 1)) * 100)}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #1d4ed8); border-radius: 4px;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(page2Content);
    
    try {
      const canvas2 = await html2canvas(page2Content, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123
      });
      
      const imgData2 = canvas2.toDataURL('image/png');
      pdf.addImage(imgData2, 'PNG', 0, 0, 210, 297);
    } catch (error) {
      console.error('Error generating page 2:', error);
    } finally {
      document.body.removeChild(page2Content);
    }
    
    // Page 3: Booking History by Day of Week
    addNewPage();
    
    // Calculate bookings by day of week
    const dayOfWeekCounts = {
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0,
      'Sunday': 0
    };
    
    bookings.forEach(booking => {
      const date = new Date(booking.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      if (dayOfWeekCounts.hasOwnProperty(dayName)) {
        dayOfWeekCounts[dayName as keyof typeof dayOfWeekCounts]++;
      }
    });
    
    const maxBookings = Math.max(...Object.values(dayOfWeekCounts));
    
    const page3Content = document.createElement('div');
    page3Content.style.width = '210mm';
    page3Content.style.padding = '20mm';
    page3Content.style.fontFamily = 'Arial, sans-serif';
    page3Content.style.backgroundColor = '#ffffff';
    page3Content.style.position = 'absolute';
    page3Content.style.left = '-9999px';
    page3Content.style.top = '-9999px';
    
    page3Content.innerHTML = `
      <div style="margin-bottom: 40px;">
        <h3 style="color: #1e293b; font-size: 20px; font-weight: bold; margin: 0 0 25px 0; text-transform: uppercase; letter-spacing: 1px;">📅 Booking History by Day of Week</h3>
        <div style="background: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="margin-bottom: 20px; text-align: center;">
            <h4 style="color: #1e293b; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">Busiest Days Analysis</h4>
            <p style="color: #64748b; font-size: 12px; margin: 0;">Total bookings analyzed: ${bookings.length}</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
            ${Object.entries(dayOfWeekCounts)
              .sort(([,a], [,b]) => b - a)
              .map(([day, count]) => `
                <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <div style="width: 100px; font-weight: bold; color: #1e293b;">${day}</div>
                  <div style="flex: 1; display: flex; align-items: center; gap: 15px;">
                    <div style="flex: 1; height: 20px; background: #e5e7eb; border-radius: 10px; overflow: hidden;">
                      <div style="width: ${maxBookings > 0 ? (count / maxBookings) * 100 : 0}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #1d4ed8); border-radius: 10px; transition: width 0.3s ease;"></div>
                    </div>
                    <div style="width: 60px; text-align: right; font-weight: bold; color: #1e293b;">${count}</div>
                  </div>
                </div>
              `).join('')}
          </div>
          
          <div style="margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; border: 1px solid #bae6fd;">
            <h5 style="color: #0c4a6e; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">📊 Summary</h5>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; font-size: 12px;">
              <div>
                <span style="color: #64748b;">Busiest Day:</span>
                <span style="font-weight: bold; color: #1e293b; margin-left: 5px;">
                  ${Object.entries(dayOfWeekCounts).reduce((a, b) => dayOfWeekCounts[a[0] as keyof typeof dayOfWeekCounts] > dayOfWeekCounts[b[0] as keyof typeof dayOfWeekCounts] ? a : b)[0]}
                  (${Math.max(...Object.values(dayOfWeekCounts))} bookings)
                </span>
              </div>
              <div>
                <span style="color: #64748b;">Slowest Day:</span>
                <span style="font-weight: bold; color: #1e293b; margin-left: 5px;">
                  ${Object.entries(dayOfWeekCounts).reduce((a, b) => dayOfWeekCounts[a[0] as keyof typeof dayOfWeekCounts] < dayOfWeekCounts[b[0] as keyof typeof dayOfWeekCounts] ? a : b)[0]}
                  (${Math.min(...Object.values(dayOfWeekCounts))} bookings)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; border-top: 2px solid #e2e8f0; padding-top: 30px; margin-top: 40px;">
        <p style="color: #64748b; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Generated by SlickTech Admin Dashboard</p>
        <p style="color: #64748b; font-size: 8px; margin: 5px 0 0 0;">© 2026 SlickTech Technologies | All rights reserved</p>
      </div>
    `;
    
    document.body.appendChild(page3Content);
    
    try {
      const canvas3 = await html2canvas(page3Content, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123
      });
      
      const imgData3 = canvas3.toDataURL('image/png');
      pdf.addImage(imgData3, 'PNG', 0, 0, 210, 297);
    } catch (error) {
      console.error('Error generating page 3:', error);
    } finally {
      document.body.removeChild(page3Content);
    }
    
    pdf.save(`SlickTech_KPI_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Complete':
        return 'bg-blue-100 text-blue-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Show analytics screen if viewing one */}
      {viewAnalytics ? (
        <AnalyticsScreen 
          chartType={viewAnalytics} 
          onBack={() => setViewAnalytics(null)}
        />
      ) : (
        <>
          {/* Animated background elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl animate-pulse"></div>
          </div>

          <div className="relative z-10">
        {!isAuthorized ? (
          <div className="flex items-center justify-center h-screen">
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl p-8 border border-white/20 text-center max-w-md">
              <h2 className="text-3xl font-bold text-white mb-4">Access Denied</h2>
              <p className="text-white/70 mb-6">You do not have admin privileges.</p>
              <button
                onClick={onLogout}
                className="w-full bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white py-2 px-4 rounded-xl font-semibold transition-all backdrop-blur-md border border-white/20"
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="loader ease-linear rounded-full border-8 border-white/20 border-t-white h-16 w-16"></div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="backdrop-blur-xl bg-gradient-to-r from-white/40 to-white/20 border-b border-gray-200 px-6 py-8 sticky top-0 z-20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold text-slate-900">Admin Dashboard</h1>
                  <p className="text-slate-600 text-sm mt-2">Manage bookings, track revenue, and analyze performance</p>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold p-2 rounded-full transition-all hover:scale-110 relative"
                      title="Notifications"
                    >
                      <FaBell />
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {notifications.length}
                        </span>
                      )}
                    </button>
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-[90vw] max-w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="p-4 border-b border-gray-200">
                          <h3 className="font-semibold text-slate-900">Notifications</h3>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-slate-500">No notifications</div>
                          ) : (
                            notifications.map((notification) => (
                              <div key={notification.id} className={`p-3 border-b border-gray-100 hover:bg-gray-50 flex justify-between items-start`}>
                                <div className="flex-1">
                                  <p className="text-sm text-slate-800">{notification.message}</p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {new Date(notification.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                <button
                                  onClick={() => removeNotification(notification.id)}
                                  className="text-slate-400 hover:text-slate-600 ml-2"
                                >
                                  ×
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={fetchBookingsWithProfiles}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold p-2 rounded-full transition-all hover:scale-110"
                    title="Refresh data"
                  >
                    <FaSync className={showNotifications ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                    title="Export bookings to PDF"
                  >
                    <FaFilePdf /> Bookings PDF
                  </button>
                  <button
                    onClick={exportKPIsToPDF}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                    title="Export KPIs to PDF"
                  >
                    <FaFilePdf /> KPI Report
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold p-2 rounded-full transition-all hover:scale-110"
                    title="Settings"
                  >
                    <FaCog />
                  </button>
                  <button
                    onClick={toggleTheme}
                    className="bg-slate-600 hover:bg-slate-700 text-white font-semibold p-2 rounded-full transition-all hover:scale-110"
                    title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                  >
                    {theme === 'light' ? <FaMoon /> : <FaSun />}
                  </button>
                  <button
                    onClick={onLogout}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-8 rounded-xl transition-all backdrop-blur-md border border-white/20 hover:border-white/40"
                  >
                    Logout
                  </button>
                </div>

                <div className="md:hidden flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowMobileActions(false);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold p-2 rounded-full transition-all relative"
                    title="Notifications"
                  >
                    <FaBell />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileActions(!showMobileActions);
                      setShowNotifications(false);
                    }}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-semibold p-2 rounded-full transition-all"
                    title="Admin actions"
                  >
                    <FaBars />
                  </button>
                </div>
              </div>

              {showMobileActions && (
                <div className="md:hidden mb-4 rounded-xl bg-white/90 border border-slate-200 p-3 shadow-sm">
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => {
                        fetchBookingsWithProfiles();
                        setShowMobileActions(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold"
                    >
                      Refresh Data
                    </button>
                    <button
                      onClick={() => {
                        exportToPDF();
                        setShowMobileActions(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-green-50 text-green-700 font-semibold"
                    >
                      Export Bookings PDF
                    </button>
                    <button
                      onClick={() => {
                        exportKPIsToPDF();
                        setShowMobileActions(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-purple-50 text-purple-700 font-semibold"
                    >
                      Export KPI Report
                    </button>
                    <button
                      onClick={() => {
                        setShowSettings(!showSettings);
                        setShowMobileActions(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        toggleTheme();
                        setShowMobileActions(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
                    >
                      {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-3 py-2 rounded-lg bg-red-50 text-red-700 font-semibold"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="hidden md:flex space-x-1 mb-6">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: FaChartBar },
                  { id: 'customers', label: 'Customers', icon: FaUser },
                  { id: 'staff', label: 'Staff', icon: FaUsers },
                  { id: 'activity', label: 'Activity Log', icon: FaHistory },
                  { id: 'services', label: 'Services', icon: FaFilter },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white/60 text-slate-700 hover:bg-white/80'
                    }`}
                  >
                    <tab.icon />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="md:hidden mb-4">
                <button
                  onClick={() => setShowMobileTabs(!showMobileTabs)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white/80 border border-slate-200 text-slate-800 font-semibold"
                >
                  <span>
                    {activeTab === 'dashboard' && 'Dashboard'}
                    {activeTab === 'customers' && 'Customers'}
                    {activeTab === 'staff' && 'Staff'}
                    {activeTab === 'activity' && 'Activity Log'}
                    {activeTab === 'services' && 'Services'}
                  </span>
                  <FaBars />
                </button>
                {showMobileTabs && (
                  <div className="mt-2 rounded-lg bg-white border border-slate-200 p-2 space-y-1">
                    {[
                      { id: 'dashboard', label: 'Dashboard' },
                      { id: 'customers', label: 'Customers' },
                      { id: 'staff', label: 'Staff' },
                      { id: 'activity', label: 'Activity Log' },
                      { id: 'services', label: 'Services' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          setShowMobileTabs(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md font-medium ${
                          activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search and Filter Bar */}
              {activeTab === 'dashboard' && (
                <>
                  <div className="hidden md:flex gap-4 items-center flex-wrap">
                    <div className="flex-1 relative min-w-64">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" />
                      <input
                        type="text"
                        placeholder="Search by client name, email, or service..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-gray-700 text-gray-900 font-medium"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                    >
                      <option value="all">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Complete">Complete</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <select
                      value={serviceFilter}
                      onChange={(e) => setServiceFilter(e.target.value)}
                      className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                    >
                      <option value="all">All Services</option>
                      {getAvailableServices().map(service => (
                        <option key={service} value={service}>{service}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                        placeholder="Start date"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                        placeholder="End date"
                      />
                    </div>
                  </div>

                  <div className="md:hidden">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" />
                        <input
                          type="text"
                          placeholder="Search bookings..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-gray-700 text-gray-900 font-medium"
                        />
                      </div>
                      <button
                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                        className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-slate-700"
                        title="Toggle filters"
                      >
                        <FaBars />
                      </button>
                    </div>

                    {showMobileFilters && (
                      <div className="mt-2 space-y-2 rounded-lg bg-white border border-slate-200 p-3">
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                        >
                          <option value="all">All Status</option>
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Complete">Complete</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        <select
                          value={serviceFilter}
                          onChange={(e) => setServiceFilter(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                        >
                          <option value="all">All Services</option>
                          {getAvailableServices().map(service => (
                            <option key={service} value={service}>{service}</option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                          placeholder="Start date"
                        />
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                          placeholder="End date"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Main Content */}
            {activeTab === 'dashboard' && (
              <>
                {/* Metrics Section */}
                <div className="px-6 py-12">
                  <h2 className="text-2xl font-bold text-slate-900 mb-8">📊 Key Performance Indicators</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div
                      onClick={() => setViewAnalytics('bookings')}
                      className="backdrop-blur-xl bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-2xl p-6 border border-blue-200/40 hover:border-blue-300/60 transition-all hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer hover:scale-105 transform"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-700 text-sm font-semibold">Total Bookings</p>
                        <FaChartBar className="text-blue-500 text-lg" />
                      </div>
                      <p className="text-4xl font-bold text-slate-900 mt-3">{metrics.totalBookings}</p>
                      <p className="text-xs text-slate-600 mt-2">All time bookings</p>
                    </div>
                    <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-2xl p-6 border border-yellow-200/40 hover:border-yellow-300/60 transition-all hover:shadow-2xl hover:shadow-yellow-500/20 hover:scale-105 transform">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-700 text-sm font-semibold">Pending</p>
                        <FaClock className="text-yellow-500 text-lg" />
                      </div>
                      <p className="text-4xl font-bold text-slate-900 mt-3">{metrics.pendingBookings}</p>
                      <p className="text-xs text-slate-600 mt-2">Awaiting approval</p>
                    </div>
                    <div className="backdrop-blur-xl bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-2xl p-6 border border-green-200/40 hover:border-green-300/60 transition-all hover:shadow-2xl hover:shadow-green-500/20 hover:scale-105 transform">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-700 text-sm font-semibold">Confirmed</p>
                        <FaCheck className="text-green-500 text-lg" />
                      </div>
                      <p className="text-4xl font-bold text-slate-900 mt-3">{metrics.confirmedBookings}</p>
                      <p className="text-xs text-slate-600 mt-2">Success rate: {metrics.completionRate}%</p>
                    </div>
                    <div
                      onClick={() => setViewAnalytics('revenue')}
                      className="backdrop-blur-xl bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-2xl p-6 border border-purple-200/40 hover:border-purple-300/60 transition-all hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer hover:scale-105 transform"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-700 text-sm font-semibold">Total Revenue</p>
                        <FaArrowUp className="text-purple-500 text-lg" />
                      </div>
                      <p className="text-4xl font-bold text-slate-900 mt-3">${metrics.totalRevenue.toFixed(2)}</p>
                      <p className="text-xs text-slate-600 mt-2">From confirmed bookings</p>
                    </div>
                  </div>

                  {/* Secondary Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div 
                      onClick={() => setViewAnalytics('busiest-days')}
                      className="backdrop-blur-xl bg-gradient-to-br from-indigo-400/20 to-indigo-600/20 rounded-2xl p-6 border border-indigo-200/40 hover:border-indigo-300/60 transition-all hover:shadow-lg cursor-pointer hover:scale-105 transform"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-700 text-sm font-semibold">Busiest Day</p>
                        <FaCalendar className="text-indigo-500 text-lg" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900 mt-3">
                        {Object.entries(metrics.dayOfWeekCounts).reduce((a, b) => 
                          metrics.dayOfWeekCounts[a[0] as keyof typeof metrics.dayOfWeekCounts] > 
                          metrics.dayOfWeekCounts[b[0] as keyof typeof metrics.dayOfWeekCounts] ? a : b
                        )[0]}
                      </p>
                      <p className="text-xs text-slate-600 mt-2">
                        {Math.max(...Object.values(metrics.dayOfWeekCounts))} bookings
                      </p>
                    </div>
                    <div className="backdrop-blur-xl bg-gradient-to-br from-pink-400/20 to-pink-600/20 rounded-2xl p-6 border border-pink-200/40 hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-700 text-sm font-semibold">Customers</p>
                        <FaUsers className="text-pink-500 text-lg" />
                      </div>
                      <p className="text-4xl font-bold text-slate-900 mt-3">{metrics.customerCount}</p>
                      <p className="text-xs text-slate-600 mt-2">Unique clients</p>
                    </div>
                    <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 rounded-2xl p-6 border border-cyan-200/40 hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-700 text-sm font-semibold">Avg Rating</p>
                        <FaSmile className="text-cyan-500 text-lg" />
                      </div>
                      <p className="text-4xl font-bold text-slate-900 mt-3">{metrics.averageRating}</p>
                      <p className="text-xs text-slate-600 mt-2">Customer satisfaction</p>
                    </div>
                    <div className="backdrop-blur-xl bg-gradient-to-br from-orange-400/20 to-orange-600/20 rounded-2xl p-6 border border-orange-200/40 hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-700 text-sm font-semibold">Top Service</p>
                        <FaArrowUp className="text-orange-500 text-lg" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900 mt-3 truncate">{metrics.topService}</p>
                      <p className="text-xs text-slate-600 mt-2">Most booked service</p>
                    </div>
                    <div
                      onClick={() => setViewAnalytics('popular-services')}
                      className="backdrop-blur-xl bg-gradient-to-br from-teal-400/20 to-teal-600/20 rounded-2xl p-6 border border-teal-200/40 hover:border-teal-300/60 transition-all hover:shadow-lg cursor-pointer hover:scale-105 transform"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-700 text-sm font-semibold">Popular Services</p>
                        <FaChartBar className="text-teal-500 text-lg" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900 mt-3 truncate">{metrics.topService}</p>
                      <p className="text-xs text-slate-600 mt-2">Click to view full breakdown</p>
                    </div>
                  </div>
                </div>

                {/* Service Breakdown Section */}
                <div className="px-6 pb-12">
                  <h2 className="text-2xl font-bold text-slate-900 mb-8">🧠 AI Demand Prediction</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="backdrop-blur-xl bg-white/40 rounded-2xl border border-gray-200 p-6 shadow-lg">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Booking Probability Forecast</h3>
                      {aiDemandLoading && (
                        <p className="text-xs text-slate-600 mb-3">Refreshing AI forecast...</p>
                      )}
                      {!aiDemandLoading && forecastRowsForDisplay.length === 0 && (
                        <p className="text-xs text-red-600 mb-3">AI forecast unavailable. Fallback is disabled for testing.</p>
                      )}
                      <div className="space-y-3">
                        {forecastRowsForDisplay.slice(0, 7).map((row) => (
                          <div key={row.day} className="flex items-center justify-between rounded-lg bg-white/70 border border-gray-200 p-3">
                            <div>
                              <p className="font-semibold text-slate-900">{row.day}</p>
                              <p className="text-xs text-slate-600">{row.suggestedStaff}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-900">{row.probability}%</p>
                              <p className="text-xs text-slate-600">{row.predictedLoad}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="backdrop-blur-xl bg-white/40 rounded-2xl border border-gray-200 p-6 shadow-lg">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Demand Summary</h3>
                      <div className="space-y-4">
                        <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4">
                          <p className="text-xs font-semibold text-indigo-700 uppercase">Busiest prediction</p>
                          <p className="text-xl font-bold text-slate-900 mt-1">{busiestPrediction}</p>
                        </div>
                        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                          <p className="text-xs font-semibold text-green-700 uppercase">Low demand day</p>
                          <p className="text-xl font-bold text-slate-900 mt-1">{lowDemandPrediction}</p>
                        </div>
                        <p className="text-xs text-slate-600">
                          {forecastNote}
                        </p>
                      </div>
                    </div>
                  </div>


                </div>

                {/* Service Breakdown Section */}
                <div className="px-6 pb-12">
                  <h2 className="text-2xl font-bold text-slate-900 mb-8">🎯 Service Performance Breakdown</h2>
                  <div className="backdrop-blur-xl bg-white/40 rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                      {serviceBreakdown.map((service, idx) => (
                        <div key={idx} className="backdrop-blur-lg bg-white/60 rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all">
                          <h3 className="font-bold text-slate-900 text-sm mb-3 truncate">{service.service}</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-600">Total Bookings:</span>
                              <span className="font-bold text-slate-900">{service.count}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-600">Revenue:</span>
                              <span className="font-bold text-green-600">${service.revenue.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                                style={{width: `${Math.min(100, (service.revenue / (metrics.totalRevenue || 1)) * 100)}%`}}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedBookings.length > 0 && (
                  <div className="px-6 pb-4">
                    <div className="backdrop-blur-xl bg-yellow-50/80 rounded-2xl border border-yellow-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-slate-900">
                            {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''} selected
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => bulkUpdateStatus('Confirmed')}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                            >
                              <FaCheck /> Confirm Selected
                            </button>
                            <button
                              onClick={() => bulkUpdateStatus('Complete')}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                            >
                              <FaCheck /> Complete Selected
                            </button>
                            <button
                              onClick={() => bulkUpdateStatus('Rejected')}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                            >
                              <FaTimes /> Reject Selected
                            </button>
                            <button
                              onClick={bulkDeleteBookings}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                            >
                              <FaTrash /> Delete Selected
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedBookings([])}
                          className="text-slate-600 hover:text-slate-900 text-lg"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bookings Table */}
                <div className="px-6 pb-12">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">📋 Booking Management</h2>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleSelectAllBookings}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                      >
                        {selectedBookings.length === filteredBookings.length && filteredBookings.length > 0 ? <FaCheckSquare /> : <FaSquare />}
                        {selectedBookings.length === filteredBookings.length && filteredBookings.length > 0 ? 'Deselect All' : 'Select All'}
                      </button>
                      <span className="text-sm text-slate-600 bg-white/60 px-4 py-2 rounded-lg">
                        Showing {filteredBookings.length} of {bookings.length} bookings
                      </span>
                    </div>
                  </div>
                  {filteredBookings.length === 0 ? (
                    <div className="backdrop-blur-xl bg-white/40 rounded-2xl border border-gray-200 p-12 text-center">
                      <p className="text-slate-600 text-lg">No bookings found.</p>
                    </div>
                  ) : (
                    <div className="backdrop-blur-xl bg-white/40 rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-white/60 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">
                                <input
                                  type="checkbox"
                                  checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                                  onChange={handleSelectAllBookings}
                                  className="rounded border-gray-300"
                                />
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Client</th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Service</th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Date & Time</th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Price</th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Status</th>
                              <th className="px-6 py-4 text-center text-sm font-bold text-slate-900">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filteredBookings.map((booking) => (
                              <tr key={booking.id} className="hover:bg-white/50 transition-colors">
                                <td className="px-6 py-4">
                                  <input
                                    type="checkbox"
                                    checked={selectedBookings.includes(booking.id)}
                                    onChange={() => handleSelectBooking(booking.id)}
                                    className="rounded border-gray-300"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="font-semibold text-slate-900">{booking.user_name}</p>
                                    <p className="text-xs text-slate-600">{booking.user_email}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-slate-800 font-medium">{booking.service}</td>
                                <td className="px-6 py-4 text-slate-800">
                                  <p>{booking.date}</p>
                                  <p className="text-xs text-slate-600">{booking.time}</p>
                                </td>
                                <td className="px-6 py-4 font-semibold text-slate-900">{booking.price}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${
                                    booking.status === 'Confirmed'
                                      ? 'bg-green-100/80 text-green-700 border-green-300'
                                      : booking.status === 'Complete'
                                      ? 'bg-blue-100/80 text-blue-700 border-blue-300'
                                      : booking.status === 'Rejected'
                                      ? 'bg-red-100/80 text-red-700 border-red-300'
                                      : 'bg-yellow-100/80 text-yellow-700 border-yellow-300'
                                  }`}>
                                    {booking.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => setSelectedBooking(booking)}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-4 rounded-lg text-sm font-semibold inline-flex items-center gap-2 backdrop-blur-md border border-blue-300 hover:border-blue-400 transition-all hover:shadow-lg"
                                  >
                                    <FaEye /> View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'customers' && (
              <div className="px-6 py-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-8">👥 Customer Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customers.map((customer) => (
                    <div key={customer.id} className="backdrop-blur-xl bg-white/40 rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {customer.first_name?.[0]}{customer.surname?.[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{customer.first_name} {customer.surname}</h3>
                          <p className="text-sm text-slate-600">{customer.email}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Total Bookings:</span>
                          <span className="font-semibold text-slate-900">{customer.totalBookings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Confirmed:</span>
                          <span className="font-semibold text-green-600">{customer.confirmedBookings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Total Spent:</span>
                          <span className="font-semibold text-blue-600">${customer.totalSpent.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'staff' && (
              <div className="px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">🧑‍🔧 Staff Management</h2>
                  <button
                    onClick={fetchManagedStaff}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <FaSync /> Refresh Staff
                  </button>
                </div>

                {loadingManagedStaff ? (
                  <div className="rounded-2xl border border-gray-200 bg-white/70 p-8 text-slate-600">Loading staff accounts...</div>
                ) : managedStaff.length === 0 ? (
                  <div className="rounded-2xl border border-gray-200 bg-white/70 p-8 text-slate-600">No staff accounts found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {managedStaff.map((staff) => (
                      <div key={staff.id} className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{staff.first_name} {staff.surname}</h3>
                            <p className="text-sm text-slate-600">{staff.email}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${staff.isDisabled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {staff.isDisabled ? 'Disabled' : 'Enabled'}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-slate-600">
                          <p>Phone: {staff.phone || 'Not provided'}</p>
                          <p>Location: {staff.location || 'Not provided'}</p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {staff.isDisabled ? (
                            <button
                              onClick={() =>
                                showConfirmDialog(
                                  `Enable ${staff.first_name} ${staff.surname}'s account?`,
                                  () => updateStaffAccount(staff, 'enable'),
                                  'Enable staff account',
                                  'Enable account'
                                )
                              }
                              disabled={staffActionInProgressId === staff.id}
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-300"
                            >
                              Enable Account
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                showConfirmDialog(
                                  `Disable ${staff.first_name} ${staff.surname}'s account?`,
                                  () => updateStaffAccount(staff, 'disable'),
                                  'Disable staff account',
                                  'Disable account'
                                )
                              }
                              disabled={staffActionInProgressId === staff.id}
                              className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:bg-amber-300"
                            >
                              Disable Account
                            </button>
                          )}

                          <button
                            onClick={() => deleteStaffAccount(staff)}
                            disabled={staffActionInProgressId === staff.id}
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-red-300"
                          >
                            Delete Staff
                          </button>
                        </div>

                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Reset Password</p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="password"
                              placeholder="New password (min 8 chars)"
                              value={staffPasswordDrafts[staff.id] || ''}
                              onChange={(e) =>
                                setStaffPasswordDrafts((prev) => ({
                                  ...prev,
                                  [staff.id]: e.target.value,
                                }))
                              }
                              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => updateStaffAccount(staff, 'reset-password')}
                              disabled={staffActionInProgressId === staff.id}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                            >
                              Update Password
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Staff Member */}
                <div className="mt-10 bg-white/80 p-6 rounded-2xl shadow-lg border border-emerald-200">
                  <h3 className="text-xl font-semibold mb-2 text-black">Add Staff Member</h3>
                  <p className="text-sm text-slate-600 mb-4">Create a staff account so they can log in and see assigned jobs.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First name"
                      value={newStaffForm.firstName}
                      onChange={(e) => setNewStaffForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="Surname"
                      value={newStaffForm.surname}
                      onChange={(e) => setNewStaffForm((prev) => ({ ...prev, surname: e.target.value }))}
                      className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
                    />
                    <input
                      type="email"
                      placeholder="Staff email"
                      value={newStaffForm.email}
                      onChange={(e) => setNewStaffForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
                    />
                    <input
                      type="password"
                      placeholder="Temporary password (min 8 chars)"
                      value={newStaffForm.password}
                      onChange={(e) => setNewStaffForm((prev) => ({ ...prev, password: e.target.value }))}
                      className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
                    />
                    <PhoneInputWithCountry
                      value={newStaffForm.phone}
                      onChange={(phoneValue) => setNewStaffForm((prev) => ({ ...prev, phone: phoneValue }))}
                      placeholder="771234567"
                      className="md:col-span-1"
                      selectClassName="w-44 px-2 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      inputClassName="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Location (optional)"
                      value={newStaffForm.location}
                      onChange={(e) => setNewStaffForm((prev) => ({ ...prev, location: e.target.value }))}
                      className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900"
                    />
                  </div>
                  <button
                    onClick={createStaffMember}
                    disabled={creatingStaff}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white px-6 py-2 rounded-lg font-semibold"
                  >
                    {creatingStaff ? 'Creating Staff...' : 'Create Staff Account'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="px-6 py-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-8">📝 Activity Log</h2>
                <div className="backdrop-blur-xl bg-white/40 rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                  <div className="max-h-96 overflow-y-auto">
                    {activityLog.length === 0 ? (
                      <div className="p-8 text-center text-slate-600">No activity recorded yet.</div>
                    ) : (
                      activityLog.map((activity, idx) => (
                        <div key={idx} className="p-4 border-b border-gray-200 hover:bg-white/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <FaHistory className="text-blue-600 text-sm" />
                            </div>
                            <div className="flex-1">
                              <p className="text-slate-900 font-medium">{activity.action}</p>
                              <p className="text-sm text-slate-600">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'services' && (
              <div className="px-6 py-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-8">🛠️ Service Management</h2>
                <div className="mb-10 bg-white/80 p-6 rounded-2xl shadow-lg border border-gray-200">
                  <h3 className="text-xl font-semibold mb-4 text-black">
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <input
                        type="text"
                        placeholder="Service title"
                        value={newServiceTitle}
                        onChange={(e) => setNewServiceTitle(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                      <input
                        type="text"
                        placeholder="Price (e.g. R500)"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    <textarea
                      placeholder="Description (e.g. Optimize your network for maximum speed and reliability...)"
                      value={newServiceDescription}
                      onChange={(e) => setNewServiceDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 resize-none"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Features</p>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Add a feature (e.g. Network analysis)"
                          value={newFeatureInput}
                          onChange={(e) => setNewFeatureInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const v = newFeatureInput.trim();
                              if (v) { setNewServiceFeatures(prev => [...prev, v]); setNewFeatureInput(''); }
                            }
                          }}
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const v = newFeatureInput.trim();
                            if (v) { setNewServiceFeatures(prev => [...prev, v]); setNewFeatureInput(''); }
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                        >
                          + Add
                        </button>
                      </div>
                      {newServiceFeatures.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {newServiceFeatures.map((f, i) => (
                            <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-sm">
                              {f}
                              <button
                                type="button"
                                onClick={() => setNewServiceFeatures(prev => prev.filter((_, idx) => idx !== i))}
                                className="ml-1 text-blue-400 hover:text-red-500 font-bold leading-none"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Card Gradient Colour</p>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { label: 'Blue',        value: 'linear-gradient(135deg, #60a5fa, #2563eb)' },
                          { label: 'Purple',      value: 'linear-gradient(135deg, #a78bfa, #7c3aed)' },
                          { label: 'Red',         value: 'linear-gradient(135deg, #f87171, #dc2626)' },
                          { label: 'Green',       value: 'linear-gradient(135deg, #4ade80, #16a34a)' },
                          { label: 'Orange',      value: 'linear-gradient(135deg, #fb923c, #ea580c)' },
                          { label: 'Yellow',      value: 'linear-gradient(135deg, #fbbf24, #d97706)' },
                          { label: 'Pink',        value: 'linear-gradient(135deg, #f472b6, #db2777)' },
                          { label: 'Teal',        value: 'linear-gradient(135deg, #2dd4bf, #0d9488)' },
                          { label: 'Indigo',      value: 'linear-gradient(135deg, #818cf8, #4338ca)' },
                          { label: 'Dark Blue',   value: 'linear-gradient(135deg, #3b82f6, #1e3a8a)' },
                          { label: 'Slate',       value: 'linear-gradient(135deg, #94a3b8, #334155)' },
                          { label: 'Rose Gold',   value: 'linear-gradient(135deg, #fda4af, #e11d48)' },
                        ].map((g) => (
                          <button
                            key={g.value}
                            type="button"
                            title={g.label}
                            onClick={() => setNewServiceGradient(g.value)}
                            style={{ background: g.value }}
                            className={`w-10 h-10 rounded-full border-4 transition-all ${
                              newServiceGradient === g.value
                                ? 'border-slate-900 scale-110 shadow-lg'
                                : 'border-transparent hover:border-slate-400'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <div
                          style={{ background: newServiceGradient }}
                          className="w-32 h-10 rounded-lg shadow-inner"
                        />
                        <span className="text-sm text-gray-500">Preview</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Service Image <span className="font-normal text-gray-400">(optional — overrides gradient on card)</span></p>
                      <div className="flex items-start gap-4">
                          <input
                            ref={serviceImageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNewServiceImageFile(file);
                                setNewServiceImagePreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => serviceImageInputRef.current?.click()}
                            className="flex flex-col items-center justify-center w-36 h-24 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors bg-white text-center cursor-pointer"
                          >
                            <span className="text-2xl text-gray-400 mb-1">📷</span>
                            <span className="text-xs text-gray-400 px-2">{newServiceImagePreview ? 'Change image' : 'Upload image'}</span>
                          </button>
                        {newServiceImagePreview && (
                          <div className="relative">
                            <img src={newServiceImagePreview} alt="Preview" className="w-36 h-24 object-cover rounded-xl border border-gray-200 shadow-sm" />
                            <button
                              type="button"
                                onClick={() => {
                                  setNewServiceImageFile(null);
                                  setNewServiceImagePreview('');
                                  if (serviceImageInputRef.current) serviceImageInputRef.current.value = '';
                                }}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={addService}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold"
                      >
                        {editingService ? 'Save Changes' : 'Add Service'}
                      </button>
                      {editingService && (
                        <button
                          onClick={() => {
                            setEditingService(null);
                            setNewServiceTitle('');
                            setNewServicePrice('');
                            setNewServiceDescription('');
                            setNewServiceFeatures([]);
                            setNewFeatureInput('');
                            setNewServiceGradient('linear-gradient(135deg, #60a5fa, #2563eb)');
                            setNewServiceImageFile(null);
                            setNewServiceImagePreview('');
                          }}
                          className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 p-6 rounded-2xl shadow-lg border border-gray-200">
                  <h3 className="text-xl font-semibold mb-4 text-black">Existing Services</h3>
                  {services.length === 0 ? (
                    <p className="text-black">No services available.</p>
                  ) : (
                    <ul className="space-y-3">
                      {services.map((svc) => (
                        <li key={svc.id} className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                          <div className="flex items-center gap-3">
                            {svc.image_url
                              ? <img src={svc.image_url} alt={svc.title} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                              : <div style={{ background: svc.image || 'linear-gradient(135deg, #60a5fa, #2563eb)' }} className="w-8 h-8 rounded-full flex-shrink-0" />
                            }
                            <div>
                              <span className="font-medium text-black">{svc.title} - {svc.price}</span>
                              <p className="text-xs text-slate-500 mt-1">
                                {serviceRatings[svc.title]
                                  ? `★ ${serviceRatings[svc.title].avg.toFixed(1)} from ${serviceRatings[svc.title].count} review${serviceRatings[svc.title].count !== 1 ? 's' : ''}`
                                  : 'No reviews yet'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setEditingService(svc);
                                setNewServiceTitle(svc.title);
                                setNewServicePrice(svc.price);
                                setNewServiceDescription(svc.description || '');
                                setNewServiceFeatures(Array.isArray(svc.features) ? svc.features : []);
                                setNewFeatureInput('');
                                setNewServiceGradient(svc.image || 'linear-gradient(135deg, #60a5fa, #2563eb)');
                                setNewServiceImageFile(null);
                                setNewServiceImagePreview(svc.image_url || '');
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <FaCog />
                            </button>
                            <button
                              onClick={() => deleteService(svc.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* ─── Availability / Blocked Dates ─── */}
                <div className="mt-10 bg-white/80 p-6 rounded-2xl shadow-lg border border-gray-200">
                  <h3 className="text-xl font-semibold mb-1 text-black">Availability Management</h3>
                  <p className="text-sm text-slate-500 mb-5">Block specific dates so customers cannot book on those days.</p>

                  {/* Add date form */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <input
                      type="date"
                      value={newBlockedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setNewBlockedDate(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="Reason (optional, e.g. Public holiday)"
                      value={newBlockedReason}
                      onChange={(e) => setNewBlockedReason(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
                    />
                    <button
                      onClick={addBlockedDate}
                      disabled={!newBlockedDate}
                      className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg font-semibold whitespace-nowrap transition"
                    >
                      Block Date
                    </button>
                  </div>

                  {/* Blocked dates list */}
                  {blockedDates.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No dates are currently blocked. All dates are available for booking.</p>
                  ) : (
                    <ul className="space-y-2">
                      {blockedDates.map((bd) => (
                        <li key={bd.id} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                          <div>
                            <span className="font-bold text-red-700">{bd.date}</span>
                            {bd.reason && <span className="ml-3 text-sm text-slate-500">— {bd.reason}</span>}
                          </div>
                          <button
                            onClick={() => removeBlockedDate(bd.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-bold"
                            title="Unblock this date"
                          >
                            <FaTrash size={13} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
                <div className="backdrop-blur-2xl bg-gradient-to-br from-white/90 to-white/80 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200">
                  <div className="bg-gradient-to-r from-white/60 to-white/40 border-b border-gray-200 px-8 py-6 rounded-t-3xl flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="text-slate-600 hover:text-slate-900 text-2xl transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="px-8 py-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Notification Preferences</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span className="text-sm text-slate-700">New booking alerts</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span className="text-sm text-slate-700">Status change notifications</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">Auto-refresh Interval</label>
                      <select className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black">
                        <option value="30">30 seconds</option>
                        <option value="60">1 minute</option>
                        <option value="300">5 minutes</option>
                        <option value="0">Manual only</option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        addNotification('Settings saved successfully!', 'success');
                        setShowSettings(false);
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold transition-all"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Detail Modal */}
            {selectedBooking && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
                <div className="backdrop-blur-2xl bg-gradient-to-br from-white/90 to-white/80 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-white/60 to-white/40 border-b border-gray-200 px-8 py-8 sticky top-0 flex items-center justify-between rounded-t-3xl">
                    <h2 className="text-2xl font-bold text-slate-900">Booking Details</h2>
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="text-slate-600 hover:text-slate-900 text-2xl transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="px-8 py-8">
                    <div className="space-y-6">
                      {/* Client Info */}
                      <div>
                        <h3 className="font-bold text-slate-900 mb-4">Client Information</h3>
                        <div className="backdrop-blur-lg bg-white/50 rounded-2xl p-6 border border-gray-200 space-y-3">
                          <p className="text-sm">
                            <span className="font-semibold text-slate-900">Name:</span> <span className="text-slate-700">{selectedBooking.user_name}</span>
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold text-slate-900">Email:</span> <span className="text-slate-700">{selectedBooking.user_email}</span>
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold text-slate-900">User ID:</span> <span className="text-slate-700">{selectedBooking.user_id}</span>
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold text-slate-900">Address:</span> <span className="text-slate-700">{selectedBooking.location || selectedBooking.user_location || 'Not provided'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Service Info */}
                      <div>
                        <h3 className="font-bold text-slate-900 mb-4">Service Details</h3>
                        <div className="backdrop-blur-lg bg-white/50 rounded-2xl p-6 border border-gray-200 space-y-3">
                          <p className="text-sm">
                            <span className="font-semibold text-slate-900">Service:</span> <span className="text-slate-700">{selectedBooking.service}</span>
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold text-slate-900">Date:</span> <span className="text-slate-700">{selectedBooking.date}</span>
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold text-slate-900">Time:</span> <span className="text-slate-700">{selectedBooking.time}</span>
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold text-slate-900">Price:</span> <span className="text-slate-700">{selectedBooking.price}</span>
                          </p>
                          <button
                            onClick={() => downloadInvoicePDF(selectedBooking)}
                            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-all"
                          >
                            <FaDownload /> Download Invoice
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      {selectedBooking.description && (
                        <div>
                          <h3 className="font-bold text-slate-900 mb-4">Description</h3>
                          <div className="backdrop-blur-lg bg-white/50 rounded-2xl p-6 border border-gray-200">
                            <p className="text-sm text-slate-700">{selectedBooking.description}</p>
                          </div>
                        </div>
                      )}

                      {/* Status */}
                      <div>
                        <h3 className="font-bold text-slate-900 mb-4">Current Status</h3>
                        <div className="backdrop-blur-lg bg-white/50 rounded-2xl p-6 border border-gray-200">
                          <span className={`inline-block px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-md border ${
                            selectedBooking.status === 'Confirmed' 
                              ? 'bg-green-100/80 text-green-700 border-green-300'
                              : selectedBooking.status === 'Complete'
                              ? 'bg-blue-100/80 text-blue-700 border-blue-300'
                              : selectedBooking.status === 'Rejected'
                              ? 'bg-red-100/80 text-red-700 border-red-300'
                              : 'bg-yellow-100/80 text-yellow-700 border-yellow-300'
                          }`}>
                            {selectedBooking.status}
                          </span>
                        </div>
                      </div>

                      {/* Staff Assignment */}
                      <div className="backdrop-blur-lg bg-white/50 rounded-2xl p-6 border border-gray-200">
                        <h3 className="font-bold text-slate-900 mb-4">Assign Staff</h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <select
                            value={staffToAssign}
                            onChange={(e) => setStaffToAssign(e.target.value)}
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          >
                            <option value="">Unassigned</option>
                            {staffMembers.map((staff) => (
                              <option key={staff.id} value={staff.id}>
                                {staff.first_name} {staff.surname} ({staff.email})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={assignStaffToBooking}
                            disabled={assigningStaff}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold"
                          >
                            {assigningStaff ? 'Saving...' : 'Save Assignment'}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Current: {selectedBooking.staff_name || 'No staff assigned'}
                        </p>
                        {(selectedBooking.staff_acknowledged_at || selectedBooking.staff_notes || selectedBooking.staff_completion_report) && (
                          <div className="mt-4 space-y-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                            <p className="text-sm font-semibold text-slate-900">Staff Progress</p>
                            {selectedBooking.staff_acknowledged_at && (
                              <p className="text-xs text-emerald-700">
                                Acknowledged: {new Date(selectedBooking.staff_acknowledged_at).toLocaleString()}
                              </p>
                            )}
                            {selectedBooking.staff_notes && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Staff Notes</p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedBooking.staff_notes}</p>
                              </div>
                            )}
                            {selectedBooking.staff_completion_report && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Completion Report</p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedBooking.staff_completion_report}</p>
                                {selectedBooking.staff_completed_at && (
                                  <p className="text-xs text-emerald-700 mt-2">
                                    Completed: {new Date(selectedBooking.staff_completed_at).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="backdrop-blur-lg bg-white/50 rounded-2xl p-6 border border-gray-200">
                        <p className="text-sm font-semibold text-slate-900 mb-4">Update Booking Status</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => updateBookingStatus(selectedBooking.id, 'Confirmed')}
                            disabled={selectedBooking.status === 'Confirmed'}
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-all backdrop-blur-md border border-green-300 hover:border-green-400 disabled:border-gray-300"
                          >
                            <FaCheck /> Confirm
                          </button>
                          <button
                            onClick={() => updateBookingStatus(selectedBooking.id, 'Rejected')}
                            disabled={selectedBooking.status === 'Rejected'}
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-all backdrop-blur-md border border-red-300 hover:border-red-400 disabled:border-gray-300"
                          >
                            <FaTimes /> Reject
                          </button>
                          <button
                            onClick={() => { setSelectedBooking(null); setCustomMessage(''); }}
                            className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white py-3 px-4 rounded-xl font-semibold transition-all backdrop-blur-md border border-gray-300 hover:border-gray-400"
                          >
                            Close
                          </button>
                        </div>
                      </div>

                      {/* Customer Messaging */}
                      <div className="backdrop-blur-lg bg-white/50 rounded-2xl p-6 border border-gray-200">
                        <p className="text-sm font-semibold text-slate-900 mb-1">Send Message to Customer</p>
                        <p className="text-xs text-slate-400 mb-3">An email will be sent directly to {selectedBooking.user_email}.</p>
                        <div className="flex justify-end mb-3">
                          <button
                            onClick={generateAiMessageDraft}
                            disabled={isDraftingMessage}
                            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-xs font-semibold transition-all"
                          >
                            {isDraftingMessage ? 'Generating draft...' : 'Generate AI Draft'}
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="Type a custom message, e.g. instructions, rescheduling notes, follow-up…"
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                        />
                        <button
                          onClick={sendCustomMessage}
                          disabled={sendingMessage || !customMessage.trim()}
                          className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                        >
                          {sendingMessage ? 'Sending…' : '✉ Send Message'}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
          </div>
        </>
      )}

      <AppAlertDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        variant={dialog.variant}
        confirmLabel={dialog.confirmLabel || (dialog.variant === 'confirm' ? 'Yes, continue' : 'OK')}
        onConfirm={() => {
          const action = dialog.onConfirm;
          setDialog((prev) => ({ ...prev, isOpen: false }));
          if (action) {
            void action();
          }
        }}
        onCancel={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminDashboard;
