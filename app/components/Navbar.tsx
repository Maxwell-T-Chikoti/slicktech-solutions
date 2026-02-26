"use client";

import React, { useState } from 'react';
import { FaBars, FaUser, FaEllipsisV, FaCog, FaSignOutAlt } from 'react-icons/fa';

interface NavbarProps {
  currentPage?: string;
  // payload may be service title, booking object, etc.
  onNavigate: (page: string, payload?: any) => void;
  onLogout: () => void;
}

const Navbar = ({ currentPage = 'home', onNavigate, onLogout }: NavbarProps) => {
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openMenuDots, setOpenMenuDots] = useState(false);

  return (
    <nav className="bg-gray-300 px-4 md:px-8 py-4 rounded-full mx-4 mt-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center">
          <span className="text-white font-bold text-xs">S</span>
        </div>
        <span className="hidden md:inline font-semibold text-slate-800">SlickTech</span>
      </div>

      <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-700">
        <button 
          onClick={() => onNavigate('home')}
          className={`hover:text-slate-900 transition-colors ${currentPage === 'home' ? 'text-slate-900 font-bold' : ''}`}
        >
          Home
        </button>
        <button 
          onClick={() => onNavigate('services')}
          className={`hover:text-slate-900 transition-colors ${currentPage === 'services' ? 'text-slate-900 font-bold' : ''}`}
        >
          Services available
        </button>
        <button 
          onClick={() => onNavigate('bookings')}
          className={`hover:text-slate-900 transition-colors ${currentPage === 'bookings' ? 'text-slate-900 font-bold' : ''}`}
        >
          My bookings
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <FaBars className="md:hidden text-slate-700 cursor-pointer" />
        
        {/* User Icon with Dropdown */}
        <div className="relative">
          <div 
            className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-gray-500 transition-colors"
            onClick={() => setOpenUserMenu(!openUserMenu)}
          >
            <FaUser className="text-xs" />
          </div>
          
          {openUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
              <button 
                onClick={() => {
                  onNavigate('profile');
                  setOpenUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 border-b"
              >
                <FaCog className="text-gray-600" />
                <span className="text-gray-800 text-sm">Settings</span>
              </button>
              <button 
                onClick={() => {
                  onLogout();
                  setOpenUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-red-600"
              >
                <FaSignOutAlt className="text-red-600" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Three Dots Menu */}
        <div className="relative">
          <FaEllipsisV 
            className="text-slate-700 cursor-pointer hover:text-slate-900"
            onClick={() => setOpenMenuDots(!openMenuDots)}
          />
          
          {openMenuDots && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
              <button 
                onClick={() => {
                  onNavigate('profile');
                  setOpenMenuDots(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 border-b"
              >
                <FaCog className="text-gray-600" />
                <span className="text-gray-800 text-sm">Settings</span>
              </button>
              <button 
                onClick={() => {
                  onLogout();
                  setOpenMenuDots(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-red-600"
              >
                <FaSignOutAlt className="text-red-600" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
