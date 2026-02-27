"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaCalendarAlt, FaClock, FaDollarSign, FaFileAlt, FaSync, FaStar, FaUsers } from 'react-icons/fa';
import ServicesScreen from './services';
import supabase from '@/app/lib/supabaseClient';
import BookingsScreen from './bookings';
import ProfileScreen from './profile';
import NewBookingScreen from './newbooking';
import BookingDetails from './bookingdetails';

interface UserDashboardProps {
  onLogout?: () => void;
}

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

  const fetchBookings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch user profile for name
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single();
      if (profileData?.first_name) {
        setUserName(profileData.first_name);
      }
    }

    let query = supabase.from('bookings').select('*').order('date', { ascending: true });
    if (user) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching bookings:', error);
    } else if (data) {
      setBookings(data as any[]);
      
      // Calculate upcoming bookings and total spent
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcoming = data.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= today && b.status === 'Confirmed';
      });
      setUpcomingCount(upcoming.length);
      
      const spent = data
        .filter(b => b.status === 'Confirmed')
        .reduce((sum, b) => {
          const price = parseFloat(b.price?.replace(/[^0-9.]/g, '') || '0');
          return sum + price;
        }, 0);
      setTotalSpent(spent);
    }
  };

  // Fetch tech news from Dev.to API
  const fetchTechNews = async () => {
    try {
      const response = await fetch(
        'https://dev.to/api/articles?tag=technology&top=7&per_page=7'
      );
      const data = await response.json();
      setTechNews(data.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching tech news:', error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchTechNews();
  }, []);


  const fetchServices = async () => {
    const { data, error } = await supabase.from('services').select('*').order('id', { ascending: true });
    if (error) {
      console.error('Error fetching services in dashboard:', error);
    } else if (data) {
      setServices(data as any[]);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleNavigate = (page: string, payload?: any) => {
    if (page === 'newbooking' && typeof payload === 'string') {
      setSelectedService(payload);
    }
    if (page === 'bookingdetails') {
      if (payload && payload.booking) {
        setSelectedBooking(payload.booking);
        setInitialReschedule(!!payload.reschedule);
      } else {
        setSelectedBooking(payload);
        setInitialReschedule(false);
      }
    }
    setCurrentPage(page);

    // refresh bookings when returning to home or bookings pages
    if (page === 'home' || page === 'bookings') {
      fetchBookings();
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Render different screens based on current page
  if (currentPage === 'services') {
    return <ServicesScreen onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  if (currentPage === 'bookings') {
    return <BookingsScreen bookings={bookings} setBookings={setBookings} onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  if (currentPage === 'bookingdetails') {
    return <BookingDetails booking={selectedBooking} setBookings={setBookings} onNavigate={handleNavigate} onLogout={handleLogout} startReschedule={initialReschedule} />;
  }

  if (currentPage === 'profile') {
    return <ProfileScreen onNavigate={handleNavigate} onLogout={handleLogout} />;
  }

  if (currentPage === 'newbooking') {
    return <NewBookingScreen onNavigate={handleNavigate} onLogout={handleLogout} selectedService={selectedService} />;
  }

  // Default Dashboard Home View
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* Navigation Bar */}
      <Navbar currentPage="home" onNavigate={handleNavigate} onLogout={handleLogout} />

      {/* Main Content */}
      <div className="px-4 md:px-8 py-8">
        {/* Personalized Welcome Banner */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 text-white shadow-xl overflow-hidden relative">
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {userName}! 👋</h1>
              <p className="text-blue-100">Here's your service management dashboard. Keep track of your appointments and discover new services.</p>
            </div>
            <button
              onClick={() => handleNavigate('newbooking')}
              className="ml-8 bg-white hover:bg-blue-50 text-blue-700 font-bold py-3 px-8 rounded-xl transition-all hover:shadow-lg hover:scale-105 transform whitespace-nowrap"
            >
              ✨ Book Now
            </button>
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="backdrop-blur-xl bg-gradient-to-br from-blue-400/20 via-blue-300/10 to-blue-200/5 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-blue-300/40 hover:border-blue-400/60 hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-700 text-sm font-semibold">Total Bookings</p>
                <p className="text-4xl font-bold text-slate-900 mt-2">{bookings.length}</p>
              </div>
              <FaFileAlt className="text-5xl text-blue-500 opacity-15" />
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-green-400/20 via-green-300/10 to-green-200/5 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-green-300/40 hover:border-green-400/60 hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-700 text-sm font-semibold">Upcoming</p>
                <p className="text-4xl font-bold text-slate-900 mt-2">{upcomingCount}</p>
              </div>
              <FaCalendarAlt className="text-5xl text-green-500 opacity-15" />
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-400/20 via-purple-300/10 to-purple-200/5 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-purple-300/40 hover:border-purple-400/60 hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-700 text-sm font-semibold">Total Spent</p>
                <p className="text-4xl font-bold text-slate-900 mt-2">${totalSpent.toFixed(2)}</p>
              </div>
              <FaDollarSign className="text-5xl text-purple-500 opacity-15" />
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-orange-400/20 via-orange-300/10 to-orange-200/5 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-orange-300/40 hover:border-orange-400/60 hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-700 text-sm font-semibold">Completed</p>
                <p className="text-4xl font-bold text-slate-900 mt-2">{bookings.filter(b => b.status === 'Confirmed').length}</p>
              </div>
              <FaStar className="text-5xl text-orange-500 opacity-15" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column: Upcoming Appointments */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FaCalendarAlt className="text-blue-600" /> Upcoming Appointments
            </h2>
            <div className="space-y-4">
              {bookings
                .filter(b => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const bookingDate = new Date(b.date);
                  return bookingDate >= today && b.status === 'Confirmed';
                })
                .slice(0, 5)
                .map((booking, idx) => (
                  <div key={booking.id} className="backdrop-blur-lg bg-gradient-to-br from-white/40 to-white/20 rounded-xl p-5 shadow-lg hover:shadow-2xl transition-all border border-white/50 hover:border-blue-300/60 hover:translate-x-2 hover:from-white/50 hover:to-white/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="inline-block w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                          <h3 className="font-bold text-slate-900 text-lg">{booking.service}</h3>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-700 ml-11">
                          <span className="flex items-center gap-1"><FaCalendarAlt className="text-blue-500" /> {booking.date}</span>
                          <span className="flex items-center gap-1"><FaClock className="text-green-500" /> {booking.time}</span>
                          <span className="flex items-center gap-1"><FaDollarSign className="text-purple-500" /> {booking.price}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleNavigate('bookingdetails', booking)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all hover:shadow-lg"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              {upcomingCount === 0 && (
                <div className="backdrop-blur-lg bg-gradient-to-br from-blue-300/20 to-blue-200/10 rounded-xl p-8 text-center border-2 border-dashed border-blue-300/50">
                  <p className="text-slate-700 mb-4 font-semibold">No upcoming appointments</p>
                  <button
                    onClick={() => handleNavigate('newbooking')}
                    className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold py-2 px-6 rounded-full transition-all hover:shadow-lg hover:scale-105 transform"
                  >
                    Book One Now 🎯
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Tech Tips & Recent Bookings */}
          <div className="space-y-8">
            {/* Tech Tips Section */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span>💡</span> Tech Tips Today
              </h2>
              <div className="space-y-3 backdrop-blur-xl bg-gradient-to-br from-white/20 to-white/10 rounded-2xl p-6 border border-white/30 shadow-xl">
                {techNews.length > 0 ? (
                  techNews.map((article, idx) => (
                    <a
                      key={idx}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="backdrop-blur-lg bg-gradient-to-br from-white/40 to-white/20 rounded-xl p-4 shadow-lg hover:shadow-2xl hover:from-white/50 hover:to-white/30 transition-all cursor-pointer group border border-white/40 hover:border-blue-300/60 hover:translate-y-[-2px]"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl min-w-fit">📰</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {article.title}
                          </p>
                          <p className="text-xs text-slate-600 mt-2">By {article.user?.name || 'Dev Community'}</p>
                          <div className="text-xs text-blue-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                            Read more →
                          </div>
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="backdrop-blur-lg bg-white/30 rounded-xl p-6 text-center border border-white/40 animate-pulse">
                    <p className="text-sm text-slate-700 font-medium">Loading latest tech wisdom...</p>
                  </div>
                )}
                <div className="border-t border-white/20 pt-4 mt-4 text-center text-xs text-slate-600">
                  <p>✨ Curated from Dev Community | Updated daily</p>
                </div>
              </div>
            </div>

            {/* Recent Bookings Mini Section */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FaFileAlt className="text-blue-600" /> Recent Bookings
              </h2>
              {bookings.slice(0, 2).length > 0 ? (
                <div className="space-y-3">
                  {bookings.slice(0, 2).map((booking) => (
                    <div key={booking.id} className="backdrop-blur-lg bg-gradient-to-br from-white/30 to-white/10 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-white/40 hover:border-blue-300/60 hover:scale-105 transform">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-1"></div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-slate-900 text-sm truncate">{booking.service}</h3>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full backdrop-blur-md border ${
                            booking.status === 'Confirmed' ? 'bg-green-400/30 text-green-700 border-green-300/50' :
                            booking.status === 'Pending' ? 'bg-yellow-400/30 text-yellow-700 border-yellow-300/50' :
                            'bg-red-400/30 text-red-700 border-red-300/50'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 space-y-1 mb-3">
                          <p>📅 {booking.date}</p>
                          <p>⏰ {booking.time}</p>
                        </div>
                        <button
                          onClick={() => handleNavigate('bookingdetails', booking)}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold py-1 rounded transition-colors hover:shadow-lg"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="backdrop-blur-lg bg-gradient-to-br from-blue-300/20 to-blue-200/10 rounded-xl p-6 text-center border-2 border-dashed border-blue-300/50">
                  <p className="text-slate-700 mb-3 font-semibold text-sm">No bookings yet</p>
                  <button
                    onClick={() => handleNavigate('newbooking')}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold py-2 px-4 rounded-lg transition-all hover:shadow-lg text-sm"
                  >
                    Book Now 🚀
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services Available Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            🎯 Our Premium Services
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.slice(0, 3).map((service, idx) => (
              <div key={service.id || idx} className="backdrop-blur-lg bg-gradient-to-br from-white/30 to-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all border border-white/40 hover:border-blue-300/60 hover:scale-105 transform cursor-pointer group">
                <div className="relative h-40 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center text-white text-center p-4 overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity"></div>
                  <div className="relative z-10">
                    {service.id !== 3 ? (
                      <span className="font-bold text-lg">{service.title}</span>
                    ) : (
                      <span className="font-bold text-5xl">🚨</span>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-700 mb-4 line-clamp-2">{service.description}</p>
                  <p className="text-lg font-semibold text-blue-600 mb-4">{service.price}</p>
                  <button
                    onClick={() => handleNavigate('newbooking', service.title)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold py-2 rounded-lg transition-colors hover:shadow-lg"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <button
              onClick={() => handleNavigate('services')}
              className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold py-3 px-8 rounded-full transition-all hover:shadow-lg hover:scale-105 transform inline-flex items-center gap-2"
            >
              View All Services <span className="text-lg">👉</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white mt-20 px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="font-bold text-lg">SlickTech</span>
            </div>
            <p className="text-sm text-gray-400">Your trusted technology partner for professional services and expertise.</p>
          </div>

          {/* Company Section */}
          <div>
            <h4 className="font-bold text-white mb-4">COMPANY</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Services</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="font-bold text-white mb-4">CONTACT INFO</h4>
            <ul className="space-y-2">
              <li className="text-sm text-gray-400 flex items-center gap-2">📞 Phone: (254)6578900</li>
              <li className="text-sm text-gray-400 flex items-center gap-2">📧 Email: company@email.com</li>
              <li className="text-sm text-gray-400 flex items-center gap-2">📍 Location: 901 Smart Street, BC</li>
            </ul>
          </div>

          {/* Social Section */}
          <div>
            <h4 className="font-bold text-white mb-4">FOLLOW US</h4>
            <div className="flex space-x-4">
              <button className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full transition-colors">
                <FaFacebook className="text-white" />
              </button>
              <button className="bg-blue-400 hover:bg-blue-500 p-2 rounded-full transition-colors">
                <FaTwitter className="text-white" />
              </button>
              <button className="bg-pink-600 hover:bg-pink-700 p-2 rounded-full transition-colors">
                <FaInstagram className="text-white" />
              </button>
              <button className="bg-blue-700 hover:bg-blue-800 p-2 rounded-full transition-colors">
                <FaLinkedin className="text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
          <p>© 2026 SlickTech Technologies | All rights reserved</p>
          <p>Crafted with ❤️ by SlickTech Technologies</p>
        </div>
      </footer>
    </div>
  );
};

export default UserDashboard;
