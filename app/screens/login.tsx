"use client";

import React, { useState } from 'react';
import supabase from '@/app/lib/supabaseClient';

import { FaFacebookF, FaApple, FaGoogle, FaEnvelope, FaLock, FaEyeSlash } from 'react-icons/fa';
import SignupScreen from './signup';
import UserDashboard from './dashboard';

const LoginScreen = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // New States for Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Supabase Sign In call
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // This will catch "Invalid login credentials" or "Email not confirmed"
      setError(authError.message);
      setLoading(false);
    } else {
      // Success!
      setIsLoggedIn(true);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

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
            <div className="w-28 h-28 bg-gray-200 rounded-full flex flex-col items-center justify-center text-center p-4 shadow-inner">
               <div className="font-bold text-slate-800 text-sm leading-tight">SlickTech</div>
               <div className="text-[8px] uppercase tracking-widest text-slate-500">Solutions</div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign in</h1>
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
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Password" 
                  className="w-full outline-none text-sm text-slate-700 placeholder-gray-300"
                />
                <FaEyeSlash className="text-gray-400 cursor-pointer" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" className="mr-2 accent-slate-800" />
                Remember me
              </label>
              <span className="cursor-pointer hover:text-slate-800 transition-colors">Forgot Password ?</span>
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
          <div className="w-full h-64 bg-white/10 rounded-3xl flex items-center justify-center text-white italic">
            Illustration Placeholder
          </div>
        </div>
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default LoginScreen;