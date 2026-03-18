"use client";

import React, { useState } from 'react';
import supabase from '@/app/lib/supabaseClient';
import Image from 'next/image';
import SlickTechLogo from '@/app/Assets/SlickTech_Logo.png';
import PhoneInputWithCountry from '@/app/components/PhoneInputWithCountry';

import { FaFacebookF, FaApple, FaGoogle, FaEnvelope, FaUser, FaLock, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

interface SignupScreenProps {
  onToggle: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\+?[1-9]\d{7,14}$/;

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
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'firstName' | 'surname' | 'email' | 'phone' | 'location' | 'password' | 'confirmPassword', string>>>({});

  // Helper to handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData({ ...formData, [name]: value });
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const nextErrors: Partial<Record<'firstName' | 'surname' | 'email' | 'phone' | 'location' | 'password' | 'confirmPassword', string>> = {};

    if (!formData.firstName.trim()) nextErrors.firstName = 'First name is required.';
    if (!formData.surname.trim()) nextErrors.surname = 'Surname is required.';
    if (!formData.location.trim()) nextErrors.location = 'Location is required.';

    const normalizedEmail = formData.email.trim().toLowerCase();
    if (!normalizedEmail) nextErrors.email = 'Email is required.';
    else if (!EMAIL_REGEX.test(normalizedEmail)) nextErrors.email = 'Please enter a valid email address.';

    const normalizedPhone = formData.phone.trim();
    if (!normalizedPhone) nextErrors.phone = 'Phone number is required.';
    else if (!MOBILE_REGEX.test(normalizedPhone)) nextErrors.phone = 'Use international format (for example: +263771234567).';

    if (!formData.password) {
      nextErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      nextErrors.password = 'Use at least 8 characters for better security.';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError('Please correct the highlighted fields.');
      setLoading(false);
      return;
    }

    setFieldErrors({});

    try {
      // Create user in Supabase auth (this will be stored in the authentication system)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            surname: formData.surname,
            phone: normalizedPhone,
            location: formData.location,
          },
        },
      });

      if (authError || !authData?.user) {
        const authMsg = String(authError?.message || '').toLowerCase();
        if (authMsg.includes('already registered') || authMsg.includes('already been registered')) {
          setError('An account with this email already exists. Try signing in instead.');
        } else {
          setError(`Authentication failed: ${authError?.message || 'Unknown error'}`);
        }
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // Try to create profile in database
      let profileData = null;
      const { data: insertData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          first_name: formData.firstName,
          surname: formData.surname,
          phone: normalizedPhone,
          location: formData.location,
          email: normalizedEmail,
        })
        .select()
        .single();

      // If insert succeeded, use that data
      if (insertData) {
        profileData = insertData;
      } else if (profileError) {
        // If there's an error, try to fetch the profile anyway
        // (it might have been created despite the error)
        console.log('Profile insert error, trying to fetch:', profileError);
        const { data: fetchedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (fetchedProfile) {
          // Profile exists, use it
          profileData = fetchedProfile;
        } else if (profileError.code === '23505') {
          // Unique constraint violation
          setError('An account with this email already exists');
          setLoading(false);
          return;
        } else {
          // Other error
          setError(`Failed to create account: ${profileError.message || 'Unknown error'}`);
          setLoading(false);
          return;
        }
      }

      if (!profileData) {
        setError('Failed to complete registration');
        setLoading(false);
        return;
      }

      // Store user session in sessionStorage (tab-scoped auth)
      const userSession = {
        id: profileData.id,
        email: profileData.email,
        first_name: profileData.first_name,
        surname: profileData.surname,
        phone: profileData.phone,
        location: profileData.location,
        loggedIn: true,
        loginTime: new Date().toISOString()
      };

      sessionStorage.setItem('slicktech_user', JSON.stringify(userSession));

      // Success!
      setSuccess('Registration successful! Welcome to SlickTech!');
      setLoading(false);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        onToggle();
        setSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Signup error:', err);
      setError('Registration failed due to a temporary issue. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-10 animate-fade-in">
          <div className="flex justify-center mb-10">
            <div className="relative">
              <Image
                src={SlickTechLogo}
                alt="SlickTech Logo"
                width={160}
                height={160}
                className="rounded-full shadow-2xl object-cover border-4 border-white"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <FaUser className="text-white text-xs" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 text-center tracking-tight">Join SlickTech</h1>
          <p className="text-slate-500 text-sm mb-8 text-center">
            Create your account to get started<br />
            Already have an account? <span className="text-blue-600 font-semibold cursor-pointer hover:underline transition-colors" onClick={onToggle}>Sign in here</span>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm mb-6 shadow-sm animate-slide-down">
              <div className="flex items-center">
                <FaLock className="mr-2 text-red-500" />
                {error}
              </div>
            </div>
          )}
          {success && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl text-sm mb-6 shadow-sm animate-slide-down">
              <div className="flex items-center">
                <FaUser className="mr-2 text-blue-500" />
                {success}
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSignup}>
            {/* First Name & Surname Row */}
            <div className="flex flex-col gap-4">
              <div className="w-full min-w-0 group">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">First Name</label>
                <div className="relative bg-white rounded-xl border-2 border-slate-200 hover:border-blue-300 focus-within:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                    <FaUser />
                  </div>
                  <input name="firstName" type="text" value={formData.firstName} onChange={handleChange} placeholder="John" className="w-full pl-12 pr-4 py-4 outline-none text-sm text-slate-700 placeholder-slate-400 rounded-xl bg-transparent" required />
                </div>
                {fieldErrors.firstName && <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors.firstName}</p>}
              </div>
              <div className="flex-1 group">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Surname</label>
                <div className="relative bg-white rounded-xl border-2 border-slate-200 hover:border-blue-300 focus-within:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md">
                  <input name="surname" type="text" value={formData.surname} onChange={handleChange} placeholder="Doe" className="w-full px-4 py-4 outline-none text-sm text-slate-700 placeholder-slate-400 rounded-xl bg-transparent" required />
                </div>
                {fieldErrors.surname && <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors.surname}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="group">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Email Address</label>
              <div className="relative bg-white rounded-xl border-2 border-slate-200 hover:border-blue-300 focus-within:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <FaEnvelope />
                </div>
                <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="email@address.com" pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$" title="Enter a valid email address" className="w-full pl-12 pr-4 py-4 outline-none text-sm text-slate-700 placeholder-slate-400 rounded-xl bg-transparent" required />
              </div>
              {fieldErrors.email && <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors.email}</p>}
            </div>

            {/* Phone */}
            <div className="group w-full">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Phone</label>
                <div className="relative bg-white rounded-xl border-2 border-slate-200 hover:border-blue-300 focus-within:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                    <FaPhone />
                  </div>
                  <div className="pl-12 pr-3 py-2">
                    <PhoneInputWithCountry
                      value={formData.phone}
                      onChange={(phoneValue) => {
                        setFormData((prev) => ({ ...prev, phone: phoneValue }));
                        setFieldErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      required
                      className="items-center"
                      selectClassName="w-full sm:w-44 px-2 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      inputClassName="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {fieldErrors.phone && <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors.phone}</p>}
            </div>

            {/* Location */}
            <div className="group w-full">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Address / Location</label>
                <div className="relative bg-white rounded-xl border-2 border-slate-200 hover:border-blue-300 focus-within:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                    <FaMapMarkerAlt />
                  </div>
                  <input name="location" type="text" value={formData.location} onChange={handleChange} placeholder="Street address, area, city" className="w-full pl-12 pr-4 py-4 outline-none text-sm text-slate-700 placeholder-slate-400 rounded-xl bg-transparent" required />
                </div>
                {fieldErrors.location && <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors.location}</p>}
            </div>

            {/* Password */}
            <div className="group">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Password</label>
              <div className="relative bg-white rounded-xl border-2 border-slate-200 hover:border-blue-300 focus-within:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <FaLock />
                </div>
                <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full pl-12 pr-4 py-4 outline-none text-sm text-slate-700 placeholder-slate-400 rounded-xl bg-transparent" required />
              </div>
              {fieldErrors.password && <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors.password}</p>}
            </div>

            <div className="group">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Confirm Password</label>
              <div className="relative bg-white rounded-xl border-2 border-slate-200 hover:border-blue-300 focus-within:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <FaLock />
                </div>
                <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full pl-12 pr-4 py-4 outline-none text-sm text-slate-700 placeholder-slate-400 rounded-xl bg-transparent" required />
              </div>
              {fieldErrors.confirmPassword && <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading || success !== null} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]">
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

        </div>
      </div>
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden rounded-l-[60px] items-center justify-center">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 w-3/4">
          <div className="w-full h-80 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 flex items-center justify-center shadow-2xl">
            <Image
              src={SlickTechLogo}
              alt="SlickTech Logo"
              width={250}
              height={250}
              className="object-contain filter brightness-0 invert"
            />
          </div>
          <div className="text-center mt-8">
            <h2 className="text-white text-2xl font-bold mb-2">Welcome Aboard</h2>
            <p className="text-blue-200 text-sm">Join our community of tech enthusiasts</p>
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-20%] w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-bounce delay-500"></div>
      </div>
    </div>
  );
};

export default SignupScreen;