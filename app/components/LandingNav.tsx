'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SlickTechLogo from '@/app/Assets/SlickTech_Logo.png';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useState } from 'react';

interface LandingNavProps {
  currentPage?: 'home' | 'about' | 'booking';
}

const LandingNav = ({ currentPage = 'home' }: LandingNavProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="w-full sticky top-0 z-50 backdrop-filter backdrop-blur-md bg-white/80 border-b border-white/20 shadow-lg animate-fade-in-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link href="/" className="flex items-center group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
              <Image
                src={SlickTechLogo}
                alt="SlickTech Logo"
                width={40}
                height={40}
                className="relative rounded-full group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-orange-500 group-hover:to-red-600 transition-all duration-300">
              SlickTech
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-2 items-center">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 relative group ${
                currentPage === 'home'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-700 hover:text-blue-600'
              }`}
            >
              Home
              <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ${
                currentPage === 'home' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></div>
            </Link>

            <Link
              href="/about"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 relative group ${
                currentPage === 'about'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-700 hover:text-blue-600'
              }`}
            >
              About
              <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ${
                currentPage === 'about' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></div>
            </Link>

            <Link
              href="/booking"
              className="ml-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-full font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-md transform hover:-translate-y-1 btn-interactive"
            >
              Book Now
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            <Link
              href="/booking"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105 text-sm"
            >
              Book
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-700 hover:text-orange-500 transition-colors duration-300"
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-4 animate-fade-in-down">
            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 'home'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:text-blue-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 'about'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:text-blue-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/booking"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-all text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Book Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LandingNav;