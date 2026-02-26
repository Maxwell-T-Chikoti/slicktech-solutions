"use client";

import React, { useState } from 'react';
import supabase from '@/app/lib/supabaseClient';
import AdminDashboard from './adminDashboard';
import { FaArrowLeft } from 'react-icons/fa';

interface AdminLoginProps {
  onBack: () => void;
}

const AdminLoginScreen = ({ onBack }: AdminLoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else if (data.user) {
      // Check if user is actually an admin
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || profileData?.role !== 'admin') {
        // Not an admin, reject login
        await supabase.auth.signOut();
        setError('You do not have admin privileges');
        setLoading(false);
      } else {
        setLoading(false);
        setIsLoggedIn(true);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    onBack();
  };

  if (isLoggedIn) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-20">
        <div className="w-full max-w-md">
          <button
            className="flex items-center text-xs text-gray-600 mb-6"
            onClick={onBack}
          >
            <FaArrowLeft className="mr-2" /> Back to user login
          </button>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Sign in</h1>
          <p className="text-gray-400 text-sm mb-6">
            Enter administrator credentials below
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-6 border border-red-100">
              {error}
            </div>
          )}

          <form className="space-y-8" onSubmit={handleLogin}>
            <div className="relative border-b border-gray-200 pb-2">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full outline-none text-sm text-slate-700 placeholder-gray-300"
              />
            </div>

            <div className="relative border-b border-gray-200 pb-2">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full outline-none text-sm text-slate-700 placeholder-gray-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#050A44] hover:bg-slate-800 text-white py-4 rounded-full font-bold text-sm shadow-xl shadow-blue-100 transition-all uppercase tracking-widest disabled:opacity-70"
            >
              {loading ? 'Verifying...' : 'Login'}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE: Visual Panel (copied from login screen) */}
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

export default AdminLoginScreen;
