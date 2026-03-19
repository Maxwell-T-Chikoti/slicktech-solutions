'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SlickTechLogo from '@/app/Assets/SlickTech_Logo.png';
import { FaBars, FaTimes, FaChevronDown } from 'react-icons/fa';
import { useState } from 'react';

interface LandingNavProps {
  currentPage?: 'home' | 'about' | 'services' | 'support' | 'contact' | 'documentation' | 'booking';
}

const LandingNav = ({ currentPage = 'home' }: LandingNavProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);

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

            <div className="relative group">
              <Link
                href="/services"
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 relative group inline-flex items-center gap-2 ${
                  currentPage === 'services'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:text-blue-600'
                }`}
              >
                Services <FaChevronDown className="text-xs" />
                <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ${
                  currentPage === 'services' ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></div>
              </Link>

              <div className="invisible absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                <Link href="/services" className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700">Services Overview</Link>
                <Link href="/services/it-support" className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700">IT Support</Link>
                <Link href="/services/cloud-solutions" className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700">Cloud Solutions</Link>
                <Link href="/services/cybersecurity" className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700">Cybersecurity</Link>
              </div>
            </div>

            <Link
              href="/support"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 relative group ${
                currentPage === 'support'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-700 hover:text-blue-600'
              }`}
            >
              Support
              <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ${
                currentPage === 'support' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></div>
            </Link>

            <Link
              href="/documentation"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 relative group ${
                currentPage === 'documentation'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-700 hover:text-blue-600'
              }`}
            >
              Docs
              <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ${
                currentPage === 'documentation' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></div>
            </Link>

            <Link
              href="/contact"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 relative group ${
                currentPage === 'contact'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-slate-700 hover:text-blue-600'
              }`}
            >
              Contact
              <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ${
                currentPage === 'contact' ? 'w-full' : 'w-0 group-hover:w-full'
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
                href="/services"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 'services'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:text-blue-600'
                }`}
                onClick={(event) => {
                  event.preventDefault();
                  setIsMobileServicesOpen(!isMobileServicesOpen);
                }}
              >
                <span className="inline-flex items-center gap-2">Services <FaChevronDown className={`text-xs transition-transform ${isMobileServicesOpen ? 'rotate-180' : ''}`} /></span>
              </Link>
              {isMobileServicesOpen && (
                <div className="ml-4 flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
                  <Link href="/services" className="text-sm font-semibold text-slate-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Services Overview</Link>
                  <Link href="/services/it-support" className="text-sm text-slate-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>IT Support</Link>
                  <Link href="/services/cloud-solutions" className="text-sm text-slate-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Cloud Solutions</Link>
                  <Link href="/services/cybersecurity" className="text-sm text-slate-700 hover:text-blue-600" onClick={() => setIsMenuOpen(false)}>Cybersecurity</Link>
                </div>
              )}
              <Link
                href="/support"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 'support'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:text-blue-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Support
              </Link>
              <Link
                href="/documentation"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 'documentation'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:text-blue-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Docs
              </Link>
              <Link
                href="/contact"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 'contact'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:text-blue-600'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
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