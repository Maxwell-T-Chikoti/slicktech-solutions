"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import supabase from '@/app/lib/supabaseClient';

interface ServicesScreenProps {
  onNavigate: (page: string, service?: string) => void;
  onLogout: () => void;
}

// define a type matching the shape of our services table
interface Service {
  id: number;
  title: string;
  description: string;
  price: string;
  features?: string[];
  image?: string;
  image_url?: string;
}

const ServicesScreen = ({ onNavigate, onLogout }: ServicesScreenProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const formatPriceCAD = (rawPrice: string) => {
    const numeric = parseFloat(String(rawPrice || '').replace(/[^0-9.]/g, ''));
    if (Number.isNaN(numeric)) return rawPrice || '';
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(numeric);
  };

  // Fallback gradients by index for services without a stored image
  const fallbackGradients = [
    'linear-gradient(135deg, #60a5fa, #2563eb)',
    'linear-gradient(135deg, #a78bfa, #7c3aed)',
    'linear-gradient(135deg, #f87171, #dc2626)',
    'linear-gradient(135deg, #4ade80, #16a34a)',
    'linear-gradient(135deg, #fbbf24, #d97706)',
    'linear-gradient(135deg, #f472b6, #db2777)',
  ];

  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('id', { ascending: true });
      if (error) {
        console.error('Error fetching services:', error);
      } else if (data) {
        console.log('services fetched', data);
        setServices(data);
      }
      setLoading(false);
    };
    fetchServices();
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Navigation Bar Skeleton */}
        <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse"></div>
              <div className="w-32 h-6 bg-slate-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-16 h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="px-4 md:px-8 py-10 max-w-7xl mx-auto space-y-12">
          {/* Header Skeleton */}
          <div className="relative overflow-hidden rounded-[2rem] border-2 border-slate-200 bg-white p-8 md:p-12 shadow-xl shadow-slate-200/50">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-slate-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
            <div className="relative z-10">
              <div className="w-96 h-12 bg-slate-200 rounded-lg animate-pulse mb-4"></div>
              <div className="w-64 h-6 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Services Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white border-2 border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                {/* Service Image Skeleton */}
                <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse flex items-center justify-center">
                  <div className="w-24 h-8 bg-slate-400 rounded animate-pulse"></div>
                </div>

                {/* Service Content Skeleton */}
                <div className="p-8 space-y-4">
                  {/* Title */}
                  <div className="w-3/4 h-6 bg-slate-200 rounded animate-pulse"></div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="w-full h-4 bg-slate-200 rounded animate-pulse"></div>
                    <div className="w-5/6 h-4 bg-slate-200 rounded animate-pulse"></div>
                    <div className="w-4/6 h-4 bg-slate-200 rounded animate-pulse"></div>
                  </div>

                  {/* Features Section */}
                  <div className="pb-6 border-b border-slate-200">
                    <div className="w-20 h-3 bg-slate-200 rounded animate-pulse mb-3"></div>
                    <div className="space-y-2">
                      <div className="w-32 h-3 bg-slate-200 rounded animate-pulse"></div>
                      <div className="w-28 h-3 bg-slate-200 rounded animate-pulse"></div>
                      <div className="w-36 h-3 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                  </div>

                  {/* Price and Button */}
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-8 bg-slate-200 rounded animate-pulse"></div>
                    <div className="w-20 h-10 bg-slate-200 rounded-xl animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Footer Skeleton */}
        <footer className="mt-20 py-16 bg-white border-t-2 border-slate-200 text-center">
          <div className="max-w-7xl mx-auto px-8 flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse"></div>
              <div className="w-32 h-6 bg-slate-200 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-8">
              <div className="w-6 h-6 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-6 h-6 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-6 h-6 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-6 h-6 bg-slate-200 rounded animate-pulse"></div>
            </div>
            <div className="w-48 h-3 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <Navbar currentPage="services" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <main className="px-4 md:px-8 py-10 max-w-7xl mx-auto space-y-12">
        <div className="relative overflow-hidden rounded-[2rem] border-2 border-slate-200 bg-white p-8 md:p-12 shadow-xl shadow-slate-200/50">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">All Services Available</h1>
            <p className="text-slate-500 text-lg font-medium max-w-2xl">Explore our comprehensive range of IT and technology services tailored for your business needs.</p>
          </div>
        </div>
          
        {services.length === 0 ? (
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-slate-800">No services are published yet.</p>
            <p className="mt-2 text-sm text-slate-600">Please check back soon, or contact support to request a custom service quote.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <div key={service.id} className="bg-white border-2 border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all group">
              <div
                className="h-48 flex items-center justify-center text-white text-center p-4 relative overflow-hidden"
                style={service.image_url ? {} : { background: service.image || fallbackGradients[idx % fallbackGradients.length] }}
              >
                {service.image_url && (
                  <img src={service.image_url} alt={service.title} className="absolute inset-0 w-full h-full object-cover" />
                )}
                {!service.image_url && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
                    <div className="relative z-10">
                      {service.id !== 3 ? (
                        <span className="font-black text-2xl group-hover:scale-110 transition-transform duration-300 inline-block">{service.title}</span>
                      ) : (
                        <span className="font-black text-5xl text-red-900 group-hover:scale-105 transition-transform duration-300 inline-block">EMERGENCY</span>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="p-8">
                <h3 className="font-black text-slate-900 mb-3 text-lg">{service.title}</h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">{service.description}</p>
                
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <p className="text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">Features:</p>
                  <ul className="space-y-2">
                    {(service.features || []).map((feature: string, idx: number) => (
                      <li key={idx} className="text-sm text-slate-600 font-medium">✓ {feature}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-black text-blue-600">{formatPriceCAD(service.price)}</p>
                  <button 
                    onClick={() => onNavigate('newbooking', service.title)}
                    className="bg-blue-600 hover:bg-slate-900 text-white text-sm font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-slate-400"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 py-16 bg-white border-t-2 border-slate-200 text-center">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center font-black text-white">S</div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">SLICKTECH</span>
          </div>
          <div className="flex gap-8 text-slate-300">
            <FaFacebook className="hover:text-blue-600 transition-colors cursor-pointer" />
            <FaTwitter className="hover:text-blue-400 transition-colors cursor-pointer" />
            <FaInstagram className="hover:text-pink-600 transition-colors cursor-pointer" />
            <FaLinkedin className="hover:text-blue-800 transition-colors cursor-pointer" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">© 2026 Crafted by Swiftspire Technologies </p>
        </div>
      </footer>
    </div>
  );
};

export default ServicesScreen;
