"use client";

import React, { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import supabase from '@/app/lib/supabaseClient';

interface BookingDetailsProps {
  booking: any;
  setBookings: React.Dispatch<React.SetStateAction<any[]>>;
  onNavigate: (page: string, payload?: any) => void;
  onLogout: () => void;
  startReschedule?: boolean;
}

const BookingDetails = ({ booking, setBookings, onNavigate, onLogout, startReschedule = false }: BookingDetailsProps) => {
  const [rescheduling, setRescheduling] = useState(false);
  const [tempDate, setTempDate] = useState(booking?.date || '');
  const [tempTime, setTempTime] = useState(booking?.time || '');
  
  // Date picker state
  const [currentDate] = useState(new Date());
  const [displayMonth, setDisplayMonth] = useState(currentDate.getMonth());
  const [displayYear, setDisplayYear] = useState(currentDate.getFullYear());

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePreviousMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  const isDatePassed = (month: number, day: number, year: number) => {
    const selectedDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };

  React.useEffect(() => {
    if (startReschedule && booking && booking.reschedules < 1) {
      setRescheduling(true);
    }
  }, [startReschedule, booking]);

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No booking selected.</p>
      </div>
    );
  }

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
      onNavigate('bookings');
      const { error } = await supabase.from('bookings').delete().eq('id', booking.id);
      if (error) console.error('Error deleting booking:', error);
    }
  };

  const handleStartReschedule = () => {
    if (booking.reschedules >= 1) return;
    setRescheduling(true);
  };

  const handleSaveReschedule = async () => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === booking.id
          ? { ...b, date: tempDate, time: tempTime, reschedules: (b.reschedules || 0) + 1 }
          : b
      )
    );
    setRescheduling(false);
    onNavigate('bookings');
    const { error } = await supabase
      .from('bookings')
      .update({ date: tempDate, time: tempTime, reschedules: booking.reschedules + 1 })
      .eq('id', booking.id);
    if (error) console.error('Error updating booking for reschedule:', error);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="bookings" onNavigate={onNavigate} onLogout={onLogout} />

      <div className="px-4 md:px-8 py-8">
        <button
          onClick={() => onNavigate('bookings')}
          className="text-blue-600 hover:underline mb-4 flex items-center space-x-2"
        >
          <FaChevronLeft />
          <span>Back to bookings</span>
        </button>

        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Booking Details</h1>

          <div className="space-y-4 text-gray-700">
            <p><span className="font-semibold">Service:</span> {booking.service}</p>
            <p><span className="font-semibold">Date:</span> {booking.date}</p>
            <p><span className="font-semibold">Time:</span> {booking.time}</p>
            <p><span className="font-semibold">Location:</span> {booking.location}</p>
            <p><span className="font-semibold">Price:</span> {booking.price}</p>
            <p><span className="font-semibold">Status:</span> {booking.status}</p>
            <p><span className="font-semibold">Description:</span> {booking.description}</p>
            <p><span className="font-semibold">Reschedules used:</span> {booking.reschedules || 0}</p>
          </div>

          <div className="mt-8 space-x-4">
            <button
              onClick={handleStartReschedule}
              disabled={booking.reschedules >= 1}
              className={`bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded ${booking.reschedules >= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Reschedule
            </button>
            <button
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded"
            >
              Cancel
            </button>
          </div>

          {rescheduling && (
            <div className="mt-8 bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-4">Pick new date & time</h3>
              
              {/* Calendar picker */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Date</label>
                <div className="bg-white rounded-lg p-4 border border-gray-300">
                  <div className="flex items-center justify-between mb-4">
                    <button type="button" onClick={handlePreviousMonth} className="text-gray-600 hover:text-slate-900">
                      <FaChevronLeft />
                    </button>
                    <span className="text-sm font-semibold text-slate-900">{monthNames[displayMonth]} {displayYear}</span>
                    <button type="button" onClick={handleNextMonth} className="text-gray-600 hover:text-slate-900">
                      <FaChevronRight />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-xs font-semibold text-gray-600">
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: getFirstDayOfMonth(displayMonth, displayYear) }).map((_, i) => (
                      <div key={`empty-${i}`} className="text-center text-sm py-2"></div>
                    ))}
                    {Array.from({ length: getDaysInMonth(displayMonth, displayYear) }).map((_, i) => {
                      const dateStr = `${monthNames[displayMonth]} ${i + 1}, ${displayYear}`;
                      const isPassed = isDatePassed(displayMonth, i + 1, displayYear);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => !isPassed && setTempDate(dateStr)}
                          disabled={isPassed}
                          className={`text-center text-sm py-2 rounded text-gray-900 font-medium ${
                            tempDate === dateStr
                              ? 'bg-blue-700 text-white font-bold'
                              : isPassed
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time picker */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                <select
                  value={tempTime}
                  onChange={(e) => setTempTime(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full text-gray-700"
                >
                  <option value="">Select a time...</option>
                  <option>9:00 AM</option>
                  <option>10:00 AM</option>
                  <option>11:00 AM</option>
                  <option>1:00 PM</option>
                  <option>2:00 PM</option>
                  <option>3:00 PM</option>
                  <option>4:00 PM</option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleSaveReschedule}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setRescheduling(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
