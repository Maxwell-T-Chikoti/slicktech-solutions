"use client";

import React, { useState } from 'react';
import supabase from '@/app/lib/supabaseClient';

import { FaFacebookF, FaApple, FaGoogle, FaEnvelope, FaUser, FaLock, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

interface SignupScreenProps {
  onToggle: () => void;
}

const SignupScreen = ({ onToggle }: SignupScreenProps) => {
  // --- Expanded State ---
  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const { data, error: signupError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: formData.firstName,
          surname: formData.surname,
          phone: formData.phone,
          location: formData.location,
          full_name: `${formData.firstName} ${formData.surname}`
        },
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
    } else if (data.user) {
      // Automatically sign in after registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
      } else {
        alert("Registration successful! Welcome to SlickTech!");
        onToggle(); // Switch to dashboard
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center lg:text-left">Create Account</h1>
          <p className="text-gray-400 text-sm mb-8 text-center lg:text-left">
            Already have an account? <span className="text-blue-600 font-bold cursor-pointer hover:underline" onClick={onToggle}>Login here!</span>
          </p>

          {error && <p className="text-red-500 text-xs mb-4 bg-red-50 p-2 rounded border border-red-100">{error}</p>}

          <form className="space-y-5" onSubmit={handleSignup}>
            {/* First Name & Surname Row */}
            <div className="flex gap-4">
              <div className="flex-1 border-b border-gray-200 pb-2">
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">First Name</label>
                <div className="flex items-center">
                  <FaUser className="text-slate-800 mr-3 text-sm" />
                  <input name="firstName" type="text" value={formData.firstName} onChange={handleChange} placeholder="John" className="w-full outline-none text-sm" required />
                </div>
              </div>
              <div className="flex-1 border-b border-gray-200 pb-2">
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Surname</label>
                <div className="flex items-center">
                  <input name="surname" type="text" value={formData.surname} onChange={handleChange} placeholder="Doe" className="w-full outline-none text-sm" required />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="border-b border-gray-200 pb-2">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Email</label>
              <div className="flex items-center">
                <FaEnvelope className="text-slate-800 mr-3 text-sm" />
                <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@address.com" className="w-full outline-none text-sm" required />
              </div>
            </div>

            {/* Phone & Location Row */}
            <div className="flex gap-4">
              <div className="flex-1 border-b border-gray-200 pb-2">
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Phone</label>
                <div className="flex items-center">
                  <FaPhone className="text-slate-800 mr-3 text-sm" />
                  <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+123..." className="w-full outline-none text-sm" required />
                </div>
              </div>
              <div className="flex-1 border-b border-gray-200 pb-2">
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Location</label>
                <div className="flex items-center">
                  <FaMapMarkerAlt className="text-slate-800 mr-3 text-sm" />
                  <input name="location" type="text" value={formData.location} onChange={handleChange} placeholder="City, Country" className="w-full outline-none text-sm" required />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="border-b border-gray-200 pb-2">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Password</label>
              <div className="flex items-center">
                <FaLock className="text-slate-800 mr-3 text-sm" />
                <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full outline-none text-sm" required />
              </div>
            </div>

            <div className="border-b border-gray-200 pb-2">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Confirm Password</label>
              <div className="flex items-center">
                <FaLock className="text-slate-800 mr-3 text-sm" />
                <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full outline-none text-sm" required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#050A44] hover:bg-slate-800 text-white py-4 rounded-full font-bold text-sm shadow-xl transition-all uppercase tracking-widest disabled:opacity-50">
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
      </div>
      <div className="hidden lg:flex w-1/2 bg-[#050A44] relative rounded-l-[60px] items-center justify-center">
        <div className="text-white text-xl opacity-20">Illustration Space</div>
      </div>
    </div>
  );
};

export default SignupScreen;