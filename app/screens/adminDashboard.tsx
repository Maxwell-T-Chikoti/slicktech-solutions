"use client";

import React, { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabaseClient';
import { FaCheck, FaTimes, FaEye, FaSync, FaChartBar, FaDownload, FaSearch, FaClock, FaUsers, FaSmile, FaArrowUp, FaFilePdf, FaBell, FaCheckSquare, FaSquare, FaTrash, FaUser, FaHistory, FaFilter, FaCalendar, FaCog, FaExclamationTriangle } from 'react-icons/fa';
import AnalyticsScreen from './analytics';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import SlickTechLogo from '../Assets/SlickTech_Logo.png';

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
  const [selectedBookings, setSelectedBookings] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'activity' | 'settings'>('dashboard');
  const [customers, setCustomers] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
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
      fetchCustomers();
      logActivity('Admin logged in');

      // Set up real-time subscription for new bookings
      const channel = supabase
        .channel('bookings_changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings'
        }, (payload) => {
          addNotification(`New booking received from ${payload.new.user_id}`, 'info');
          fetchBookingsWithProfiles();
        })
        .subscribe();
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
      // Log activity
      logActivity(`Updated booking #${id} status to ${newStatus}`);
      setSelectedBooking(null);
      fetchBookingsWithProfiles();
    }
  };

  // Bulk actions
  const handleSelectAllBookings = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map(b => b.id));
    }
  };

  const handleSelectBooking = (id: number) => {
    setSelectedBookings(prev =>
      prev.includes(id)
        ? prev.filter(bid => bid !== id)
        : [...prev, id]
    );
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedBookings.length === 0) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .in('id', selectedBookings);

      if (error) throw error;

      logActivity(`Bulk updated ${selectedBookings.length} bookings to ${newStatus}`);
      setSelectedBookings([]);
      fetchBookingsWithProfiles();
    } catch (error) {
      console.error('Error bulk updating:', error);
      alert('Failed to update selected bookings');
    }
  };

  const bulkDeleteBookings = async () => {
    if (selectedBookings.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedBookings.length} bookings?`)) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .in('id', selectedBookings);

      if (error) throw error;

      logActivity(`Deleted ${selectedBookings.length} bookings`);
      setSelectedBookings([]);
      fetchBookingsWithProfiles();
    } catch (error) {
      console.error('Error deleting bookings:', error);
      alert('Failed to delete selected bookings');
    }
  };

  // Activity logging
  const logActivity = (action: string) => {
    const newActivity = {
      id: Date.now(),
      action,
      timestamp: new Date().toISOString(),
      admin: 'Admin'
    };
    setActivityLog(prev => [newActivity, ...prev.slice(0, 49)]); // Keep last 50 activities
  };

  // Customer management
  const fetchCustomers = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');

      if (profiles) {
        const customersWithStats = await Promise.all(
          profiles.map(async (profile) => {
            const { data: userBookings } = await supabase
              .from('bookings')
              .select('*')
              .eq('user_id', profile.id);

            const totalSpent = userBookings?.reduce((sum, booking) => {
              if (booking.status === 'Confirmed') {
                return sum + parseFloat(booking.price?.replace(/[^0-9.]/g, '') || '0');
              }
              return sum;
            }, 0) || 0;

            return {
              ...profile,
              totalBookings: userBookings?.length || 0,
              confirmedBookings: userBookings?.filter(b => b.status === 'Confirmed').length || 0,
              totalSpent
            };
          })
        );
        setCustomers(customersWithStats);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Notifications system
  const addNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Enhanced filtering
  const getAvailableServices = () => {
    const services = [...new Set(bookings.map(b => b.service))];
    return services;
  };

  // Filter bookings based on search, status, date range, and service
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;

    const matchesService = serviceFilter === 'all' || booking.service === serviceFilter;

    const matchesDateRange = (!dateRange.start || booking.date >= dateRange.start) &&
                            (!dateRange.end || booking.date <= dateRange.end);

    return matchesSearch && matchesStatus && matchesService && matchesDateRange;
  });

  // Export bookings to PDF
  const exportToPDF = async () => {
    const pdfContent = document.createElement('div');
    pdfContent.style.width = '210mm';
    pdfContent.style.padding = '20mm';
    pdfContent.style.fontFamily = 'Arial, sans-serif';
    pdfContent.style.backgroundColor = '#ffffff';
    pdfContent.style.position = 'absolute';
    pdfContent.style.left = '-9999px';
    pdfContent.style.top = '-9999px';
    
    const filteredBookings = bookings.filter((booking) => {
      const matchesSearch = 
        booking.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.service?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });

    pdfContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
        <img src="${SlickTechLogo.src}" alt="SlickTech Logo" style="height: 60px; margin-bottom: 15px;" />
        <h1 style="color: #1e293b; font-size: 28px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 2px;">SLICKTECH</h1>
        <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Professional Tech Solutions</p>
      </div>
      
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="color: #1e293b; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Bookings Report</h2>
        <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h3 style="color: #1e293b; font-size: 18px; font-weight: bold; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1px;">Summary Statistics</h3>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="color: #374151; font-size: 12px; font-weight: bold; margin-bottom: 5px;">Total Bookings</div>
            <div style="color: #1e293b; font-size: 20px; font-weight: bold;">${metrics.totalBookings}</div>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="color: #374151; font-size: 12px; font-weight: bold; margin-bottom: 5px;">Confirmed</div>
            <div style="color: #059669; font-size: 20px; font-weight: bold;">${metrics.confirmedBookings}</div>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="color: #374151; font-size: 12px; font-weight: bold; margin-bottom: 5px;">Pending</div>
            <div style="color: #d97706; font-size: 20px; font-weight: bold;">${metrics.pendingBookings}</div>
          </div>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="color: #374151; font-size: 12px; font-weight: bold; margin-bottom: 5px;">Revenue</div>
            <div style="color: #2563eb; font-size: 20px; font-weight: bold;">$${metrics.totalRevenue.toFixed(2)}</div>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h3 style="color: #1e293b; font-size: 18px; font-weight: bold; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 1px;">Bookings Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-weight: bold; color: #374151;">ID</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-weight: bold; color: #374151;">Client</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-weight: bold; color: #374151;">Service</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-weight: bold; color: #374151;">Date</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-weight: bold; color: #374151;">Time</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-weight: bold; color: #374151;">Status</th>
              <th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-weight: bold; color: #374151;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${filteredBookings.slice(0, 50).map(booking => `
              <tr>
                <td style="border: 1px solid #e2e8f0; padding: 6px; color: #374151;">${booking.id}</td>
                <td style="border: 1px solid #e2e8f0; padding: 6px; color: #374151;">${booking.user_name || 'N/A'}</td>
                <td style="border: 1px solid #e2e8f0; padding: 6px; color: #374151;">${booking.service}</td>
                <td style="border: 1px solid #e2e8f0; padding: 6px; color: #374151;">${booking.date}</td>
                <td style="border: 1px solid #e2e8f0; padding: 6px; color: #374151;">${booking.time}</td>
                <td style="border: 1px solid #e2e8f0; padding: 6px; color: ${booking.status === 'Confirmed' ? '#059669' : booking.status === 'Pending' ? '#d97706' : '#dc2626'}; font-weight: bold;">${booking.status}</td>
                <td style="border: 1px solid #e2e8f0; padding: 6px; color: #2563eb; font-weight: bold;">${booking.price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${filteredBookings.length > 50 ? `<p style="color: #64748b; font-size: 10px; margin-top: 10px;">Showing first 50 bookings. Total: ${filteredBookings.length} bookings.</p>` : ''}
      </div>
      
      <div style="text-align: center; border-top: 2px solid #e2e8f0; padding-top: 30px; margin-top: 40px;">
        <p style="color: #64748b; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Generated by SlickTech Admin Dashboard</p>
        <p style="color: #64748b; font-size: 8px; margin: 5px 0 0 0;">© 2026 SlickTech Technologies | All rights reserved</p>
      </div>
    `;
    
    document.body.appendChild(pdfContent);
    
    try {
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123
      });
      
      const pdf = new jsPDF();
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      
      pdf.save(`SlickTech_Bookings_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      document.body.removeChild(pdfContent);
    }
  };

  // Export KPIs to PDF with charts
  const exportKPIsToPDF = async () => {
    const pdfContent = document.createElement('div');
    pdfContent.style.width = '210mm';
    pdfContent.style.padding = '20mm';
    pdfContent.style.fontFamily = 'Arial, sans-serif';
    pdfContent.style.backgroundColor = '#ffffff';
    pdfContent.style.position = 'absolute';
    pdfContent.style.left = '-9999px';
    pdfContent.style.top = '-9999px';
    
    pdfContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
        <img src="${SlickTechLogo.src}" alt="SlickTech Logo" style="height: 60px; margin-bottom: 15px;" />
        <h1 style="color: #1e293b; font-size: 28px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 2px;">SLICKTECH</h1>
        <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Professional Tech Solutions</p>
      </div>
      
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="color: #1e293b; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px;">KPI Dashboard Report</h2>
        <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h3 style="color: #1e293b; font-size: 20px; font-weight: bold; margin: 0 0 25px 0; text-transform: uppercase; letter-spacing: 1px;">📊 Key Performance Indicators</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px;">
          <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 12px; border: 1px solid #93c5fd;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #1e40af; font-size: 14px; font-weight: bold;">Total Bookings</span>
              <span style="font-size: 20px;">📊</span>
            </div>
            <div style="font-size: 36px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">${metrics.totalBookings}</div>
            <div style="color: #64748b; font-size: 12px;">All time bookings</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 25px; border-radius: 12px; border: 1px solid #86efac;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #166534; font-size: 14px; font-weight: bold;">Confirmed Bookings</span>
              <span style="font-size: 20px;">✅</span>
            </div>
            <div style="font-size: 36px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">${metrics.confirmedBookings}</div>
            <div style="color: #64748b; font-size: 12px;">Completed bookings</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 12px; border: 1px solid #fcd34d;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #92400e; font-size: 14px; font-weight: bold;">Pending Bookings</span>
              <span style="font-size: 20px;">⏳</span>
            </div>
            <div style="font-size: 36px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">${metrics.pendingBookings}</div>
            <div style="color: #64748b; font-size: 12px;">Awaiting confirmation</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%); padding: 25px; border-radius: 12px; border: 1px solid #a78bfa;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #6b21a8; font-size: 14px; font-weight: bold;">Total Revenue</span>
              <span style="font-size: 20px;">💰</span>
            </div>
            <div style="font-size: 28px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">$${metrics.totalRevenue.toFixed(2)}</div>
            <div style="color: #64748b; font-size: 12px;">Revenue generated</div>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h3 style="color: #1e293b; font-size: 20px; font-weight: bold; margin: 0 0 25px 0; text-transform: uppercase; letter-spacing: 1px;">📈 Performance Metrics</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px;">
          <div style="background: linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%); padding: 25px; border-radius: 12px; border: 1px solid #67e8f9;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #0e7490; font-size: 14px; font-weight: bold;">Completion Rate</span>
              <span style="font-size: 20px;">🎯</span>
            </div>
            <div style="font-size: 36px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">${metrics.completionRate}%</div>
            <div style="color: #64748b; font-size: 12px;">Booking success rate</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); padding: 25px; border-radius: 12px; border: 1px solid #f9a8d4;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #be185d; font-size: 14px; font-weight: bold;">Customer Rating</span>
              <span style="font-size: 20px;">⭐</span>
            </div>
            <div style="font-size: 36px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">${metrics.averageRating}</div>
            <div style="color: #64748b; font-size: 12px;">Average satisfaction</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%); padding: 25px; border-radius: 12px; border: 1px solid #fb923c;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #c2410c; font-size: 14px; font-weight: bold;">Total Customers</span>
              <span style="font-size: 20px;">👥</span>
            </div>
            <div style="font-size: 36px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">${metrics.customerCount}</div>
            <div style="color: #64748b; font-size: 12px;">Unique customers</div>
          </div>
          
          <div style="background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%); padding: 25px; border-radius: 12px; border: 1px solid #f87171;">
            <div style="display: flex; align-items: center; justify-between; margin-bottom: 15px;">
              <span style="color: #dc2626; font-size: 14px; font-weight: bold;">Top Service</span>
              <span style="font-size: 20px;">🔥</span>
            </div>
            <div style="font-size: 20px; font-weight: bold; color: #1e293b; margin-bottom: 8px;">${metrics.topService}</div>
            <div style="color: #64748b; font-size: 12px;">Most popular service</div>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h3 style="color: #1e293b; font-size: 20px; font-weight: bold; margin: 0 0 25px 0; text-transform: uppercase; letter-spacing: 1px;">🎯 Service Performance</h3>
        <div style="background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0;">
          ${serviceBreakdown.slice(0, 8).map(service => `
            <div style="display: flex; justify-between; align-items: center; margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="flex: 1;">
                <div style="font-weight: bold; color: #1e293b; margin-bottom: 5px;">${service.service}</div>
                <div style="display: flex; gap: 20px; font-size: 12px; color: #64748b;">
                  <span>Bookings: <strong>${service.count}</strong></span>
                  <span>Revenue: <strong style="color: #059669;">$${service.revenue.toFixed(2)}</strong></span>
                </div>
              </div>
              <div style="width: 100px; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                <div style="width: ${Math.min(100, (service.revenue / (metrics.totalRevenue || 1)) * 100)}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #1d4ed8); border-radius: 4px;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="text-align: center; border-top: 2px solid #e2e8f0; padding-top: 30px; margin-top: 40px;">
        <p style="color: #64748b; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Generated by SlickTech Admin Dashboard</p>
        <p style="color: #64748b; font-size: 8px; margin: 5px 0 0 0;">© 2026 SlickTech Technologies | All rights reserved</p>
      </div>
    `;
    
    document.body.appendChild(pdfContent);
    
    try {
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123
      });
      
      const pdf = new jsPDF();
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      
      pdf.save(`SlickTech_KPI_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating KPI PDF:', error);
      alert('Failed to generate KPI PDF. Please try again.');
    } finally {
      document.body.removeChild(pdfContent);
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
                  <p className="text-slate-600 text-sm mt-2">Manage bookings, track revenue, and analyze performance</p>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold p-2 rounded-full transition-all hover:scale-110 relative"
                      title="Notifications"
                    >
                      <FaBell />
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {notifications.length}
                        </span>
                      )}
                    </button>
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="p-4 border-b border-gray-200">
                          <h3 className="font-semibold text-slate-900">Notifications</h3>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-slate-500">No notifications</div>
                          ) : (
                            notifications.map((notification) => (
                              <div key={notification.id} className={`p-3 border-b border-gray-100 hover:bg-gray-50 flex justify-between items-start`}>
                                <div className="flex-1">
                                  <p className="text-sm text-slate-800">{notification.message}</p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {new Date(notification.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                <button
                                  onClick={() => removeNotification(notification.id)}
                                  className="text-slate-400 hover:text-slate-600 ml-2"
                                >
                                  ×
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={fetchBookingsWithProfiles}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold p-2 rounded-full transition-all hover:scale-110"
                    title="Refresh data"
                  >
                    <FaSync className={showNotifications ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                    title="Export bookings to PDF"
                  >
                    <FaFilePdf /> Bookings PDF
                  </button>
                  <button
                    onClick={exportKPIsToPDF}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                    title="Export KPIs to PDF"
                  >
                    <FaFilePdf /> KPI Report
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold p-2 rounded-full transition-all hover:scale-110"
                    title="Settings"
                  >
                    <FaCog />
                  </button>
                  <button
                    onClick={onLogout}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-8 rounded-xl transition-all backdrop-blur-md border border-white/20 hover:border-white/40"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex space-x-1 mb-6">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: FaChartBar },
                  { id: 'customers', label: 'Customers', icon: FaUser },
                  { id: 'activity', label: 'Activity Log', icon: FaHistory },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white/60 text-slate-700 hover:bg-white/80'
                    }`}
                  >
                    <tab.icon />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search and Filter Bar */}
              {activeTab === 'dashboard' && (
                <div className="flex gap-4 items-center flex-wrap">
                  <div className="flex-1 relative min-w-64">
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
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                  >
                    <option value="all">All Services</option>
                    {getAvailableServices().map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                      placeholder="Start date"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
                      placeholder="End date"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Main Content */}
            {activeTab === 'dashboard' && (
              <>
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

                {/* Bulk Actions Bar */}
                {selectedBookings.length > 0 && (
                  <div className="px-6 pb-4">
                    <div className="backdrop-blur-xl bg-yellow-50/80 rounded-2xl border border-yellow-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-slate-900">
                            {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''} selected
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => bulkUpdateStatus('Confirmed')}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                            >
                              <FaCheck /> Confirm Selected
                            </button>
                            <button
                              onClick={() => bulkUpdateStatus('Rejected')}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                            >
                              <FaTimes /> Reject Selected
                            </button>
                            <button
                              onClick={bulkDeleteBookings}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                            >
                              <FaTrash /> Delete Selected
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedBookings([])}
                          className="text-slate-600 hover:text-slate-900 text-lg"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bookings Table */}
                <div className="px-6 pb-12">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">📋 Booking Management</h2>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleSelectAllBookings}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                      >
                        {selectedBookings.length === filteredBookings.length && filteredBookings.length > 0 ? <FaCheckSquare /> : <FaSquare />}
                        {selectedBookings.length === filteredBookings.length && filteredBookings.length > 0 ? 'Deselect All' : 'Select All'}
                      </button>
                      <span className="text-sm text-slate-600 bg-white/60 px-4 py-2 rounded-lg">
                        Showing {filteredBookings.length} of {bookings.length} bookings
                      </span>
                    </div>
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
                              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">
                                <input
                                  type="checkbox"
                                  checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                                  onChange={handleSelectAllBookings}
                                  className="rounded border-gray-300"
                                />
                              </th>
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
                                  <input
                                    type="checkbox"
                                    checked={selectedBookings.includes(booking.id)}
                                    onChange={() => handleSelectBooking(booking.id)}
                                    className="rounded border-gray-300"
                                  />
                                </td>
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
              </>
            )}

            {activeTab === 'customers' && (
              <div className="px-6 py-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-8">👥 Customer Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customers.map((customer) => (
                    <div key={customer.id} className="backdrop-blur-xl bg-white/40 rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {customer.first_name?.[0]}{customer.surname?.[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{customer.first_name} {customer.surname}</h3>
                          <p className="text-sm text-slate-600">{customer.email}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Total Bookings:</span>
                          <span className="font-semibold text-slate-900">{customer.totalBookings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Confirmed:</span>
                          <span className="font-semibold text-green-600">{customer.confirmedBookings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Total Spent:</span>
                          <span className="font-semibold text-blue-600">${customer.totalSpent.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="px-6 py-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-8">📝 Activity Log</h2>
                <div className="backdrop-blur-xl bg-white/40 rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                  <div className="max-h-96 overflow-y-auto">
                    {activityLog.length === 0 ? (
                      <div className="p-8 text-center text-slate-600">No activity recorded yet.</div>
                    ) : (
                      activityLog.map((activity, idx) => (
                        <div key={idx} className="p-4 border-b border-gray-200 hover:bg-white/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <FaHistory className="text-blue-600 text-sm" />
                            </div>
                            <div className="flex-1">
                              <p className="text-slate-900 font-medium">{activity.action}</p>
                              <p className="text-sm text-slate-600">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50">
                <div className="backdrop-blur-2xl bg-gradient-to-br from-white/90 to-white/80 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200">
                  <div className="bg-gradient-to-r from-white/60 to-white/40 border-b border-gray-200 px-8 py-6 rounded-t-3xl flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="text-slate-600 hover:text-slate-900 text-2xl transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="px-8 py-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Notification Preferences</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span className="text-sm text-slate-700">New booking alerts</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span className="text-sm text-slate-700">Status change notifications</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Auto-refresh Interval</label>
                      <select className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="30">30 seconds</option>
                        <option value="60">1 minute</option>
                        <option value="300">5 minutes</option>
                        <option value="0">Manual only</option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        addNotification('Settings saved successfully!', 'success');
                        setShowSettings(false);
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold transition-all"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

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
