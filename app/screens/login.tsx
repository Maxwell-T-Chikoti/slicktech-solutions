"use client";

import React, { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabaseClient';
import Image from 'next/image';
import SlickTechLogo from '@/app/Assets/SlickTech_Logo.png';

import { FaFacebookF, FaApple, FaGoogle, FaEnvelope, FaLock, FaEyeSlash, FaEye } from 'react-icons/fa';
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
    <div className="flex min-h-screen bg-white">
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-20">
        <div className="w-full max-w-md">
          
          <div className="flex justify-center mb-10">
            <Image
              src={SlickTechLogo}
              alt="SlickTech Logo"
              width={160}
              height={160}
              className="rounded-full shadow-lg object-cover"
            />
          </div>

          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-slate-900">Sign in</h1>
            <FaUserShield
              className="text-xl text-gray-500 cursor-pointer hover:text-gray-700"
              title="Admin login"
              onClick={() => setIsAdminMode(true)}
            />
          </div>
          <p className="text-gray-400 text-sm mb-6">
            If you don't have an account register <br />
            You can <span className="text-blue-600 font-bold cursor-pointer hover:underline" onClick={() => setIsSignup(true)}>Register here !</span>
          </p>

          {/* ERROR DISPLAY */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-6 border border-red-100">
              {error}
            </div>
          )}

          <form className="space-y-8" onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="relative border-b border-gray-200 pb-2">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Email</label>
              <div className="flex items-center">
                <FaEnvelope className="text-slate-800 mr-3 text-sm" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address" 
                  className="w-full outline-none text-sm text-slate-700 placeholder-gray-300"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative border-b border-gray-200 pb-2">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Password</label>
              <div className="flex items-center">
                <FaLock className="text-slate-800 mr-3 text-sm" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Password" 
                  className="w-full outline-none text-sm text-slate-700 placeholder-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-800 cursor-pointer hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <FaEye className="text-sm" /> : <FaEyeSlash className="text-sm" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" className="mr-2 accent-slate-800" />
                Remember me
              </label>
              <span 
                onClick={() => setIsForgotPassword(true)}
                className="cursor-pointer hover:text-slate-800 transition-colors"
              >
                Forgot Password ?
              </span>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#050A44] hover:bg-slate-800 text-white py-4 rounded-full font-bold text-sm shadow-xl shadow-blue-100 transition-all uppercase tracking-widest disabled:opacity-70"
            >
              {loading ? "Verifying..." : "Login"}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-gray-400 text-[10px] uppercase tracking-[0.3em] mb-6">or continue with</p>
            <div className="flex justify-center space-x-8">
              <FaFacebookF className="text-xl text-blue-600 cursor-pointer hover:scale-110 transition-transform" />
              <FaApple className="text-xl text-black cursor-pointer hover:scale-110 transition-transform" />
              <FaGoogle className="text-xl text-red-500 cursor-pointer hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Visual Panel */}
      <div className="hidden lg:flex w-1/2 bg-[#050A44] relative overflow-hidden rounded-l-[60px] items-center justify-center">
        <div className="relative z-10 w-3/4">
          <div className="w-full h-64 bg-white rounded-3xl flex items-center justify-center">
            <Image
              src={SlickTechLogo}
              alt="SlickTech Logo"
              width={200}
              height={200}
              className="object-contain"
            />
          </div>
        </div>
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default LoginScreen;