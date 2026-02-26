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
} from 'recharts';

interface AnalyticsScreenProps {
  onBack: () => void;
  chartType: 'bookings' | 'revenue';
}

interface DailyData {
  date: string;
  bookings?: number;
  revenue?: number;
}

const AnalyticsScreen = ({ onBack, chartType }: AnalyticsScreenProps) => {
  const [data, setData] = useState<DailyData[]>([]);
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
      }

      setLoading(false);
    };

    fetchAnalytics();
  }, []);

  const title = chartType === 'bookings' ? 'Booking History' : 'Revenue History';
  const dataKey = chartType === 'bookings' ? 'bookings' : 'revenue';

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
          ) : data.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/40 rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-slate-600 text-lg">No data available yet.</p>
            </div>
          ) : (
            <div className="backdrop-blur-xl bg-white/40 rounded-2xl border border-gray-200 p-8">
              <ResponsiveContainer width="100%" height={400}>
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
              </ResponsiveContainer>

              {/* Stats Summary */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="backdrop-blur-lg bg-white/60 rounded-2xl p-6 border border-gray-200">
                  <p className="text-slate-600 text-sm font-semibold">Total</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {chartType === 'bookings'
                      ? data.reduce((sum, d) => sum + (d.bookings || 0), 0)
                      : `$${data.reduce((sum, d) => sum + (d.revenue || 0), 0).toFixed(2)}`}
                  </p>
                </div>
                <div className="backdrop-blur-lg bg-white/60 rounded-2xl p-6 border border-gray-200">
                  <p className="text-slate-600 text-sm font-semibold">Average per Day</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {chartType === 'bookings'
                      ? (data.reduce((sum, d) => sum + (d.bookings || 0), 0) / data.length).toFixed(1)
                      : `$${(data.reduce((sum, d) => sum + (d.revenue || 0), 0) / data.length).toFixed(2)}`}
                  </p>
                </div>
                <div className="backdrop-blur-lg bg-white/60 rounded-2xl p-6 border border-gray-200">
                  <p className="text-slate-600 text-sm font-semibold">Peak Day</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {chartType === 'bookings'
                      ? Math.max(...data.map(d => d.bookings || 0))
                      : `$${Math.max(...data.map(d => d.revenue || 0)).toFixed(2)}`}
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
