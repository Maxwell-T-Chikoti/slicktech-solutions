"use client";

import React, { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabaseClient';
import Image from 'next/image';
import SlickTechLogo from '@/app/Assets/SlickTech_Logo.png';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';

const ForgotPasswordScreen = ({ onBack }: { onBack: () => void }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (rateLimited) {
      setRateLimited(false);
    }
  }, [countdown, rateLimited]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimited) return;
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      if (resetError.message.toLowerCase().includes('rate limit')) {
        setRateLimited(true);
        setCountdown(60); // 60 seconds cooldown
        setError('Too many requests. Please wait 1 minute before trying again.');
      } else {
        setError(resetError.message);
      }
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

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

          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Login
          </button>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Reset Password</h1>
          <p className="text-gray-400 text-sm mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {/* ERROR DISPLAY */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-6 border border-red-100">
              {error}
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg text-sm mb-6 border border-green-100">
              <p className="font-semibold mb-2">✓ Email Sent Successfully!</p>
              <p className="text-xs">
                Check your email for a password reset link. The link will expire in 24 hours.
              </p>
              <button
                onClick={onBack}
                className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold text-sm transition-colors"
              >
                Back to Login
              </button>
            </div>
          )}

          {!success && (
            <form className="space-y-8" onSubmit={handleResetPassword}>
              {/* Email Field */}
              <div className="relative border-b border-gray-200 pb-2">
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                  Email Address
                </label>
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

              <button
                type="submit"
                disabled={loading || rateLimited}
                className="w-full bg-[#050A44] hover:bg-slate-800 text-white py-4 rounded-full font-bold text-sm shadow-xl shadow-blue-100 transition-all uppercase tracking-widest disabled:opacity-70"
              >
                {loading ? "Sending..." : rateLimited ? `Wait ${countdown}s` : "Send Reset Link"}
              </button>
            </form>
          )}
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

export default ForgotPasswordScreen;
