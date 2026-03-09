"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTrash } from 'react-icons/fa';
import supabase from '@/app/lib/supabaseClient';

interface BookingsScreenProps {
  bookings: any[];
  setBookings: React.Dispatch<React.SetStateAction<any[]>>;
  onNavigate: (page: string, payload?: any) => void;
  onLogout: () => void;
  isLoading?: boolean;
}

const BookingsScreen = ({ bookings, setBookings, onNavigate, onLogout, isLoading = false }: BookingsScreenProps) => {
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    // Show loading animation for at least 1 second
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // bookings and setBookings are managed by parent (UserDashboard)

  const handleCancelBooking = async (id: number) => {
    // remove locally
    setBookings(bookings.filter(booking => booking.id !== id));

    // remove from database
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) {
      console.error('Error deleting booking:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (localLoading || isLoading) {
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
          <div className="mb-12">
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="w-80 h-5 bg-gray-200 rounded animate-pulse mb-8"></div>

            {/* Booking Cards Skeleton */}
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Section */}
                    <div>
                      <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="w-48 h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Middle Section */}
                    <div className="flex flex-col items-center justify-center border-l border-r border-gray-200">
                      <div className="w-20 h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
                      <div className="w-24 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>

                    {/* Right Section */}
                    <div className="flex flex-col items-end justify-between">
                      <div className="space-y-2 w-full md:w-auto">
                        <div className="w-full md:w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-full md:w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="mt-4 flex items-center space-x-1">
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <Navbar currentPage="bookings" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <div className="px-4 md:px-8 py-8">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Bookings</h1>
          <p className="text-gray-600 mb-8">View and manage all your appointments and bookings</p>

          {bookings.length > 0 ? (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Section - Service Info */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{booking.service}</h3>
                      <p className="text-sm text-gray-600 mb-4">{booking.description}</p>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                        <FaCalendarAlt className="text-blue-600" />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                        <FaClock className="text-blue-600" />
                        <span>{booking.time}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <FaMapMarkerAlt className="text-blue-600" />
                        <span>{booking.location}</span>
                      </div>
                    </div>

                    {/* Middle Section - Price and Status */}
                    <div className="flex flex-col items-center justify-center border-l border-r border-gray-200">
                      <p className="text-2xl font-bold text-slate-900 mb-4">{booking.price}</p>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex flex-col items-end justify-between">
                      <div className="space-y-2 w-full md:w-auto">
                        <button 
                          onClick={() => onNavigate('bookingdetails', booking)}
                          className="w-full md:w-32 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold py-2 px-4 rounded transition-colors"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => onNavigate('bookingdetails', { booking, reschedule: true })}
                          className="w-full md:w-32 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-bold py-2 px-4 rounded transition-colors"
                        >
                          Reschedule
                        </button>
                      </div>
                      <button 
                        onClick={() => handleCancelBooking(booking.id)}
                        className="mt-4 text-red-600 hover:text-red-800 flex items-center space-x-1 text-sm"
                      >
                        <FaTrash className="text-xs" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 text-lg mb-6">You have no bookings yet.</p>
              <button 
                onClick={() => onNavigate('services')}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded transition-colors"
              >
                Browse Services
              </button>
            </div>
          )}
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
};

export default BookingsScreen;
