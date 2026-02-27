"use client";

import React, { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabaseClient';
import { FaCheck, FaTimes, FaEye, FaSync, FaChartBar, FaDownload, FaSearch, FaClock, FaUsers, FaSmile, FaArrowUp } from 'react-icons/fa';
import AnalyticsScreen from './analytics';

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
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [bookings, setBookings] = useState<BookingWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithProfile | null>(null);
  const [viewAnalytics, setViewAnalytics] = useState<'bookings' | 'revenue' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [newBookingAlert, setNewBookingAlert] = useState<BookingWithProfile | null>(null);
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    completionRate: 0,
    averageRating: 4.8,
    topService: '',
    customerCount: 0,
  });
  const [serviceBreakdown, setServiceBreakdown] = useState<any[]>([]);

  const fetchBookingsWithProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      alert(`Error fetching bookings: ${error.message}`);
      setLoading(false);
      return;
    }

    if (data) {
      // Fetch user profiles for each booking
      const bookingsWithProfiles = await Promise.all(
        data.map(async (booking: any) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email, first_name, surname')
            .eq('id', booking.user_id)
            .single();

          // Fetch service price
          const { data: serviceData } = await supabase
            .from('services')
            .select('price')
            .eq('title', booking.service)
            .single();

          return {
            ...booking,
            user_email: profileData?.email,
            user_name: profileData ? `${profileData.first_name} ${profileData.surname}` : 'Unknown User',
            service_price: serviceData?.price || booking.price,
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

      setMetrics({
        totalBookings: bookingsWithProfiles.length,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        totalRevenue: revenue,
        completionRate: completionRate,
        averageRating: 4.8,
        topService: topService,
        customerCount: uniqueCustomers,
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
      alert('Failed to update booking status');
    } else {
      setSelectedBooking(null);
      fetchBookingsWithProfiles();
    }
  };

  // Filter bookings based on search and status
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Export bookings to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Client Name', 'Email', 'Service', 'Date', 'Time', 'Status', 'Price'];
    const rows = bookings.map((b) => [
      b.id,
      b.user_name,
      b.user_email,
      b.service,
      b.date,
      b.time,
      b.status,
      b.price,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
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
                  <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
                  <p className="text-slate-600 text-sm mt-2">Manage bookings, track revenue, and analyze performance</p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={fetchBookingsWithProfiles}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold p-2 rounded-full transition-all hover:scale-110"
                    title="Refresh data"
                  >
                    <FaSync className={showNotifications ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                    title="Export to CSV"
                  >
                    <FaDownload /> Export
                  </button>
                  <button
                    onClick={onLogout}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-8 rounded-xl transition-all backdrop-blur-md border border-white/20 hover:border-white/40"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
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
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

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
                <div className="backdrop-blur-xl bg-gradient-to-br from-indigo-400/20 to-indigo-600/20 rounded-2xl p-6 border border-indigo-200/40 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-700 text-sm font-semibold">Completion Rate</p>
                    <FaSmile className="text-indigo-500 text-lg" />
                  </div>
                  <p className="text-4xl font-bold text-slate-900 mt-3">{metrics.completionRate}%</p>
                  <p className="text-xs text-slate-600 mt-2">of bookings confirmed</p>
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

            {/* Bookings Table */}
            <div className="px-6 pb-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900">📋 Booking Management</h2>
                <span className="text-sm text-slate-600 bg-white/60 px-4 py-2 rounded-lg">
                  Showing {filteredBookings.length} of {bookings.length} bookings
                </span>
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
                              : selectedBooking.status === 'Rejected'
                              ? 'bg-red-100/80 text-red-700 border-red-300'
                              : 'bg-yellow-100/80 text-yellow-700 border-yellow-300'
                          }`}>
                            {selectedBooking.status}
                          </span>
                        </div>
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
                            onClick={() => setSelectedBooking(null)}
                            className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white py-3 px-4 rounded-xl font-semibold transition-all backdrop-blur-md border border-gray-300 hover:border-gray-400"
                          >
                            Close
                          </button>
                        </div>
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
    </div>
  );
};

export default AdminDashboard;
