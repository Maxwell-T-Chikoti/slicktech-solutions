"use client";

import React, { useEffect, useState } from 'react';
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

type TabType = 'active' | 'completed' | 'profile';

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
  }, []);

  const activeJobs = jobs.filter((job) => job.status !== 'Complete' && job.status !== 'Rejected');
  const completedJobs = jobs.filter((job) => job.status === 'Complete');

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

        {activeTab !== 'profile' && (
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
