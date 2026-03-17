"use client";

import React, { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabaseClient';
import Image from 'next/image';
import SlickTechLogo from '@/app/Assets/SlickTech_Logo.png';
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const ResetPasswordForm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // Supabase recovery links may provide tokens in either query params or hash fragment.
        const hashParams = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.hash.replace(/^#/, ''))
          : new URLSearchParams();

        const accessToken = searchParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token');
        const type = searchParams.get('type') || hashParams.get('type');
        const hashError = hashParams.get('error_description') || hashParams.get('error');

        console.log('Reset password params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });

        if (hashError) {
          setError('This reset link is invalid or has expired. Please request a new password reset.');
          setVerifying(false);
          return;
        }

        if (accessToken && refreshToken && type === 'recovery') {
          // Set the session with the tokens from the URL
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setError('Invalid or expired reset link. Please request a new password reset.');
            setVerifying(false);
            return;
          }

          if (data.session) {
            console.log('Password reset session established successfully');
            setIsValidSession(true);
            if (typeof window !== 'undefined' && window.location.hash) {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
            setVerifying(false);
          } else {
            console.error('No session data returned');
            setError('Invalid reset link. Please request a new password reset.');
            setVerifying(false);
          }
        } else {
          // No reset parameters, check if user is already authenticated
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('Existing session found');
            setIsValidSession(true);
            setVerifying(false);
          } else {
            console.log('No valid session found');
            setError('No valid reset session found. Please use the link from your email or request a new password reset.');
            setVerifying(false);
          }
        }
      } catch (err) {
        console.error('Error handling password reset:', err);
        setError('An error occurred while verifying your reset link. Please try again.');
        setVerifying(false);
      }
    };

    handlePasswordReset();
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen flex min-h-screen bg-white">
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

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Password</h1>
          <p className="text-gray-400 text-sm mb-6">
            Enter your new password below to reset your account.
          </p>

          {/* ERROR DISPLAY */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-6 border border-red-100">
              <p className="mb-3">{error}</p>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 underline text-xs"
              >
                Request a new password reset →
              </Link>
            </div>
          )}

          {/* LOADING STATE - Verifying reset link */}
          {verifying && (
            <div className="bg-blue-50 text-blue-600 p-4 rounded-lg text-sm mb-6 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <FaSpinner className="text-lg animate-spin" />
                <p className="font-semibold">Verifying Reset Link...</p>
              </div>
              <p className="text-xs">
                Please wait while we verify your password reset link.
              </p>
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success ? (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg text-sm mb-6 border border-green-100">
              <div className="flex items-center gap-2 mb-3">
                <FaCheckCircle className="text-xl" />
                <p className="font-semibold">Password Reset Successfully!</p>
              </div>
              <p className="text-xs mb-4">
                Your password has been updated. You can now log in with your new password.
              </p>
              <Link
                href="/"
                className="block w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors text-center"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            /* Only show form if session is valid and not verifying */
            isValidSession && !verifying && (
              <form className="space-y-8" onSubmit={handleResetPassword}>
              {/* New Password Field */}
              <div className="relative border-b border-gray-200 pb-2">
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                  New Password
                </label>
                <div className="flex items-center">
                  <FaLock className="text-slate-800 mr-3 text-sm" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your new password"
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
                <p className="text-[10px] text-gray-400 mt-2">Minimum 8 characters</p>
              </div>

              {/* Confirm Password Field */}
              <div className="relative border-b border-gray-200 pb-2">
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                  Confirm Password
                </label>
                <div className="flex items-center">
                  <FaLock className="text-slate-800 mr-3 text-sm" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="w-full outline-none text-sm text-slate-700 placeholder-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-800 cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    {showConfirmPassword ? <FaEye className="text-sm" /> : <FaEyeSlash className="text-sm" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#050A44] hover:bg-slate-800 text-white py-4 rounded-full font-bold text-sm shadow-xl shadow-blue-100 transition-all uppercase tracking-widest disabled:opacity-70"
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          )
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

export default ResetPasswordForm;
