"use client";

import React, { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import supabase from '@/app/lib/supabaseClient';

interface NewBookingScreenProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  selectedService?: string;
}

const NewBookingScreen = ({ onNavigate, onLogout, selectedService }: NewBookingScreenProps) => {
  const [bookingData, setBookingData] = useState({
    service: selectedService || '',
    date: '',
    time: '9:00 AM',
    extraServices: '',
    description: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const [services, setServices] = useState<string[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // fetch services from database
  React.useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from('services').select('title').order('id');
      if (error) {
        console.error('Error fetching services in newbooking:', error);
        console.error('Error JSON:', JSON.stringify(error, null, 2));
        console.error('error details:', error);
      } else if (data) {
        setServices(data.map((s: any) => s.title));
      }
      setLoadingServices(false);
    };
    fetch();
  }, []);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingData({
      ...bookingData,
      [name]: value
    });
  };

  const handleDateChange = (date: string) => {
    setBookingData({
      ...bookingData,
      date: date
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData.service || !bookingData.date) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const insertObj: any = {
        service: bookingData.service,
        date: bookingData.date,
        time: bookingData.time,
        extra_services: bookingData.extraServices,
        description: bookingData.description,
        status: 'Pending',
        reschedules: 0,
        location: '',
        price: '',
      };

      if (user) {
        insertObj.user_id = user.id;
      }

      const { data, error } = await supabase.from('bookings').insert([insertObj]);
      if (error) {
        console.error('Error inserting booking:', error);
        console.error('Error as JSON:', JSON.stringify(error, null, 2));
        console.error('error details:', error);
        alert('There was an error saving your booking. Please try again.');
      } else {
        console.log('Booking inserted:', data);
        setBookingConfirmed(true);
        // navigate to bookings page immediately so the new record is visible
        onNavigate('bookings');
      }
    } catch (err) {
      console.error('Unexpected error inserting booking:', err);
    }

    setIsLoading(false);
    setBookingConfirmed(true);
  };

  if (loadingServices) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="bookings" onNavigate={onNavigate} onLogout={onLogout} />
        
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-blue-700 rounded-full animate-spin"></div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing your booking...</h2>
            <p className="text-gray-600">Please wait while we confirm your appointment</p>
          </div>
        </div>
      </div>
    );
  }

  if (bookingConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="bookings" onNavigate={onNavigate} onLogout={onLogout} />
        
        <div className="px-4 md:px-8 py-8">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Booking Confirmed</h1>
            
            <p className="text-lg text-gray-700 mb-6">Your appointment has been successfully scheduled.</p>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded">
              <h3 className="font-bold text-slate-900 mb-4">Your Appointment Details:</h3>
              <div className="space-y-2 text-gray-700">
                <p><span className="font-semibold">Service:</span> {bookingData.service}</p>
                <p><span className="font-semibold">Date:</span> {bookingData.date}</p>
                <p><span className="font-semibold">Time:</span> {bookingData.time}</p>
                {bookingData.extraServices && (
                  <p><span className="font-semibold">Extra Services:</span> {bookingData.extraServices}</p>
                )}
              </div>
            </div>

            <div className="text-gray-700 space-y-4 mb-8">
              <p>A confirmation with your booking details has been sent to your email and phone.</p>
              
              <p>If you need to reschedule or cancel, you can manage your booking from your dashboard.<br />We look forward to seeing you.</p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="2" />
                  <path
                    d="M 35 50 L 45 60 L 70 35"
                    stroke="#10b981"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <button
              onClick={() => onNavigate('home')}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-6 rounded transition-colors text-lg"
            >
              Go to dashboard
            </button>
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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="bookings" onNavigate={onNavigate} onLogout={onLogout} />

      <div className="px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">New Booking</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Service and Extra Services */}
              <div className="space-y-6">
                {/* Select Service Required */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Service Required</label>
                  <select
                    name="service"
                    value={bookingData.service}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-full px-4 py-3 text-gray-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose a service...</option>
                    {services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Options */}
                {bookingData.service && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm font-semibold text-slate-900 mb-3">Included Services:</p>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center">
                        <span className="text-blue-600 mr-2">✓</span> {bookingData.service}
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-gray-400 mr-2">✓</span> Quick consultation included
                      </li>
                      <li className="flex items-center text-gray-600">
                        <span className="text-gray-400 mr-2">✓</span> Professional assessment
                      </li>
                    </ul>
                  </div>
                )}

                {/* Extra Services Required */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Extra Services Required</label>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-3">
                    <p className="text-xs text-gray-600">Specify if there are any extra services that will be needed with your booking.</p>
                  </div>
                  <textarea
                    name="extraServices"
                    value={bookingData.extraServices}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Describe any additional services you may require..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Right Column - Date, Time, and Description */}
              <div className="space-y-6">
                {/* Date and Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Pick Appointment Date and Time</label>
                  <div className="bg-white rounded-lg p-4 border border-gray-300">
                    {/* Simple date picker */}
                    <div className="flex items-center justify-between mb-4">
                      <button type="button" className="text-gray-600 hover:text-slate-900">
                        <FaChevronLeft />
                      </button>
                      <span className="text-sm font-semibold text-slate-900">April 2026</span>
                      <button type="button" className="text-gray-600 hover:text-slate-900">
                        <FaChevronRight />
                      </button>
                    </div>

                    {/* Simple calendar grid */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-xs font-semibold text-gray-600">
                          {day}
                        </div>
                      ))}
                      {Array.from({ length: 30 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleDateChange(`April ${i + 1}, 2026`)}
                          className={`text-center text-sm py-2 rounded ${
                            bookingData.date === `April ${i + 1}, 2026`
                              ? 'bg-blue-700 text-white font-bold'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    {/* Time Selection */}
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-2 block">Time</label>
                      <select
                        name="time"
                        value={bookingData.time}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500"
                      >
                        <option>9:00 AM</option>
                        <option>10:00 AM</option>
                        <option>11:00 AM</option>
                        <option>1:00 PM</option>
                        <option>2:00 PM</option>
                        <option>3:00 PM</option>
                        <option>4:00 PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description of Problem to be picked */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Description of Problem to be picked</label>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-3">
                    <p className="text-xs text-gray-600">Enter an objective... (To narrow forward configurations and server intricate logic.</p>
                  </div>
                  <textarea
                    name="description"
                    value={bookingData.description}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Describe the issue or problem you need help with..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-16 rounded transition-colors text-lg"
              >
                SUBMIT
              </button>
            </div>
          </form>
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

export default NewBookingScreen;
