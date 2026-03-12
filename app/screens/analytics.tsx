"use client";

import React, { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabaseClient';
import { FaArrowLeft } from 'react-icons/fa';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface AnalyticsScreenProps {
  onBack: () => void;
  chartType: 'bookings' | 'revenue' | 'busiest-days' | 'popular-services';
}

interface DailyData {
  date: string;
  bookings?: number;
  revenue?: number;
}

interface DayOfWeekData {
  day: string;
  bookings: number;
}

interface ServiceData {
  service: string;
  bookings: number;
  revenue: number;
}

const AnalyticsScreen = ({ onBack, chartType }: AnalyticsScreenProps) => {
  const [data, setData] = useState<DailyData[]>([]);
  const [dayOfWeekData, setDayOfWeekData] = useState<DayOfWeekData[]>([]);
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);

      // Fetch all bookings
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching analytics:', error);
        setLoading(false);
        return;
      }

      if (bookingsData) {
        // Group by date and calculate metrics
        const dailyMap: { [key: string]: { bookings: number; revenue: number } } = {};

        for (const booking of bookingsData) {
          const date = booking.date;
          if (!dailyMap[date]) {
            dailyMap[date] = { bookings: 0, revenue: 0 };
          }

          dailyMap[date].bookings += 1;

          // Fetch service price for revenue calculation
          if (booking.status === 'Confirmed') {
            const { data: serviceData } = await supabase
              .from('services')
              .select('price')
              .eq('title', booking.service)
              .single();

            if (serviceData) {
              const priceNum = parseFloat(serviceData.price?.replace(/[^0-9.]/g, '') || '0');
              dailyMap[date].revenue += priceNum;
            }
          }
        }

        // Convert to array and sort by date
        const chartData = Object.entries(dailyMap)
          .map(([date, values]) => ({
            date,
            bookings: values.bookings,
            revenue: Math.round(values.revenue * 100) / 100,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setData(chartData);

        // Calculate day of week data for busiest-days chart
        if (chartType === 'busiest-days') {
          const dayOfWeekMap: { [key: string]: number } = {
            'Monday': 0,
            'Tuesday': 0,
            'Wednesday': 0,
            'Thursday': 0,
            'Friday': 0,
            'Saturday': 0,
            'Sunday': 0
          };

          for (const booking of bookingsData) {
            const date = new Date(booking.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            if (dayOfWeekMap.hasOwnProperty(dayName)) {
              dayOfWeekMap[dayName as keyof typeof dayOfWeekMap]++;
            }
          }

          const dayOfWeekChartData = Object.entries(dayOfWeekMap)
            .map(([day, bookings]) => ({
              day,
              bookings,
            }))
            .sort((a, b) => {
              const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
              return days.indexOf(a.day) - days.indexOf(b.day);
            });

          setDayOfWeekData(dayOfWeekChartData);
        }

        // Popular services breakdown
        if (chartType === 'popular-services') {
          const serviceMap: { [key: string]: { bookings: number; revenue: number } } = {};
          for (const booking of bookingsData) {
            const svc = booking.service || 'Unknown';
            if (!serviceMap[svc]) serviceMap[svc] = { bookings: 0, revenue: 0 };
            serviceMap[svc].bookings += 1;
            if (booking.status === 'Confirmed' || booking.status === 'Complete') {
              const priceNum = parseFloat(booking.price?.replace(/[^0-9.]/g, '') || '0');
              serviceMap[svc].revenue += priceNum;
            }
          }
          const svcChartData = Object.entries(serviceMap)
            .map(([service, vals]) => ({ service, bookings: vals.bookings, revenue: Math.round(vals.revenue * 100) / 100 }))
            .sort((a, b) => b.bookings - a.bookings);
          setServiceData(svcChartData);
        }
      }

      setLoading(false);
    };

    fetchAnalytics();
  }, []);

  const title = chartType === 'bookings' ? 'Booking History' : chartType === 'revenue' ? 'Revenue History' : chartType === 'busiest-days' ? 'Busiest Days Analysis' : 'Popular Services';
  const dataKey = chartType === 'bookings' ? 'bookings' : chartType === 'revenue' ? 'revenue' : 'bookings';

  return (
    <div className="min-h-screen bg-white">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-white/40 to-white/20 border-b border-gray-200 px-6 py-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <FaArrowLeft /> Back
            </button>
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-12">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-300 h-16 w-16"></div>
            </div>
          ) : (chartType === 'busiest-days' ? dayOfWeekData.length === 0 : chartType === 'popular-services' ? serviceData.length === 0 : data.length === 0) ? (
            <div className="backdrop-blur-xl bg-white/40 rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-slate-600 text-lg">No data available yet.</p>
            </div>
          ) : (
            <div className="backdrop-blur-xl bg-white/40 rounded-2xl border border-gray-200 p-8">
              <ResponsiveContainer width="100%" height={400}>
                {chartType === 'popular-services' ? (
                  <BarChart data={serviceData} margin={{ top: 5, right: 30, left: 0, bottom: 60 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis type="number" stroke="rgba(0,0,0,0.6)" tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="service"
                      stroke="rgba(0,0,0,0.6)"
                      tick={{ fontSize: 11 }}
                      width={130}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '2px solid rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px' }}
                      formatter={(value: any, name: string) => [name === 'revenue' ? `R${value.toFixed(2)}` : value, name === 'revenue' ? 'Revenue' : 'Bookings']}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="bookings" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Bookings" />
                    <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} name="Revenue (R)" />
                  </BarChart>
                ) : chartType === 'busiest-days' ? (
                  <BarChart data={dayOfWeekData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis 
                      dataKey="day" 
                      stroke="rgba(0,0,0,0.6)"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="rgba(0,0,0,0.6)"
                      tick={{ fontSize: 12 }}
                      label={{ 
                        value: 'Number of Bookings',
                        angle: -90,
                        position: 'insideLeft'
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '2px solid rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                      }}
                      formatter={(value: any) => [value, 'Bookings']}
                    />
                    <Bar 
                      dataKey="bookings" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                      name="Weekly Bookings"
                    />
                  </BarChart>
                ) : (
                  <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(0,0,0,0.6)"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="rgba(0,0,0,0.6)"
                      tick={{ fontSize: 12 }}
                      label={{ 
                        value: chartType === 'bookings' ? 'Number of Bookings' : 'Revenue ($)',
                        angle: -90,
                        position: 'insideLeft'
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '2px solid rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                      }}
                      formatter={(value: any) => {
                        if (chartType === 'revenue') {
                          return [`$${value.toFixed(2)}`, 'Revenue'];
                        }
                        return [value, 'Bookings'];
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                    <Line
                      type="monotone"
                      dataKey={dataKey}
                      stroke={chartType === 'bookings' ? '#3b82f6' : '#10b981'}
                      strokeWidth={3}
                      dot={{ fill: chartType === 'bookings' ? '#3b82f6' : '#10b981', r: 5 }}
                      activeDot={{ r: 7 }}
                      name={chartType === 'bookings' ? 'Daily Bookings' : 'Daily Revenue'}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>

              {/* Stats Summary */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="backdrop-blur-lg bg-white/60 rounded-2xl p-6 border border-gray-200">
                  <p className="text-slate-600 text-sm font-semibold">Total Bookings</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {chartType === 'popular-services'
                      ? serviceData.reduce((s, d) => s + d.bookings, 0)
                      : chartType === 'busiest-days'
                      ? dayOfWeekData.reduce((sum, d) => sum + d.bookings, 0)
                      : chartType === 'bookings'
                      ? data.reduce((sum, d) => sum + (d.bookings || 0), 0)
                      : `R${data.reduce((sum, d) => sum + (d.revenue || 0), 0).toFixed(2)}`}
                  </p>
                </div>
                <div className="backdrop-blur-lg bg-white/60 rounded-2xl p-6 border border-gray-200">
                  <p className="text-slate-600 text-sm font-semibold">
                    {chartType === 'popular-services' ? 'Total Revenue' : chartType === 'busiest-days' ? 'Average per Weekday' : 'Average per Day'}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {chartType === 'popular-services'
                      ? `R${serviceData.reduce((s, d) => s + d.revenue, 0).toFixed(2)}`
                      : chartType === 'busiest-days'
                      ? (dayOfWeekData.reduce((sum, d) => sum + d.bookings, 0) / (dayOfWeekData.length || 1)).toFixed(1)
                      : chartType === 'bookings'
                      ? (data.reduce((sum, d) => sum + (d.bookings || 0), 0) / (data.length || 1)).toFixed(1)
                      : `R${(data.reduce((sum, d) => sum + (d.revenue || 0), 0) / (data.length || 1)).toFixed(2)}`}
                  </p>
                </div>
                <div className="backdrop-blur-lg bg-white/60 rounded-2xl p-6 border border-gray-200">
                  <p className="text-slate-600 text-sm font-semibold">
                    {chartType === 'popular-services' ? 'Most Booked Service' : chartType === 'busiest-days' ? 'Busiest Day' : 'Peak Day'}
                  </p>
                  <p className="text-xl font-bold text-slate-900 mt-2">
                    {chartType === 'popular-services'
                      ? (serviceData[0]?.service ?? 'N/A')
                      : chartType === 'busiest-days'
                      ? (() => {
                          const maxBookings = Math.max(...dayOfWeekData.map(d => d.bookings));
                          const busiestDay = dayOfWeekData.find(d => d.bookings === maxBookings);
                          return busiestDay ? busiestDay.day : 'N/A';
                        })()
                      : chartType === 'bookings'
                      ? Math.max(...data.map(d => d.bookings || 0))
                      : `R${Math.max(...data.map(d => d.revenue || 0)).toFixed(2)}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsScreen;
