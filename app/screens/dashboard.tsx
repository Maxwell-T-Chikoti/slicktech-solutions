"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
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

  // global bookings state
  const [bookings, setBookings] = useState<any[]>([]);

  const fetchBookings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase.from('bookings').select('*').order('id', { ascending: false });
    if (user) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching bookings:', error);
    } else if (data) {
      setBookings(data as any[]);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);


  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
  const [selectedBooking, setSelectedBooking] = useState<any | undefined>(undefined);
  const [initialReschedule, setInitialReschedule] = useState(false);

  const [services, setServices] = useState<any[]>([]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <Navbar currentPage="home" onNavigate={handleNavigate} onLogout={handleLogout} />

      {/* Main Content */}
      <div className="px-4 md:px-8 py-8">
        {/* My Bookings Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">My Bookings</h2>
          {bookings.slice(0,2).map((booking) => (
            <div key={booking.id} className="bg-blue-50 rounded-lg p-6 mb-6 border-l-4 border-blue-500">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center text-lg">
                    📋
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">{booking.service}</h3>
                    <p className="text-xs text-gray-600 mb-2">Price Details</p>
                    <p className="text-xs text-gray-500">{booking.price}</p>
                    <p className="text-xs text-gray-400 mt-2">{booking.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleNavigate('bookingdetails', booking)}
                  className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-6 py-2 rounded"
                >
                  View Booking
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={() => handleNavigate('newbooking')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-colors"
          >
            Book an Appointment
          </button>
        </div>

        {/* Services Available Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Services Available</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.slice(0, 3).map((service, idx) => (
              <div key={service.id || idx} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className={`h-40 ${service.image || ''} flex items-center justify-center text-white text-center p-4`}>
                  {service.id !== 3 ? (
                    <span className="font-bold text-lg">{service.title}</span>
                  ) : (
                    <span className="font-bold text-6xl text-red-600">EMERGENCY</span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-600 mb-4">{service.description}</p>
                  <p className="text-sm font-semibold text-gray-700 mb-4">{service.price}</p>
                  <button
                    onClick={() => handleNavigate('services')}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2 rounded"
                  >
                    See more
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-200 mt-12 px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gray-400 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="font-bold text-slate-800">SlickTech</span>
            </div>
            <p className="text-xs text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor</p>
          </div>

          {/* Company Section */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4">COMPANY</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-xs text-gray-600 hover:text-slate-900">About Us</a></li>
              <li><a href="#" className="text-xs text-gray-600 hover:text-slate-900">Services</a></li>
              <li><a href="#" className="text-xs text-gray-600 hover:text-slate-900">Contact Us</a></li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4">CONTACT INFO</h4>
            <ul className="space-y-2">
              <li className="text-xs text-gray-600">Phone: (254)6578900</li>
              <li className="text-xs text-gray-600">Email: company@email.com</li>
              <li className="text-xs text-gray-600">Location: 901 Smart Street, BC</li>
            </ul>
          </div>

          {/* Social Section */}
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

export default UserDashboard;
