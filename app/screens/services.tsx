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
}

const ServicesScreen = ({ onNavigate, onLogout }: ServicesScreenProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <Navbar currentPage="services" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content */}
      <div className="px-4 md:px-8 py-8">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">All Services Available</h1>
          <p className="text-gray-600 mb-8">Explore our comprehensive range of IT and technology services</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                <div className={`h-48 ${service.image || 'bg-gray-300'} flex items-center justify-center text-white text-center p-4`}>
                  {service.id !== 3 ? (
                    <span className="font-bold text-lg">{service.title}</span>
                  ) : (
                    <span className="font-bold text-6xl text-red-600">EMERGENCY</span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-slate-900 mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                  
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Features:</p>
                    <ul className="space-y-1">
                      {(service.features || []).map((feature: string, idx: number) => (
                        <li key={idx} className="text-xs text-gray-600">✓ {feature}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <p className="text-lg font-bold text-slate-900 mb-4">{service.price}</p>
                  <button 
                    onClick={() => onNavigate('newbooking', service.title)}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold py-2 rounded transition-colors"
                  >
                    Book Service
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-200 px-4 md:px-8 py-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gray-400 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="font-bold text-slate-800">SlickTech</span>
            </div>
            <p className="text-xs text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">COMPANY</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-xs text-gray-600 hover:text-slate-900">About Us</a></li>
              <li><a href="#" className="text-xs text-gray-600 hover:text-slate-900">Services</a></li>
              <li><a href="#" className="text-xs text-gray-600 hover:text-slate-900">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">CONTACT INFO</h4>
            <ul className="space-y-2">
              <li className="text-xs text-gray-600">Phone: (254)6578900</li>
              <li className="text-xs text-gray-600">Email: company@email.com</li>
              <li className="text-xs text-gray-600">Location: 901 Smart Street, BC</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">FOLLOW US</h4>
            <div className="flex space-x-4">
              <FaFacebook className="text-blue-600 cursor-pointer hover:scale-110 transition-transform" />
              <FaTwitter className="text-blue-400 cursor-pointer hover:scale-110 transition-transform" />
              <FaInstagram className="text-pink-600 cursor-pointer hover:scale-110 transition-transform" />
              <FaLinkedin className="text-blue-700 cursor-pointer hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 pt-4 flex flex-col md:flex-row items-center justify-between text-xs text-gray-600">
          <p>© 2026 SlickTech Technologies | All rights reserved</p>
          <p>Created with love by SlickTech Technologies</p>
        </div>
      </footer>
    </div>
  );
};

export default ServicesScreen;
