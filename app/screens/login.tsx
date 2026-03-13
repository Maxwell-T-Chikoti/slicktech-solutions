"use client";

import React, { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';
import SlickTechLogo from '@/app/Assets/SlickTech_Logo.png';

import { FaFacebookF, FaApple, FaGoogle, FaEnvelope, FaLock, FaEyeSlash, FaEye, FaHome } from 'react-icons/fa';
import SignupScreen from './signup';
import UserDashboard from './dashboard';
import AdminLoginScreen from './adminLogin';
import ForgotPasswordScreen from './forgotPassword';
import { FaUserShield } from 'react-icons/fa';

const LoginScreen = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  
  // New States for Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    const userSession = localStorage.getItem('slicktech_user');
    if (userSession) {
      try {
        const user = JSON.parse(userSession);
        if (user.loggedIn) {
          setIsLoggedIn(true);
        }
      } catch (err) {
        // Invalid session, clear it
        localStorage.removeItem('slicktech_user');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Use Supabase auth to sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData?.user) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // Get user profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        setError('Profile not found');
        setLoading(false);
        return;
      }

      // Check if user is an admin
      if (profileData.role === 'admin') {
        await supabase.auth.signOut();
        setError('Admins must use the admin login portal');
        setLoading(false);
        return;
      }

      // Create user session in localStorage
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

      localStorage.setItem('slicktech_user', JSON.stringify(userSession));

      // Success!
      setIsLoggedIn(true);
      setLoading(false);
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('slicktech_user');
    setIsLoggedIn(false);
  };

  if (isForgotPassword) {
    return <ForgotPasswordScreen onBack={() => setIsForgotPassword(false)} />;
  }

  if (isAdminMode) {
    // show admin login / dashboard flow
    return <AdminLoginScreen onBack={() => setIsAdminMode(false)} />;
  }

  if (isLoggedIn) {
    return <UserDashboard onLogout={handleLogout} />;
  }

  if (isSignup) {
    return <SignupScreen onToggle={() => setIsSignup(false)} />;
  }

  return (
    <div className="auth-screen flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 relative">

      {/* Home icon button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 group flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200 hover:border-blue-400 px-4 py-2.5 rounded-full shadow-md hover:shadow-lg hover:shadow-blue-100 transition-all duration-300 hover:scale-105"
      >
        <FaHome className="text-slate-500 group-hover:text-blue-600 text-sm transition-colors duration-300" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600 group-hover:text-blue-600 transition-colors duration-300">Home</span>
      </Link>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-20">
        <div className="w-full max-w-md animate-fade-in">
          
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
                <FaUserShield className="text-white text-xs" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
            <button
              onClick={() => setIsAdminMode(true)}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Admin login"
            >
              <FaUserShield className="text-slate-600 hover:text-slate-800" />
            </button>
          </div>
          <p className="text-slate-500 text-sm mb-8">
            Sign in to your account to continue<br />
            Don't have an account? <span className="text-blue-600 font-semibold cursor-pointer hover:underline transition-colors" onClick={() => setIsSignup(true)}>Create one here</span>
          </p>

          {/* ERROR DISPLAY */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm mb-6 shadow-sm animate-slide-down">
              <div className="flex items-center">
                <FaLock className="mr-2 text-red-500" />
                {error}
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="group">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Email Address</label>
              <div className="relative bg-white rounded-xl border-2 border-slate-200 hover:border-blue-300 focus-within:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <FaEnvelope />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address" 
                  className="w-full pl-12 pr-4 py-4 outline-none text-sm text-slate-700 placeholder-slate-400 rounded-xl bg-transparent"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="group">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Password</label>
              <div className="relative bg-white rounded-xl border-2 border-slate-200 hover:border-blue-300 focus-within:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <FaLock />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" 
                  className="w-full pl-12 pr-12 py-4 outline-none text-sm text-slate-700 placeholder-slate-400 rounded-xl bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer group">
                <input type="checkbox" className="mr-3 accent-blue-600 scale-110" />
                <span className="text-slate-600 group-hover:text-slate-800 transition-colors">Remember me</span>
              </label>
              <button 
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

         
        </div>
      </div>

      {/* RIGHT SIDE: Visual Panel */}
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
            <h2 className="text-white text-2xl font-bold mb-2">Professional Tech Solutions</h2>
            <p className="text-blue-200 text-sm">Secure • Reliable • Innovative</p>
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-20%] w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-bounce delay-500"></div>
      </div>
    </div>
  );
};

export default LoginScreen;