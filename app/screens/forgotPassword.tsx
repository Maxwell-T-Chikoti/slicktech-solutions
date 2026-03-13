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
    <div className="auth-screen flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                <FaEnvelope className="text-white text-xs" />
              </div>
            </div>
          </div>

          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors font-medium"
          >
            <FaArrowLeft className="mr-2" />
            Back to Login
          </button>

          <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Reset Password</h1>
          <p className="text-slate-500 text-sm mb-8">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {/* ERROR DISPLAY */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm mb-6 shadow-sm animate-slide-down">
              <div className="flex items-center">
                <FaEnvelope className="mr-2 text-red-500" />
                {error}
              </div>
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl text-sm mb-6 shadow-sm animate-slide-down">
              <div className="flex items-center">
                <FaEnvelope className="mr-2 text-green-500" />
                <div>
                  <p className="font-semibold mb-2">✓ Email Sent Successfully!</p>
                  <p className="text-xs">
                    Check your email for a password reset link. The link will expire in 24 hours.
                  </p>
                  <button
                    onClick={onBack}
                    className="mt-4 w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 uppercase tracking-widest transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </div>
          )}

          {!success && (
            <form className="space-y-6" onSubmit={handleResetPassword}>
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

              <button
                type="submit"
                disabled={loading || rateLimited}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending Reset Link...
                  </div>
                ) : rateLimited ? (
                  `Wait ${countdown}s`
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          )}
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
            <h2 className="text-white text-2xl font-bold mb-2">Secure Password Recovery</h2>
            <p className="text-blue-200 text-sm">We'll help you get back into your account safely</p>
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-20%] w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-20%] w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-bounce delay-500"></div>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
