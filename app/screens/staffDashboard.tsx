"use client";

import React, { useEffect, useState, useRef } from 'react';
import supabase from '@/app/lib/supabaseClient';
import {
  FaSync,
  FaClipboardList,
  FaCheckCircle,
  FaUser,
  FaTools,
  FaFileAlt,
  FaClock,
  FaSearch,
  FaTimes,
  FaStickyNote,
  FaExclamationCircle,
  FaCalendarAlt,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCommentDots,
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
} from 'react-icons/fa';

interface StaffDashboardProps {
  onLogout: () => void;
}

type StaffJob = {
  id: number;
  service: string;
  date: string;
  time: string;
  status: string;
  description?: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_location?: string;
  location?: string;
  staff_acknowledged_at?: string | null;
  staff_notes?: string | null;
  staff_completion_report?: string | null;
  staff_completed_at?: string | null;
};

type StaffProfile = {
  id: string;
  email: string;
  first_name: string;
  surname: string;
  phone?: string;
  role: string;
};

type StaffAvailabilitySlot = {
  id: number;
  staff_id: string;
  unavailable_date: string;
  start_time?: string | null;
  end_time?: string | null;
  note?: string | null;
};

type BookingChecklistItem = {
  id: number;
  booking_id: number;
  item_text: string;
  item_order: number;
  is_completed: boolean;
  completed_at?: string | null;
};

type BookingStaffChatMessage = {
  id: number;
  booking_id: number;
  sender_id: string;
  sender_role: 'admin' | 'staff';
  message: string;
  created_at: string;
};

type TabType = 'active' | 'completed' | 'calendar' | 'profile';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Complete: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
};

const hasMissingColumnError = (error: unknown, columnName: string) => {
  const message = error && typeof error === 'object' && 'message' in error
    ? String((error as { message?: string }).message || '')
    : '';

  return message.toLowerCase().includes(columnName.toLowerCase()) && message.toLowerCase().includes('does not exist');
};

const StaffDashboard = ({ onLogout }: StaffDashboardProps) => {
  const [jobs, setJobs] = useState<StaffJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [staffUserId, setStaffUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [selectedJob, setSelectedJob] = useState<StaffJob | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [completingJob, setCompletingJob] = useState<StaffJob | null>(null);
  const [completionReport, setCompletionReport] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [weekAnchorDate, setWeekAnchorDate] = useState(new Date());
  const [availability, setAvailability] = useState<StaffAvailabilitySlot[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [newUnavailableDate, setNewUnavailableDate] = useState('');
  const [newUnavailableStart, setNewUnavailableStart] = useState('');
  const [newUnavailableEnd, setNewUnavailableEnd] = useState('');
  const [newUnavailableNote, setNewUnavailableNote] = useState('');
  const [checklistByBooking, setChecklistByBooking] = useState<Record<number, BookingChecklistItem[]>>({});
  const [chatByBooking, setChatByBooking] = useState<Record<number, BookingStaffChatMessage[]>>({});
  const [chatDraftByBooking, setChatDraftByBooking] = useState<Record<number, string>>({});
  const [chatSendingForBookingId, setChatSendingForBookingId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const addNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 9)]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getWeekStart = (rawDate: Date) => {
    const date = new Date(rawDate);
    const day = date.getDay();
    const diff = (day + 6) % 7;
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const addDays = (rawDate: Date, days: number) => {
    const date = new Date(rawDate);
    date.setDate(date.getDate() + days);
    return date;
  };

  const formatDateKey = (rawDate: Date) => {
    const year = rawDate.getFullYear();
    const month = String(rawDate.getMonth() + 1).padStart(2, '0');
    const day = String(rawDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizeBookingDate = (rawDate: string) => {
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime())) {
      return formatDateKey(parsed);
    }

    const matched = String(rawDate || '').match(/(\d{4}-\d{2}-\d{2})/);
    return matched ? matched[1] : String(rawDate || '');
  };

  const normalizeTime = (rawTime: string) => {
    const value = String(rawTime || '').trim().toUpperCase();
    const twelveHour = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (twelveHour) {
      let hour = Number(twelveHour[1]);
      const minute = Number(twelveHour[2]);
      const meridiem = twelveHour[3];
      if (meridiem === 'PM' && hour < 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;
      return hour * 60 + minute;
    }

    const twentyFour = value.match(/^(\d{1,2}):(\d{2})$/);
    if (twentyFour) {
      return Number(twentyFour[1]) * 60 + Number(twentyFour[2]);
    }

    return null;
  };

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        onLogout();
        return;
      }

      setStaffUserId(user.id);

      let bookings: any[] | null = null;

      const primaryResult = await supabase
        .from('bookings')
        .select(
          'id, service, date, time, status, description, location, user_id, staff_acknowledged_at, staff_notes, staff_completion_report, staff_completed_at'
        )
        .eq('assigned_staff_id', user.id)
        .order('date', { ascending: true });

      if (primaryResult.error) {
        const missingCompletionColumns =
          hasMissingColumnError(primaryResult.error, 'staff_completion_report') ||
          hasMissingColumnError(primaryResult.error, 'staff_completed_at');

        if (!missingCompletionColumns) {
          throw primaryResult.error;
        }

        const fallbackResult = await supabase
          .from('bookings')
          .select('id, service, date, time, status, description, location, user_id, staff_acknowledged_at, staff_notes')
          .eq('assigned_staff_id', user.id)
          .order('date', { ascending: true });

        if (fallbackResult.error) {
          throw fallbackResult.error;
        }

        bookings = (fallbackResult.data || []).map((job: any) => ({
          ...job,
          staff_completion_report: null,
          staff_completed_at: null,
        }));
        setError('Staff report columns are not in the database yet. Run the latest staff SQL migration to enable job reports.');
      } else {
        bookings = primaryResult.data || [];
      }

      const withNames = await Promise.all(
        (bookings || []).map(async (job: any) => {
          let profileData: { first_name?: string; surname?: string; email?: string; phone?: string; location?: string } | null = null;

          try {
            const profileResult = await supabase
              .from('profiles')
              .select('first_name, surname, email, phone, location')
              .eq('id', job.user_id)
              .single();

            if (profileResult.error) {
              const fallbackProfileResult = await supabase
                .from('profiles')
                .select('first_name, surname, phone, location')
                .eq('id', job.user_id)
                .single();

              if (!fallbackProfileResult.error) {
                profileData = fallbackProfileResult.data;
              }
            } else {
              profileData = profileResult.data;
            }
          } catch {
            profileData = null;
          }

          return {
            ...job,
            user_name: profileData ? `${profileData.first_name} ${profileData.surname}` : 'Client',
            user_email: profileData?.email ?? '',
            user_phone: profileData?.phone ?? '',
            user_location: profileData?.location ?? '',
          } as StaffJob;
        })
      );

      setJobs(withNames);
    } catch (e: any) {
      console.error('Error fetching staff jobs:', e);
      setError(e?.message || 'Failed to load assigned jobs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const primaryResult = await supabase
      .from('profiles')
      .select('id, email, first_name, surname, phone, role')
      .eq('id', user.id)
      .single();

    if (primaryResult.data) {
      setProfile(primaryResult.data as StaffProfile);
      return;
    }

    const fallbackResult = await supabase
      .from('profiles')
      .select('id, first_name, surname, phone, role')
      .eq('id', user.id)
      .single();

    if (fallbackResult.data) {
      setProfile({
        ...(fallbackResult.data as Omit<StaffProfile, 'email'>),
        email: user.email || '',
      });
    }
  };

  const fetchAvailability = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setLoadingAvailability(true);
    const { data, error: availabilityError } = await supabase
      .from('staff_unavailability')
      .select('id, staff_id, unavailable_date, start_time, end_time, note')
      .eq('staff_id', user.id)
      .order('unavailable_date', { ascending: true });

    setLoadingAvailability(false);

    if (availabilityError) {
      if (!hasMissingColumnError(availabilityError, 'staff_unavailability')) {
        setError(availabilityError.message || 'Could not load availability.');
      }
      return;
    }

    setAvailability((data || []) as StaffAvailabilitySlot[]);
  };

  const addUnavailabilitySlot = async () => {
    if (!staffUserId || !newUnavailableDate) {
      setError('Select an unavailable date before saving.');
      return;
    }

    if (newUnavailableStart && newUnavailableEnd && newUnavailableStart >= newUnavailableEnd) {
      setError('End time must be later than start time.');
      return;
    }

    setError(null);
    const payload = {
      staff_id: staffUserId,
      unavailable_date: newUnavailableDate,
      start_time: newUnavailableStart || null,
      end_time: newUnavailableEnd || null,
      note: newUnavailableNote.trim(),
    };

    const { error: insertError } = await supabase.from('staff_unavailability').insert([payload]);
    if (insertError) {
      setError(insertError.message || 'Could not save availability slot.');
      return;
    }

    setNewUnavailableDate('');
    setNewUnavailableStart('');
    setNewUnavailableEnd('');
    setNewUnavailableNote('');
    fetchAvailability();
  };

  const removeUnavailabilitySlot = async (id: number) => {
    const { error: deleteError } = await supabase.from('staff_unavailability').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message || 'Could not remove availability slot.');
      return;
    }

    setAvailability((prev) => prev.filter((slot) => slot.id !== id));
  };

  const findTemplateItemsForService = async (serviceName: string) => {
    const { data, error: templateError } = await supabase
      .from('checklist_templates')
      .select('service_name, checklist_items');

    if (templateError) {
      return [] as string[];
    }

    const matched = (data || []).find(
      (row: any) => String(row.service_name || '').trim().toLowerCase() === String(serviceName || '').trim().toLowerCase()
    );

    if (!matched || !Array.isArray(matched.checklist_items)) {
      return [] as string[];
    }

    return matched.checklist_items
      .map((item: unknown) => String(item || '').trim())
      .filter((item: string) => !!item);
  };

  const fetchChecklistForJob = async (job: StaffJob) => {
    const { data: existingItems, error: existingError } = await supabase
      .from('booking_checklist_items')
      .select('id, booking_id, item_text, item_order, is_completed, completed_at')
      .eq('booking_id', job.id)
      .order('item_order', { ascending: true });

    if (existingError) {
      return;
    }

    let nextItems = (existingItems || []) as BookingChecklistItem[];

    if (nextItems.length === 0) {
      const templateItems = await findTemplateItemsForService(job.service);
      if (templateItems.length > 0) {
        const rows = templateItems.map((itemText, idx) => ({
          booking_id: job.id,
          item_text: itemText,
          item_order: idx,
        }));

        await supabase.from('booking_checklist_items').insert(rows);

        const { data: seededItems } = await supabase
          .from('booking_checklist_items')
          .select('id, booking_id, item_text, item_order, is_completed, completed_at')
          .eq('booking_id', job.id)
          .order('item_order', { ascending: true });

        nextItems = (seededItems || []) as BookingChecklistItem[];
      }
    }

    setChecklistByBooking((prev) => ({ ...prev, [job.id]: nextItems }));
  };

  const toggleChecklistItem = async (jobId: number, item: BookingChecklistItem, isCompleted: boolean) => {
    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('booking_checklist_items')
      .update({
        is_completed: isCompleted,
        completed_at: isCompleted ? nowIso : null,
        completed_by: isCompleted ? staffUserId : null,
      })
      .eq('id', item.id);

    if (updateError) {
      setError(updateError.message || 'Could not update checklist item.');
      return;
    }

    setChecklistByBooking((prev) => ({
      ...prev,
      [jobId]: (prev[jobId] || []).map((row) =>
        row.id === item.id
          ? { ...row, is_completed: isCompleted, completed_at: isCompleted ? nowIso : null }
          : row
      ),
    }));
  };

  const fetchChatForJob = async (bookingId: number) => {
    const { data, error: chatError } = await supabase
      .from('booking_staff_chat_messages')
      .select('id, booking_id, sender_id, sender_role, message, created_at')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (chatError) {
      return;
    }

    setChatByBooking((prev) => ({
      ...prev,
      [bookingId]: (data || []) as BookingStaffChatMessage[],
    }));
  };

  const sendChatMessage = async (bookingId: number) => {
    const draft = String(chatDraftByBooking[bookingId] || '').trim();
    if (!draft || !staffUserId) return;

    setChatSendingForBookingId(bookingId);

    const { error: insertError } = await supabase
      .from('booking_staff_chat_messages')
      .insert([
        {
          booking_id: bookingId,
          sender_id: staffUserId,
          sender_role: 'staff',
          message: draft,
        },
      ]);

    setChatSendingForBookingId(null);

    if (insertError) {
      setError(insertError.message || 'Could not send message.');
      return;
    }

    setChatDraftByBooking((prev) => ({ ...prev, [bookingId]: '' }));
    fetchChatForJob(bookingId);
  };

  const acknowledgeJob = async (jobId: number) => {
    const timestamp = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ staff_acknowledged_at: timestamp })
      .eq('id', jobId);

    if (updateError) {
      setError(updateError.message || 'Could not acknowledge job.');
      return;
    }

    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, staff_acknowledged_at: timestamp } : job
      )
    );

    setSelectedJob((prev) =>
      prev && prev.id === jobId ? { ...prev, staff_acknowledged_at: timestamp } : prev
    );
  };

  const saveNotes = async () => {
    if (!selectedJob) {
      return;
    }

    setSavingNotes(true);

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ staff_notes: notesDraft.trim() || null })
      .eq('id', selectedJob.id);

    setSavingNotes(false);

    if (updateError) {
      setError(updateError.message || 'Could not save notes.');
      return;
    }

    setJobs((prev) =>
      prev.map((job) =>
        job.id === selectedJob.id ? { ...job, staff_notes: notesDraft.trim() || null } : job
      )
    );

    setSelectedJob((prev) =>
      prev ? { ...prev, staff_notes: notesDraft.trim() || null } : prev
    );
  };

  const submitCompletionReport = async () => {
    if (!completingJob) {
      return;
    }

    if (!completionReport.trim()) {
      setReportError('Please write a completion report before submitting.');
      return;
    }

    const checklistItems = checklistByBooking[completingJob.id] || [];
    if (checklistItems.length > 0 && checklistItems.some((item) => !item.is_completed)) {
      setReportError('Complete all checklist items before marking this job as complete.');
      return;
    }

    setSubmittingReport(true);
    setReportError(null);

    const completedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'Complete',
        staff_completed_at: completedAt,
        staff_completion_report: completionReport.trim(),
      })
      .eq('id', completingJob.id);

    setSubmittingReport(false);

    if (updateError) {
      setReportError(updateError.message || 'Could not complete job.');
      return;
    }

    setJobs((prev) =>
      prev.map((job) =>
        job.id === completingJob.id
          ? {
              ...job,
              status: 'Complete',
              staff_completed_at: completedAt,
              staff_completion_report: completionReport.trim(),
            }
          : job
      )
    );

    setSelectedJob((prev) =>
      prev && prev.id === completingJob.id
        ? {
            ...prev,
            status: 'Complete',
            staff_completed_at: completedAt,
            staff_completion_report: completionReport.trim(),
          }
        : prev
    );

    setCompletingJob(null);
    setCompletionReport('');
  };

  const openJobDetail = (job: StaffJob) => {
    setSelectedJob(job);
    setNotesDraft(job.staff_notes || '');
    fetchChecklistForJob(job);
    fetchChatForJob(job.id);
  };

  const openCompleteModal = (job: StaffJob) => {
    setCompletingJob(job);
    setCompletionReport(job.staff_completion_report || '');
    setReportError(null);
  };

  const openDirections = (job: StaffJob) => {
    const destination = job.location || job.user_location;
    if (!destination) {
      setError('No client address is available for directions.');
      return;
    }

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleStaffPasswordUpdate = async () => {
    setPasswordError(null);
    setPasswordMessage(null);

    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);

    if (error) {
      setPasswordError(error.message || 'Failed to update password.');
      return;
    }

    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setPasswordMessage('Password updated successfully.');
  };

  useEffect(() => {
    fetchJobs();
    fetchProfile();
    fetchAvailability();
  }, []);

  // Real-time chat subscription
  useEffect(() => {
    if (!selectedJob) return;

    const channel = supabase
      .channel(`staff-booking-chat-${selectedJob.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'booking_staff_chat_messages',
        filter: `booking_id=eq.${selectedJob.id}`,
      }, (payload) => {
        const newMessage = payload.new as BookingStaffChatMessage;
        
        // Update chat state
        setChatByBooking((prev) => ({
          ...prev,
          [selectedJob.id]: [...(prev[selectedJob.id] || []), newMessage],
        }));

        // Show notification only if message is from admin
        if (newMessage.sender_role === 'admin') {
          addNotification(`New message from admin: "${newMessage.message.substring(0, 50)}${newMessage.message.length > 50 ? '...' : ''}"`, 'info');
        }

        // Auto-scroll to latest message
        setTimeout(() => {
          if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
          }
        }, 0);
      })
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [selectedJob?.id]);

  // Auto-dismiss notifications after 4 seconds
  useEffect(() => {
    if (notifications.length === 0) return;

    const timer = setTimeout(() => {
      if (notifications.length > 0) {
        removeNotification(notifications[notifications.length - 1].id);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [notifications]);

  const activeJobs = jobs.filter((job) => job.status !== 'Complete' && job.status !== 'Rejected');
  const completedJobs = jobs.filter((job) => job.status === 'Complete');
  const weekStart = getWeekStart(weekAnchorDate);
  const weekDays = Array.from({ length: 7 }).map((_, idx) => addDays(weekStart, idx));

  const jobsByDate = activeJobs.reduce((acc, job) => {
    const key = normalizeBookingDate(job.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(job);
    return acc;
  }, {} as Record<string, StaffJob[]>);

  const availabilityByDate = availability.reduce((acc, slot) => {
    const key = slot.unavailable_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {} as Record<string, StaffAvailabilitySlot[]>);

  const filterJobs = (list: StaffJob[]) =>
    list.filter((job) => {
      if (!searchQuery.trim()) {
        return true;
      }

      const query = searchQuery.toLowerCase();
      return (
        job.service.toLowerCase().includes(query) ||
        (job.user_name || '').toLowerCase().includes(query) ||
        String(job.id).includes(query)
      );
    });

  const visibleJobs = filterJobs(activeTab === 'active' ? activeJobs : completedJobs);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Portal</h1>
          <p className="text-sm text-slate-600">{profile ? `${profile.first_name} ${profile.surname}` : 'View and manage assigned work'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchJobs();
              fetchProfile();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
          >
            <FaSync /> Refresh
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Notification Display */}
      {notifications.length > 0 && (
        <div className="fixed top-6 right-6 z-50 space-y-2 max-w-md">
          {notifications.map((notif) => {
            const bgColor = {
              info: 'bg-blue-100 border-blue-300 text-blue-900',
              success: 'bg-emerald-100 border-emerald-300 text-emerald-900',
              warning: 'bg-amber-100 border-amber-300 text-amber-900',
              error: 'bg-red-100 border-red-300 text-red-900',
            }[notif.type] || 'bg-slate-100 border-slate-300 text-slate-900';

            return (
              <div
                key={notif.id}
                className={`${bgColor} border rounded-lg p-4 shadow-lg flex justify-between items-start`}
              >
                <p className="text-sm font-medium">{notif.message}</p>
                <button
                  onClick={() => removeNotification(notif.id)}
                  className="ml-4 text-lg hover:opacity-75"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total Assigned</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{jobs.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">Active Jobs</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{activeJobs.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">Completed</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">{completedJobs.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">Pending Acknowledgment</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">{activeJobs.filter((job) => !job.staff_acknowledged_at).length}</p>
          </div>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
          {([
            { key: 'active', label: 'Active Jobs', icon: <FaTools /> },
            { key: 'completed', label: 'Completed Jobs', icon: <FaCheckCircle /> },
            { key: 'calendar', label: 'Calendar', icon: <FaCalendarAlt /> },
            { key: 'profile', label: 'My Profile', icon: <FaUser /> },
          ] as { key: TabType; label: string; icon: React.ReactNode }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {(activeTab === 'active' || activeTab === 'completed') && (
          <>
            <div className="relative mb-4">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Search by service, client, or booking number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {loading ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-slate-600">Loading jobs...</div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">{error}</div>
            ) : visibleJobs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-600">
                <FaClipboardList className="mx-auto text-3xl mb-3 text-slate-400" />
                {activeTab === 'active' ? 'No active jobs assigned yet.' : 'No completed jobs yet.'}
              </div>
            ) : (
              <div className="space-y-4">
                {visibleJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => openJobDetail(job)}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-900">#{job.id} - {job.service}</h3>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[job.status] || 'bg-slate-100 text-slate-600'}`}>
                            {job.status}
                          </span>
                          {job.staff_acknowledged_at && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                              Acknowledged
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-2">
                          <FaUser className="inline mr-1 text-slate-400" /> {job.user_name}
                        </p>
                        <p className="text-sm text-slate-600">
                          <FaCalendarAlt className="inline mr-1 text-slate-400" /> {job.date} at {job.time}
                        </p>
                        {(job.location || job.user_location) && (
                          <p className="text-sm text-slate-600 mt-1">
                            <FaMapMarkerAlt className="inline mr-1 text-slate-400" /> {job.location || job.user_location}
                          </p>
                        )}
                        {job.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{job.description}</p>}
                        {job.staff_notes && (
                          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                            <FaStickyNote /> Notes saved
                          </p>
                        )}
                        {job.staff_completion_report && (
                          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                            <FaFileAlt /> Completion report submitted
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 min-w-[170px]" onClick={(e) => e.stopPropagation()}>
                        {activeTab === 'active' && !job.staff_acknowledged_at && (
                          <button
                            onClick={() => acknowledgeJob(job.id)}
                            className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                          >
                            Acknowledge Job
                          </button>
                        )}
                        {activeTab === 'active' && (
                          <button
                            onClick={() => openCompleteModal(job)}
                            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1"
                          >
                            <FaCheckCircle /> Complete Job
                          </button>
                        )}
                        {activeTab === 'completed' && job.staff_completed_at && (
                          <p className="text-xs text-slate-500 text-right">
                            <FaClock className="inline mr-1" /> {new Date(job.staff_completed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-slate-900">Weekly Assigned Jobs</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWeekAnchorDate((prev) => addDays(prev, -7))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    onClick={() => setWeekAnchorDate(new Date())}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => setWeekAnchorDate((prev) => addDays(prev, 7))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {weekDays.map((day) => {
                  const key = formatDateKey(day);
                  const dayJobs = jobsByDate[key] || [];
                  const dayUnavailable = availabilityByDate[key] || [];
                  return (
                    <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3 min-h-[170px]">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className="text-sm font-bold text-slate-900">{day.toLocaleDateString()}</p>

                      <div className="mt-3 space-y-2">
                        {dayUnavailable.map((slot) => (
                          <div key={`un-${slot.id}`} className="rounded-lg bg-red-50 border border-red-200 px-2 py-1 text-[11px] text-red-700">
                            Unavailable {slot.start_time && slot.end_time ? `${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}` : 'all day'}
                          </div>
                        ))}
                        {dayJobs.length === 0 ? (
                          <p className="text-[11px] text-slate-400">No jobs</p>
                        ) : (
                          dayJobs.map((job) => (
                            <button
                              key={job.id}
                              type="button"
                              onClick={() => openJobDetail(job)}
                              className="w-full rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-left text-[11px] text-blue-700 hover:bg-blue-100"
                            >
                              #{job.id} {job.time}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Mark Unavailable Dates/Hours</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="date"
                  value={newUnavailableDate}
                  onChange={(e) => setNewUnavailableDate(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                />
                <input
                  type="time"
                  value={newUnavailableStart}
                  onChange={(e) => setNewUnavailableStart(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                />
                <input
                  type="time"
                  value={newUnavailableEnd}
                  onChange={(e) => setNewUnavailableEnd(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                />
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={newUnavailableNote}
                  onChange={(e) => setNewUnavailableNote(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                />
              </div>
              <div className="mt-3">
                <button
                  onClick={addUnavailabilitySlot}
                  className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  Save Unavailability
                </button>
              </div>

              <div className="mt-5 space-y-2">
                {loadingAvailability ? (
                  <p className="text-sm text-slate-500">Loading availability...</p>
                ) : availability.length === 0 ? (
                  <p className="text-sm text-slate-500">No unavailable slots added yet.</p>
                ) : (
                  availability.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <span>
                        {slot.unavailable_date} {slot.start_time && slot.end_time ? `${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}` : '(all day)'}
                        {slot.note ? ` - ${slot.note}` : ''}
                      </span>
                      <button
                        onClick={() => removeUnavailabilitySlot(slot.id)}
                        className="rounded-md bg-red-100 px-2 py-1 text-red-700 hover:bg-red-200"
                        title="Remove"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && profile && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold">
                {profile.first_name?.[0] ?? 'S'}{profile.surname?.[0] ?? 'T'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{profile.first_name} {profile.surname}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Staff</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <FaEnvelope className="text-slate-400" />
                <span>{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <FaPhone className="text-slate-400" />
                  <span>{profile.phone}</span>
                </div>
              )}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-800 mb-3">Update Password</p>
                <div className="space-y-3">
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="New password"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}
                  {passwordMessage && <p className="text-xs text-green-600">{passwordMessage}</p>}
                  <button
                    onClick={handleStaffPasswordUpdate}
                    disabled={updatingPassword}
                    className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{jobs.length}</p>
                <p className="text-xs text-slate-500 mt-1">Total Assigned</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{completedJobs.length}</p>
                <p className="text-xs text-slate-500 mt-1">Jobs Completed</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Job #{selectedJob.id}</h2>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-600 text-xl">
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Job Details</p>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm text-slate-700">
                  <p><span className="font-semibold">Service:</span> {selectedJob.service}</p>
                  <p><span className="font-semibold">Date:</span> {selectedJob.date} at {selectedJob.time}</p>
                  <p>
                    <span className="font-semibold">Status:</span>{' '}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[selectedJob.status] || 'bg-slate-100 text-slate-600'}`}>
                      {selectedJob.status}
                    </span>
                  </p>
                  {selectedJob.description && <p><span className="font-semibold">Description:</span> {selectedJob.description}</p>}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Client</p>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm text-slate-700">
                  <p className="flex items-center gap-2"><FaUser className="text-slate-400" /> {selectedJob.user_name}</p>
                  {selectedJob.user_email && <p className="flex items-center gap-2"><FaEnvelope className="text-slate-400" /> {selectedJob.user_email}</p>}
                  {selectedJob.user_phone && <p className="flex items-center gap-2"><FaPhone className="text-slate-400" /> {selectedJob.user_phone}</p>}
                  {(selectedJob.location || selectedJob.user_location) && (
                    <p className="flex items-center gap-2"><FaMapMarkerAlt className="text-slate-400" /> {selectedJob.location || selectedJob.user_location}</p>
                  )}
                  {(selectedJob.location || selectedJob.user_location) && (
                    <button
                      onClick={() => openDirections(selectedJob)}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white"
                    >
                      <FaMapMarkerAlt /> Get Directions
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  <FaStickyNote className="inline mr-1" /> Staff Notes
                </p>
                <textarea
                  rows={3}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Add notes about the job, what you found, or what to follow up on..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  className="mt-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  <FaClipboardList className="inline mr-1" /> Service Checklist
                </p>
                {(checklistByBooking[selectedJob.id] || []).length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No checklist template configured for this service.
                  </div>
                ) : (
                  <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    {(checklistByBooking[selectedJob.id] || []).map((item) => (
                      <label key={item.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={item.is_completed}
                          onChange={(e) => toggleChecklistItem(selectedJob.id, item, e.target.checked)}
                        />
                        <span className={item.is_completed ? 'line-through text-slate-400' : ''}>{item.item_text}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  <FaCommentDots className="inline mr-1" /> Staff/Admin Chat
                </p>
                <div 
                  ref={chatMessagesRef}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 max-h-56 overflow-y-auto"
                >
                  {(chatByBooking[selectedJob.id] || []).length === 0 ? (
                    <p className="text-sm text-slate-500">No messages yet.</p>
                  ) : (
                    (chatByBooking[selectedJob.id] || []).map((message) => (
                      <div key={message.id} className={`rounded-lg px-3 py-2 text-sm ${message.sender_role === 'staff' ? 'bg-blue-100 text-blue-900 ml-6' : 'bg-white border border-slate-200 text-slate-700 mr-6'}`}>
                        <p className="text-[11px] font-semibold uppercase tracking-wide mb-1">{message.sender_role}</p>
                        <p>{message.message}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{new Date(message.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={chatDraftByBooking[selectedJob.id] || ''}
                    onChange={(e) =>
                      setChatDraftByBooking((prev) => ({
                        ...prev,
                        [selectedJob.id]: e.target.value,
                      }))
                    }
                    placeholder="Send a quick message to admin..."
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  />
                  <button
                    onClick={() => sendChatMessage(selectedJob.id)}
                    disabled={chatSendingForBookingId === selectedJob.id}
                    className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {chatSendingForBookingId === selectedJob.id ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>

              {selectedJob.staff_completion_report && (
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    <FaFileAlt className="inline mr-1 text-emerald-500" /> Completion Report
                  </p>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 whitespace-pre-wrap">
                    {selectedJob.staff_completion_report}
                  </div>
                  {selectedJob.staff_completed_at && (
                    <p className="text-xs text-slate-500 mt-1">Completed: {new Date(selectedJob.staff_completed_at).toLocaleString()}</p>
                  )}
                </div>
              )}

              {selectedJob.status !== 'Complete' && selectedJob.status !== 'Rejected' && (
                <div className="flex gap-3 pt-2">
                  {!selectedJob.staff_acknowledged_at && (
                    <button
                      onClick={() => acknowledgeJob(selectedJob.id)}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                    >
                      Acknowledge Job
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedJob(null);
                      openCompleteModal(selectedJob);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <FaCheckCircle /> Complete Job
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {completingJob && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Complete Job #{completingJob.id}</h2>
              <button onClick={() => setCompletingJob(null)} className="text-slate-400 hover:text-slate-600 text-xl">
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                You are marking <span className="font-semibold">{completingJob.service}</span> as complete. Write a short report explaining what was done.
              </p>
              {(checklistByBooking[completingJob.id] || []).length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">Checklist Progress</p>
                  <p className="text-xs text-slate-600 mb-2">
                    {(checklistByBooking[completingJob.id] || []).filter((item) => item.is_completed).length} of {(checklistByBooking[completingJob.id] || []).length} completed
                  </p>
                  <ul className="space-y-1">
                    {(checklistByBooking[completingJob.id] || []).map((item) => (
                      <li key={item.id} className={`text-xs ${item.is_completed ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {item.is_completed ? '✓' : '•'} {item.item_text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <FaFileAlt className="inline mr-1 text-slate-400" /> Job Completion Report
                </label>
                <textarea
                  rows={6}
                  value={completionReport}
                  onChange={(e) => {
                    setCompletionReport(e.target.value);
                    setReportError(null);
                  }}
                  placeholder="Describe the work completed, any issues found, any parts used, and anything the admin should know..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                {reportError && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <FaExclamationCircle /> {reportError}
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCompletingJob(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitCompletionReport}
                  disabled={submittingReport}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {submittingReport ? 'Submitting...' : 'Mark Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
