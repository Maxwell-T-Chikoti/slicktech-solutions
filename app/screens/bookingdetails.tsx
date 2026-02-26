"use client";

import React, { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTrash, FaChevronLeft } from 'react-icons/fa';
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
              <div className="mb-4">
                <label className="block text-sm mb-2">Date</label>
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm mb-2">Time</label>
                <input
                  type="time"
                  value={tempTime}
                  onChange={(e) => setTempTime(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                />
              </div>
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
