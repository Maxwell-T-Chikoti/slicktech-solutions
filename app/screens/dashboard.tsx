"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaCalendarAlt, FaClock, FaDollarSign, FaFileAlt, FaSync, FaStar } from 'react-icons/fa';
import ServicesScreen from './services';
import supabase from '@/app/lib/supabaseClient';
import BookingsScreen from './bookings';
import ProfileScreen from './profile';
import NewBookingScreen from './newbooking';
import BookingDetails from './bookingdetails';

interface UserDashboardProps {
  onLogout?: () => void;
}
//dd
const UserDashboard = ({ onLogout }: UserDashboardProps) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [bookings, setBookings] = useState<any[]>([]);
  const [userName, setUserName] = useState('User');
  const [techNews, setTechNews] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
  const [selectedBooking, setSelectedBooking] = useState<any | undefined>(undefined);
  const [initialReschedule, setInitialReschedule] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const todayDate = new Date().toLocaleDateString('en-ZA', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});

  const fetchBookings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase.from('profiles').select('first_name').eq('id', user.id).single();
      if (profileData?.first_name) setUserName(profileData.first_name);
    }
    const { data } = await supabase.from('bookings').select('*').order('date', { ascending: true }).eq('user_id', user?.id);
    if (data) {
      setBookings(data);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setUpcomingCount(data.filter(b => new Date(b.date) >= today && b.status === 'Confirmed').length);
      setTotalSpent(data.filter(b => b.status === 'Confirmed').reduce((sum, b) => sum + parseFloat(b.price?.replace(/[^0-9.]/g, '') || '0'), 0));
    }
  };

  const fetchTechNews = async () => {
    try {
      const response = await fetch('https://dev.to/api/articles?tag=technology&top=5&per_page=5');
      const data = await response.json();
      setTechNews(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').order('id', { ascending: true });
    if (data) setServices(data);
  };

  useEffect(() => {
    fetchBookings();
    fetchTechNews();
    fetchServices();
  }, []);

  const handleNavigate = (page: string, payload?: any) => {
    if (page === 'newbooking' && typeof payload === 'string') setSelectedService(payload);
    if (page === 'bookingdetails') {
      setSelectedBooking(payload?.booking || payload);
      setInitialReschedule(!!payload?.reschedule);
    }
    setCurrentPage(page);
    if (page === 'home' || page === 'bookings') fetchBookings();
  };

  const handleLogout = () => onLogout?.();

  if (currentPage === 'services') return <ServicesScreen onNavigate={handleNavigate} onLogout={handleLogout} />;
  if (currentPage === 'bookings') return <BookingsScreen bookings={bookings} setBookings={setBookings} onNavigate={handleNavigate} onLogout={handleLogout} />;
  if (currentPage === 'bookingdetails') return <BookingDetails booking={selectedBooking} setBookings={setBookings} onNavigate={handleNavigate} onLogout={handleLogout} startReschedule={initialReschedule} />;
  if (currentPage === 'profile') return <ProfileScreen onNavigate={handleNavigate} onLogout={handleLogout} />;
  if (currentPage === 'newbooking') return <NewBookingScreen onNavigate={handleNavigate} onLogout={handleLogout} selectedService={selectedService} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 font-sans">
      <Navbar currentPage="home" onNavigate={handleNavigate} onLogout={handleLogout} />

      <main className="px-4 md:px-8 py-10 max-w-7xl mx-auto space-y-12">
        
        {/* Banner with High Contrast Border */}
        <div className="relative overflow-hidden rounded-[2rem] border-2 border-slate-200 bg-white p-8 md:p-12 shadow-xl shadow-slate-200/50">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                Welcome back, <span className="text-blue-600">{userName}</span>
              </h1>
              <p className="text-slate-500 text-lg font-medium max-w-lg">
                Manage your projects and bookings with SlickTech's streamlined dashboard.
              </p>
            </div>
            <button
              onClick={() => handleNavigate('newbooking')}
              className="group flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-slate-900 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-200"
            >
              <span>✨ New Booking</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        {/* Stats Grid - Defined with Borders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Bookings', val: bookings.length, icon: FaFileAlt, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'Upcoming', val: upcomingCount, icon: FaCalendarAlt, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Completed', val: bookings.filter(b => b.status === 'Confirmed').length, icon: FaStar, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
            { label: 'Today', val: todayDate, icon: FaClock, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' }
          ].map((stat, i) => (
            <div key={i} className={`bg-white border-2 ${stat.border} p-6 rounded-3xl shadow-sm hover:shadow-md transition-all`}>
              <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-4`}>
                <stat.icon className={`text-xl ${stat.color}`} />
              </div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{stat.val}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Area */}
          <div className="lg:col-span-2 space-y-10">
            <section className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <span className="w-2 h-7 bg-blue-600 rounded-full"></span> Upcoming Appointments
              </h2>
              <div className="space-y-4">
                {bookings.filter(b => new Date(b.date) >= new Date().setHours(0,0,0,0) && b.status === 'Confirmed').length > 0 ? (
                  bookings.filter(b => new Date(b.date) >= new Date().setHours(0,0,0,0) && b.status === 'Confirmed').slice(0, 3).map((b) => (
                    <div key={b.id} className="group flex flex-col sm:flex-row items-center justify-between p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-white transition-all gap-4">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-blue-600 font-black text-xl border border-slate-200 shadow-sm">
                          {b.service.charAt(0)}
                        </div>
                        <div className="text-center sm:text-left">
                          <h3 className="font-bold text-slate-900 text-lg">{b.service}</h3>
                          <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-slate-500 font-medium mt-1">
                            <span className="flex items-center gap-1"><FaCalendarAlt size={12}/> {b.date}</span>
                            <span className="flex items-center gap-1"><FaClock size={12}/> {b.time}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleNavigate('bookingdetails', b)} className="w-full sm:w-auto px-6 py-3 font-bold bg-white border border-slate-300 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm">Details</button>
                    </div>
                  ))
                ) : (
                  <div className="py-12 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                    <p className="text-slate-400 font-bold">No upcoming bookings found.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <span className="w-2 h-7 bg-indigo-600 rounded-full"></span> Recent Records
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {bookings.slice(0, 4).map((b) => (
                  <div key={b.id} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl hover:bg-white hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <span className="font-bold text-slate-800 text-sm">{b.service}</span>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${b.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <span className="text-xs font-bold text-slate-400">{b.date}</span>
                      <button onClick={() => handleNavigate('bookingdetails', b)} className="text-blue-600 font-black text-xs hover:underline">View File</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-10">
            <section className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3 underline decoration-blue-500 underline-offset-8">
                Tech Insights
              </h2>
              <div className="space-y-6">
                {techNews.map((news, i) => (
                  <a key={i} href={news.url} target="_blank" className="block group border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                    <p className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">{news.title}</p>
                    <p className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-widest">Dev.to • {news.user.name}</p>
                  </a>
                ))}
              </div>
            </section>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000"></div>
              <h3 className="text-xl font-black text-white mb-3">Expert Support</h3>
              <p className="text-slate-400 text-sm mb-6 font-medium">Get direct access to our tech team for your enterprise needs.</p>
              <button className="w-full py-4 bg-white text-slate-900 font-black rounded-xl text-sm hover:bg-blue-500 hover:text-white transition-all shadow-lg">Contact Us</button>
            </div>
          </div>
        </div>

        {/* Services Section with Distinct Background */}
        <section className="bg-slate-900 rounded-[3rem] p-10 md:p-14 text-white shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-black mb-2">Our Specializations</h2>
              <p className="text-slate-400 font-medium">Explore premium tech services tailored for you.</p>
            </div>
            <button onClick={() => handleNavigate('services')} className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold transition-all">View Full Catalog</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.slice(0, 3).map((s) => (
              <div key={s.id} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all group">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-500">
                  ⚡
                </div>
                <h4 className="font-black text-xl mb-3">{s.title}</h4>
                <p className="text-slate-400 text-sm mb-8 line-clamp-2 leading-relaxed">{s.description}</p>
                <div className="flex items-center justify-between pt-6 border-t border-white/10">
                  <span className="text-2xl font-black text-blue-400">{s.price}</span>
                  <button onClick={() => handleNavigate('newbooking', s.title)} className="p-4 bg-blue-600 rounded-2xl hover:bg-white hover:text-blue-600 transition-all">
                    <FaSync className="text-xs" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-20 py-16 bg-white border-t-2 border-slate-200 text-center">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center font-black text-white">S</div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">SLICKTECH</span>
          </div>
          <div className="flex gap-8 text-slate-300">
            <FaFacebook className="hover:text-blue-600 transition-colors cursor-pointer" />
            <FaTwitter className="hover:text-blue-400 transition-colors cursor-pointer" />
            <FaInstagram className="hover:text-pink-600 transition-colors cursor-pointer" />
            <FaLinkedin className="hover:text-blue-800 transition-colors cursor-pointer" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">© 2026 Crafted by Swiftspire Technologies </p>
        </div>
      </footer>
    </div>
  );
};

export default UserDashboard;