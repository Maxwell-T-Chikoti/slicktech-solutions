"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import supabase from '@/app/lib/supabaseClient';
import { downloadInvoicePDF } from '@/app/lib/pdfUtils';
import {
  FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf,
  FaDownload, FaArrowRight, FaUser, FaDollarSign, FaFileAlt, FaChevronDown,
} from 'react-icons/fa';

interface MyAccountProps {
  onNavigate: (page: string, payload?: any) => void;
  onLogout: () => void;
  setBookings: React.Dispatch<React.SetStateAction<any[]>>;
}

type TabKey = 'overview' | 'upcoming' | 'history' | 'certificates';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700', icon: <FaCheckCircle className="text-emerald-500" /> },
  Complete:  { label: 'Complete',  color: 'bg-blue-100 text-blue-700',    icon: <FaCheckCircle className="text-blue-500" /> },
  Rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-600',      icon: <FaTimesCircle className="text-red-500" /> },
  Pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700', icon: <FaHourglassHalf className="text-yellow-500" /> },
};

const MyAccount = ({ onNavigate, onLogout, setBookings }: MyAccountProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [bookings, setLocalBookings] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySearch, setHistorySearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const userSession = localStorage.getItem('slicktech_user');
      if (!userSession) { onLogout(); return; }
      const u = JSON.parse(userSession);
      setUser(u);

      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', u.id)
        .order('date', { ascending: false });

      if (data) {
        setLocalBookings(data);
        setBookings(data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = bookings.filter(
    (b) => b.status === 'Confirmed' && new Date(b.date) >= today
  );

  const certificates = bookings.filter(
    (b) => b.status === 'Complete' || b.status === 'Confirmed'
  );

  const totalSpent = bookings
    .filter((b) => b.status === 'Confirmed' || b.status === 'Complete')
    .reduce((sum, b) => sum + parseFloat(b.price?.replace(/[^0-9.]/g, '') || '0'), 0);

  const filteredHistory = bookings
    .filter((b) => {
      const matchStatus = historyFilter === 'all' || b.status === historyFilter;
      const matchSearch =
        historySearch === '' ||
        b.service.toLowerCase().includes(historySearch.toLowerCase()) ||
        b.date.toLowerCase().includes(historySearch.toLowerCase());
      return matchStatus && matchSearch;
    });

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview',     label: 'Overview' },
    { key: 'upcoming',     label: 'Upcoming',     count: upcoming.length },
    { key: 'history',      label: 'All Bookings', count: bookings.length },
    { key: 'certificates', label: 'Certificates', count: certificates.length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar currentPage="myaccount" onNavigate={onNavigate} onLogout={onLogout} />
        <main className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar currentPage="myaccount" onNavigate={onNavigate} onLogout={onLogout} />

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-8">

        {/* Profile Banner */}
        <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-3xl flex-shrink-0">
            {user?.first_name?.charAt(0) ?? 'U'}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-black text-slate-900">
              {user?.first_name} {user?.surname}
            </h1>
            <p className="text-slate-500 font-medium mt-1">{user?.email}</p>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2 px-5 py-2 border-2 border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all text-sm"
          >
            <FaUser /> Edit Profile
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Bookings', val: bookings.length,       color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100' },
            { label: 'Upcoming',       val: upcoming.length,        color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Completed',      val: certificates.length,   color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-100' },
            { label: 'Total Spent',    val: `R${totalSpent.toFixed(2)}`, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
          ].map((s, i) => (
            <div key={i} className={`bg-white border-2 ${s.border} p-5 rounded-2xl shadow-sm`}>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">{s.label}</p>
              <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white border-2 border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          {/* Tab Bar */}
          <div className="flex overflow-x-auto border-b border-slate-200">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 min-w-max px-6 py-4 text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === t.key
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
                {t.count !== undefined && (
                  <span className={`ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                    activeTab === t.key ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">

            {/* ─── OVERVIEW ─── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="font-black text-xl text-slate-900">Account Overview</h2>

                {/* Status breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Pending', 'Confirmed', 'Complete', 'Rejected'].map((s) => {
                    const count = bookings.filter((b) => b.status === s).length;
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <div key={s} className="border border-slate-200 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-2">{cfg.icon}<span className="text-xs font-black uppercase tracking-widest text-slate-500">{s}</span></div>
                        <p className="text-3xl font-black text-slate-900">{count}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Next upcoming */}
                {upcoming.length > 0 && (
                  <div>
                    <h3 className="font-black text-slate-700 mb-3 text-sm uppercase tracking-widest">Next Appointment</h3>
                    {(() => {
                      const next = [...upcoming].sort(
                        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                      )[0];
                      return (
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl p-5">
                          <div>
                            <p className="font-black text-slate-900 text-lg">{next.service}</p>
                            <div className="flex gap-4 text-sm text-slate-500 font-medium mt-1">
                              <span className="flex items-center gap-1"><FaCalendarAlt size={11} />{next.date}</span>
                              <span className="flex items-center gap-1"><FaClock size={11} />{next.time}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => downloadInvoicePDF({ ...next, user_name: `${user?.first_name ?? ''} ${user?.surname ?? ''}`.trim(), user_email: user?.email })}
                              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-white transition"
                            >
                              <FaDownload /> Invoice
                            </button>
                            <button
                              onClick={() => onNavigate('bookingdetails', next)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
                            >
                              Details <FaArrowRight />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Recent activity */}
                <div>
                  <h3 className="font-black text-slate-700 mb-3 text-sm uppercase tracking-widest">Recent Activity</h3>
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map((b) => {
                      const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG['Pending'];
                      return (
                        <div key={b.id} className="flex items-center justify-between border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 text-sm">{b.service.charAt(0)}</div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{b.service}</p>
                              <p className="text-xs text-slate-400">{b.date}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${cfg.color}`}>{cfg.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ─── UPCOMING ─── */}
            {activeTab === 'upcoming' && (
              <div className="space-y-4">
                <h2 className="font-black text-xl text-slate-900">Upcoming Appointments</h2>
                {upcoming.length === 0 ? (
                  <div className="py-16 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                    <FaCalendarAlt className="mx-auto text-4xl text-slate-300 mb-4" />
                    <p className="text-slate-400 font-bold">No upcoming confirmed appointments.</p>
                    <button
                      onClick={() => onNavigate('newbooking')}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
                    >
                      Book Now
                    </button>
                  </div>
                ) : (
                  [...upcoming]
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((b) => (
                      <div key={b.id} className="flex flex-col sm:flex-row items-center justify-between bg-white border-2 border-slate-200 hover:border-blue-300 rounded-2xl p-5 gap-4 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-black text-blue-600 text-xl">
                            {b.service.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{b.service}</p>
                            <div className="flex gap-3 text-sm text-slate-500 font-medium mt-1">
                              <span className="flex items-center gap-1"><FaCalendarAlt size={11} />{b.date}</span>
                              <span className="flex items-center gap-1"><FaClock size={11} />{b.time}</span>
                            </div>
                            {b.price && <p className="text-sm font-black text-blue-600 mt-1">{b.price}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => onNavigate('bookingdetails', b)}
                          className="w-full sm:w-auto px-5 py-2 border-2 border-slate-300 rounded-xl font-bold text-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => downloadInvoicePDF({ ...b, user_name: `${user?.first_name ?? ''} ${user?.surname ?? ''}`.trim(), user_email: user?.email })}
                          className="w-full sm:w-auto px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
                        >
                          Invoice
                        </button>
                      </div>
                    ))
                )}
              </div>
            )}

            {/* ─── HISTORY ─── */}
            {activeTab === 'history' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <h2 className="font-black text-xl text-slate-900">All Bookings</h2>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      placeholder="Search service or date…"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="relative">
                      <select
                        value={historyFilter}
                        onChange={(e) => setHistoryFilter(e.target.value)}
                        className="appearance-none px-3 py-2 pr-8 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Complete">Complete</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <FaChevronDown className="absolute right-2 top-3 text-slate-400 text-xs pointer-events-none" />
                    </div>
                  </div>
                </div>

                {filteredHistory.length === 0 ? (
                  <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                    <p className="text-slate-400 font-bold">No bookings match your filters.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredHistory.map((b) => {
                      const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG['Pending'];
                      return (
                        <div key={b.id} className="flex items-center justify-between border border-slate-200 hover:border-blue-200 rounded-xl p-4 transition-all bg-white">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600">
                              {b.service.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{b.service}</p>
                              <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                                <span>{b.date}</span>
                                <span>·</span>
                                <span>{b.time}</span>
                                {b.price && <><span>·</span><span className="text-blue-600 font-bold">{b.price}</span></>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`hidden sm:inline text-[10px] font-black px-2 py-1 rounded-lg uppercase ${cfg.color}`}>{cfg.label}</span>
                            <button
                              onClick={() => downloadInvoicePDF({ ...b, user_name: `${user?.first_name ?? ''} ${user?.surname ?? ''}`.trim(), user_email: user?.email })}
                              className="text-slate-700 hover:text-blue-700 font-black text-xs hover:underline"
                            >
                              Invoice
                            </button>
                            <button
                              onClick={() => onNavigate('bookingdetails', b)}
                              className="text-blue-600 hover:text-blue-800 font-black text-xs hover:underline"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── CERTIFICATES ─── */}
            {activeTab === 'certificates' && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-black text-xl text-slate-900">Certificates</h2>
                  <p className="text-sm text-slate-500 mt-1">Completion certificates are available for confirmed and completed services.</p>
                </div>
                {certificates.length === 0 ? (
                  <div className="py-16 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                    <FaFileAlt className="mx-auto text-4xl text-slate-300 mb-4" />
                    <p className="text-slate-400 font-bold">No certificates available yet.</p>
                    <p className="text-slate-400 text-sm mt-1">Complete a service to earn your certificate.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificates.map((b) => (
                      <div key={b.id} className="border-2 border-slate-200 rounded-2xl p-5 bg-white hover:border-blue-300 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-black text-slate-900">{b.service}</p>
                            <p className="text-xs text-slate-400 mt-1">{b.date} · {b.time}</p>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${STATUS_CONFIG[b.status]?.color ?? 'bg-slate-100 text-slate-600'}`}>
                            {b.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                          {b.price && <p className="font-black text-blue-600">{b.price}</p>}
                          <div className="flex gap-2">
                            <button
                              onClick={() => downloadInvoicePDF({ ...b, user_name: `${user?.first_name ?? ''} ${user?.surname ?? ''}`.trim(), user_email: user?.email })}
                              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
                            >
                              <FaDownload size={12} /> Invoice
                            </button>
                            <button
                              onClick={() => onNavigate('bookingdetails', b)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition"
                            >
                              <FaDownload size={12} /> Download Certificate
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default MyAccount;
