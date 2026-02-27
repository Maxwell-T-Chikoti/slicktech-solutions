"use client";

import React, { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabaseClient';
import { FaCheck, FaTimes, FaEye, FaSync } from 'react-icons/fa';
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
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
  });

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

      // Calculate metrics
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

      setMetrics({
        totalBookings: bookingsWithProfiles.length,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        totalRevenue: revenue,
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
                  <p className="text-slate-600 text-sm mt-2">Manage bookings and view metrics</p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={fetchBookingsWithProfiles}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold p-2 rounded-full transition-all"
                    title="Refresh data"
                  >
                    <FaSync />
                  </button>
                  <button
                    onClick={onLogout}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-8 rounded-xl transition-all backdrop-blur-md border border-white/20 hover:border-white/40"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics Section */}
            <div className="px-6 py-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-8">Key Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div 
                  onClick={() => setViewAnalytics('bookings')}
                  className="backdrop-blur-xl bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-2xl p-6 border border-blue-200/40 hover:border-blue-300/60 transition-all hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer"
                >
                  <p className="text-slate-700 text-sm font-semibold">Total Bookings</p>
                  <p className="text-4xl font-bold text-slate-900 mt-3">{metrics.totalBookings}</p>
                </div>
                <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-2xl p-6 border border-yellow-200/40 hover:border-yellow-300/60 transition-all hover:shadow-2xl hover:shadow-yellow-500/20">
                  <p className="text-slate-700 text-sm font-semibold">Pending Bookings</p>
                  <p className="text-4xl font-bold text-slate-900 mt-3">{metrics.pendingBookings}</p>
                </div>
                <div className="backdrop-blur-xl bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-2xl p-6 border border-green-200/40 hover:border-green-300/60 transition-all hover:shadow-2xl hover:shadow-green-500/20">
                  <p className="text-slate-700 text-sm font-semibold">Confirmed Bookings</p>
                  <p className="text-4xl font-bold text-slate-900 mt-3">{metrics.confirmedBookings}</p>
                </div>
                <div 
                  onClick={() => setViewAnalytics('revenue')}
                  className="backdrop-blur-xl bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-2xl p-6 border border-purple-200/40 hover:border-purple-300/60 transition-all hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer"
                >
                  <p className="text-slate-700 text-sm font-semibold">Total Revenue</p>
                  <p className="text-4xl font-bold text-slate-900 mt-3">${metrics.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="px-6 pb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-8">All Bookings</h2>
              {bookings.length === 0 ? (
                <div className="backdrop-blur-xl bg-white/40 rounded-2xl border border-gray-200 p-12 text-center">
                  <p className="text-slate-600 text-lg">No bookings found.</p>
                </div>
              ) : (
                <div className="backdrop-blur-xl bg-white/40 rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
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
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-white/30 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">{booking.user_name}</p>
                              <p className="text-xs text-slate-600">{booking.user_email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-800">{booking.service}</td>
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
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-4 rounded-lg text-sm font-semibold inline-flex items-center gap-2 backdrop-blur-md border border-blue-300 hover:border-blue-400 transition-all"
                            >
                              <FaEye /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
