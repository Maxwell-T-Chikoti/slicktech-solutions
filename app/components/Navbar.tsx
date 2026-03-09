"use client";

import React, { useState } from 'react';
import { FaBars, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import SlickTechLogo from '../Assets/SlickTech_Logo.png';

interface NavbarProps {
  currentPage?: string;
  // payload may be service title, booking object, etc.
  onNavigate: (page: string, payload?: any) => void;
  onLogout: () => void;
}

const Navbar = ({ currentPage = 'home', onNavigate, onLogout }: NavbarProps) => {
  const [openUserMenu, setOpenUserMenu] = useState(false);

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
      </div>

      <div className="flex items-center space-x-4">
        {/* Hamburger Menu for Mobile */}
        <FaBars className="md:hidden text-slate-700 cursor-pointer hover:text-slate-900 transition-colors text-lg" />
        
        {/* User Icon with Dropdown */}
        <div className="relative">
          <div 
            className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-700 cursor-pointer hover:bg-slate-300 transition-colors"
            onClick={() => setOpenUserMenu(!openUserMenu)}
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
