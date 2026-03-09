"use client";

import React, { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import supabase from '@/app/lib/supabaseClient';

interface BookingDetailsProps {
  booking: any;
  setBookings: React.Dispatch<React.SetStateAction<any[]>>;
  onNavigate: (page: string, payload?: any) => void;
  onLogout: () => void;
  startReschedule?: boolean;
}

const ALL_TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

const BookingDetails = ({ booking, setBookings, onNavigate, onLogout, startReschedule = false }: BookingDetailsProps) => {
  const [rescheduling, setRescheduling] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('');

  // bookedSlots: a Set of "date||time" strings pulled directly from DB
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Date picker state
  const [currentDate] = useState(new Date());
  const [displayMonth, setDisplayMonth] = useState(currentDate.getMonth());
  const [displayYear, setDisplayYear] = useState(currentDate.getFullYear());

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const handlePreviousMonth = () => {
    if (displayMonth === 0) { setDisplayMonth(11); setDisplayYear(displayYear - 1); }
    else setDisplayMonth(displayMonth - 1);
  };

  const handleNextMonth = () => {
    if (displayMonth === 11) { setDisplayMonth(0); setDisplayYear(displayYear + 1); }
    else setDisplayMonth(displayMonth + 1);
  };

  const isDatePassed = (month: number, day: number, year: number) => {
    const selected = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today;
  };

  // A day is fully booked only if every time slot on that day is taken
  const isDateFullyBooked = (month: number, day: number, year: number) => {
    const dateStr = `${monthNames[month]} ${day}, ${year}`;
    return ALL_TIME_SLOTS.every(slot => bookedSlots.has(`${dateStr}||${slot}`));
  };

  // A specific time slot is booked on the currently selected date
  const isTimeSlotBooked = (time: string) => {
    if (!tempDate) return false;
    return bookedSlots.has(`${tempDate}||${time}`);
  };

  // Fetch ALL confirmed bookings from DB except the current one, build a Set of "date||time" keys
  const fetchBookedSlots = async () => {
    setLoadingSlots(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('date, time, status, id')
        .eq('status', 'Confirmed')
        .neq('id', booking.id);

      if (error) {
        console.error('Error fetching booked slots:', error);
        return;
      }

      console.log('Raw DB confirmed bookings (excluding current):', data);

      const slots = new Set<string>();
      data?.forEach(b => {
        if (b.date && b.time) {
          slots.add(`${b.date}||${b.time}`);
        }
      });

      console.log('Booked slots set:', Array.from(slots));
      setBookedSlots(slots);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Fetch when rescheduling panel opens
  React.useEffect(() => {
    if (rescheduling && booking?.id) {
      fetchBookedSlots();
    }
  }, [rescheduling, booking?.id]);

  React.useEffect(() => {
    if (startReschedule && booking && booking.reschedules < 1) {
      setRescheduling(true);
    }
  }, [startReschedule, booking]);

  const handleDateSelect = (dateStr: string) => {
    setTempDate(dateStr);
    setTempTime(''); // reset time when date changes
  };

  const handleSaveReschedule = async () => {
    if (!tempDate || !tempTime) {
      alert('Please select both a date and time');
      return;
    }

    // Final fresh DB check right before saving to catch race conditions
    const { data: latestBookings, error } = await supabase
      .from('bookings')
      .select('date, time, status, id')
      .eq('status', 'Confirmed')
      .neq('id', booking.id);

    if (error) {
      console.error('Error during final availability check:', error);
      alert('Something went wrong. Please try again.');
      return;
    }

    const isSlotTaken = latestBookings?.some(b => b.date === tempDate && b.time === tempTime);

    if (isSlotTaken) {
      alert('❌ This date and time slot is already booked. Please select a different time.');
      // Refresh booked slots so UI reflects latest data
      await fetchBookedSlots();
      setTempTime('');
      return;
    }

    // Save to DB
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ date: tempDate, time: tempTime, reschedules: booking.reschedules + 1 })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      alert('Failed to save reschedule. Please try again.');
      return;
    }

    // Update local state
    setBookings(prev =>
      prev.map(b =>
        b.id === booking.id
          ? { ...b, date: tempDate, time: tempTime, reschedules: (b.reschedules || 0) + 1 }
          : b
      )
    );

    setRescheduling(false);
    onNavigate('bookings');
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setBookings(prev => prev.filter(b => b.id !== booking.id));
      onNavigate('bookings');
      const { error } = await supabase.from('bookings').delete().eq('id', booking.id);
      if (error) console.error('Error deleting booking:', error);
    }
  };

  const handleStartReschedule = () => {
    if (booking.reschedules >= 1) return;
    setRescheduling(true);
  };

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No booking selected.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar currentPage="bookings" onNavigate={onNavigate} onLogout={onLogout} />

      <div className="px-4 md:px-8 py-8 max-w-2xl mx-auto">
        <button
          onClick={() => onNavigate('bookings')}
          className="text-blue-600 hover:text-blue-800 font-semibold mb-6 flex items-center space-x-2 transition-colors"
        >
          <FaChevronLeft />
          <span>Back to bookings</span>
        </button>

        <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">Booking Details</h1>

          <div className="space-y-4 mb-8 pb-8 border-b border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Service</p>
                <p className="text-lg font-bold text-slate-900">{booking.service}</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                <p className={`text-lg font-bold ${booking.status === 'Confirmed' ? 'text-emerald-600' : 'text-orange-600'}`}>{booking.status}</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</p>
                <p className="text-lg font-bold text-slate-900 flex items-center gap-2"><FaCalendarAlt className="text-blue-600" /> {booking.date}</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Time</p>
                <p className="text-lg font-bold text-slate-900 flex items-center gap-2"><FaClock className="text-blue-600" /> {booking.time}</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Location</p>
                <p className="text-lg font-bold text-slate-900 flex items-center gap-2"><FaMapMarkerAlt className="text-blue-600" /> {booking.location}</p>
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Price</p>
                <p className="text-lg font-bold text-blue-600">{booking.price}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</p>
              <p className="text-slate-700 leading-relaxed">{booking.description}</p>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Reschedules Used</p>
              <p className="text-lg font-bold text-slate-900">{booking.reschedules || 0}/1</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleStartReschedule}
              disabled={booking.reschedules >= 1}
              className={`flex-1 py-3 px-6 font-black rounded-xl transition-all ${booking.reschedules >= 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'}`}
            >
              Reschedule
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3 px-6 rounded-xl transition-all shadow-lg shadow-red-200"
            >
              Cancel
            </button>
          </div>

          {rescheduling && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="font-black text-lg text-slate-900 mb-6">Pick New Date & Time</h3>

              {loadingSlots ? (
                <p className="text-sm text-slate-400 font-medium animate-pulse">Loading availability from database...</p>
              ) : (
                <>
                  {/* Calendar picker */}
                  <div className="mb-6">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Date</label>
                    <div className="bg-white rounded-2xl p-4 border-2 border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={handlePreviousMonth} className="text-slate-600 hover:text-slate-900 font-bold">
                          <FaChevronLeft />
                        </button>
                        <span className="text-sm font-black text-slate-900">{monthNames[displayMonth]} {displayYear}</span>
                        <button type="button" onClick={handleNextMonth} className="text-slate-600 hover:text-slate-900 font-bold">
                          <FaChevronRight />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-2 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-xs font-black text-slate-500">{day}</div>
                        ))}
                        {Array.from({ length: getFirstDayOfMonth(displayMonth, displayYear) }).map((_, i) => (
                          <div key={`empty-${i}`} className="text-center text-sm py-2" />
                        ))}
                        {Array.from({ length: getDaysInMonth(displayMonth, displayYear) }).map((_, i) => {
                          const dateStr = `${monthNames[displayMonth]} ${i + 1}, ${displayYear}`;
                          const isPassed = isDatePassed(displayMonth, i + 1, displayYear);
                          const isFullyBooked = isDateFullyBooked(displayMonth, i + 1, displayYear);
                          const isDisabled = isPassed || isFullyBooked;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => !isDisabled && handleDateSelect(dateStr)}
                              disabled={isDisabled}
                              className={`text-center text-sm py-2 rounded font-bold transition-all ${
                                tempDate === dateStr
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                  : isDisabled
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-slate-50 text-slate-900 hover:bg-blue-100'
                              }`}
                              title={isFullyBooked ? 'All slots on this day are booked' : isPassed ? 'Date has passed' : ''}
                            >
                              {i + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Time picker - only shown after date is selected */}
                  <div className="mb-6">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Time</label>
                    {!tempDate ? (
                      <p className="text-sm text-slate-400 font-medium">Please select a date first.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {ALL_TIME_SLOTS.map(time => {
                            const isBooked = isTimeSlotBooked(time);
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => !isBooked && setTempTime(time)}
                                disabled={isBooked}
                                className={`py-3 px-4 rounded-xl font-bold transition-all ${
                                  tempTime === time
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : isBooked
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                                    : 'bg-slate-50 text-slate-900 hover:bg-blue-100 border border-slate-200'
                                }`}
                                title={isBooked ? 'This time slot is already booked' : ''}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-slate-500 mt-3 font-medium">
                          Selected date: <span className="font-bold text-slate-900">{tempDate}</span>
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Action buttons */}
              <div className="flex gap-4 pt-6 border-t border-slate-200">
                <button
                  onClick={handleSaveReschedule}
                  disabled={loadingSlots}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-200"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => { setRescheduling(false); setTempDate(''); setTempTime(''); }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-black py-3 px-6 rounded-xl transition-all"
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
