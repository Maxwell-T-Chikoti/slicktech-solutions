"use client";

import React, { useEffect, useState, type JSX } from 'react';
import { FaBars, FaUser, FaCog, FaSignOutAlt, FaBell, FaMoon, FaSun } from 'react-icons/fa';
import supabase from '@/app/lib/supabaseClient';
import { useTheme } from './ThemeProvider';
import SlickTechLogo from '../Assets/SlickTech_Logo.png';

interface NavbarProps {
  currentPage?: string;
  // payload may be service title, booking object, etc.
  onNavigate: (page: string, payload?: any) => void;
  onLogout: () => void;
}

const Navbar = ({ currentPage = 'home', onNavigate, onLogout }: NavbarProps) => {
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, toggleTheme } = useTheme();

  const fetchNotifications = async () => {
    const userSession = window.localStorage.getItem('slicktech_user');
    if (!userSession) return;
    const user = JSON.parse(userSession);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((notification) => !notification.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!openNotifications) return;

    const markNotificationsRead = async () => {
      const unread = notifications.filter((notification) => !notification.is_read);
      if (unread.length === 0) return;
      await Promise.all(
        unread.map((notification) =>
          supabase.from('notifications').update({ is_read: true }).eq('id', notification.id)
        )
      );
      setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })));
      setUnreadCount(0);
    };

    markNotificationsRead();
  }, [openNotifications, notifications]);

  return (
    <nav className="bg-white border-2 border-slate-200 px-4 md:px-8 py-4 rounded-2xl mx-4 mt-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <img 
          src={SlickTechLogo.src} 
          alt="SlickTech Logo" 
          className="h-10 w-auto"
        />
        <span className="hidden md:inline font-black text-slate-900 tracking-tighter">SLICKTECH</span>
      </div>

      <div className="hidden md:flex items-center space-x-8 text-sm font-bold text-slate-700">
        <button 
          onClick={() => onNavigate('home')}
          className={`hover:text-slate-900 transition-colors ${currentPage === 'home' ? 'text-slate-900' : ''}`}
        >
          Home
        </button>
        <button 
          onClick={() => onNavigate('services')}
          className={`hover:text-slate-900 transition-colors ${currentPage === 'services' ? 'text-slate-900' : ''}`}
        >
          Services
        </button>
        <button 
          onClick={() => onNavigate('bookings')}
          className={`hover:text-slate-900 transition-colors ${currentPage === 'bookings' ? 'text-slate-900' : ''}`}
        >
          My Bookings
        </button>
        <button 
          onClick={() => onNavigate('myaccount')}
          className={`hover:text-slate-900 transition-colors ${currentPage === 'myaccount' ? 'text-slate-900' : ''}`}
        >
          My Account
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-700 cursor-pointer hover:bg-slate-300 transition-colors"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <FaMoon className="text-sm" /> : <FaSun className="text-sm" />}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setOpenNotifications(!openNotifications);
              setOpenUserMenu(false);
            }}
            className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-700 cursor-pointer hover:bg-slate-300 transition-colors relative"
            title="Notifications"
          >
            <FaBell className="text-sm" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {openNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border-2 border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-slate-900 font-black text-sm">Notifications</span>
                <button onClick={fetchNotifications} className="text-xs font-semibold text-blue-600 hover:text-blue-800">Refresh</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-500 text-center">No notifications yet.</div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className={`px-4 py-3 border-b border-slate-100 last:border-0 ${notification.is_read ? 'bg-white' : 'bg-blue-50'}`}>
                      <p className="text-sm font-bold text-slate-900">{notification.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                      <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">{new Date(notification.created_at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hamburger Menu for Mobile */}
        <FaBars className="md:hidden text-slate-700 cursor-pointer hover:text-slate-900 transition-colors text-lg" />
        
        {/* User Icon with Dropdown */}
        <div className="relative">
          <div 
            className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-700 cursor-pointer hover:bg-slate-300 transition-colors"
            onClick={() => {
              setOpenUserMenu(!openUserMenu);
              setOpenNotifications(false);
            }}
          >
            <FaUser className="text-sm" />
          </div>
          
          {openUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-slate-200 rounded-2xl shadow-xl z-50">
              <button 
                onClick={() => {
                  onNavigate('profile');
                  setOpenUserMenu(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center space-x-3 border-b border-slate-100 last:border-0"
              >
                <FaCog className="text-slate-600" />
                <span className="text-slate-800 font-semibold">Settings</span>
              </button>
              <button 
                onClick={() => {
                  onLogout();
                  setOpenUserMenu(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center space-x-3 text-red-600"
              >
                <FaSignOutAlt />
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
