"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import supabase from '@/app/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';
import SlickTechLogo from '@/app/Assets/SlickTech_Logo.png';

import { FaFacebookF, FaApple, FaGoogle, FaEnvelope, FaLock, FaEyeSlash, FaEye, FaHome } from 'react-icons/fa';
import SignupScreen from './signup';
import UserDashboard from './dashboard';
import AdminDashboard from './adminDashboard';
import StaffDashboard from './staffDashboard';
import ForgotPasswordScreen from './forgotPassword';
import { FaUserShield } from 'react-icons/fa';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginScreen = () => {
  const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
  const WARNING_WINDOW_MS = 30 * 1000;

  const [isSignup, setIsSignup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'staff' | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(30);

  const inactivityDeadlineRef = useRef<number>(0);

  
  // New States for Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'email' | 'password', string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [isTwoFactorEnrollment, setIsTwoFactorEnrollment] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaChallengeId, setMfaChallengeId] = useState('');
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [pendingLoginContext, setPendingLoginContext] = useState<{
    role: 'user' | 'admin' | 'staff';
    profile: any;
  } | null>(null);

  const mapToAppRole = (dbRole: string | null | undefined): 'user' | 'admin' | 'staff' => {
    return dbRole === 'admin' ? 'admin' : dbRole === 'staff' ? 'staff' : 'user';
  };

  const resetTwoFactorState = () => {
    setRequiresTwoFactor(false);
    setIsTwoFactorEnrollment(false);
    setTwoFactorCode('');
    setMfaFactorId('');
    setMfaChallengeId('');
    setMfaQrCode('');
    setMfaSecret('');
    setPendingLoginContext(null);
  };

  const completeLogin = (role: 'user' | 'admin' | 'staff', profileData: any) => {
    if (role === 'user' || role === 'staff') {
      const userSession = {
        id: profileData.id,
        email: profileData.email,
        first_name: profileData.first_name,
        surname: profileData.surname,
        phone: profileData.phone,
        location: profileData.location,
        role,
        loggedIn: true,
        loginTime: new Date().toISOString(),
      };
      sessionStorage.setItem('slicktech_user', JSON.stringify(userSession));
    } else {
      sessionStorage.removeItem('slicktech_user');
    }

    setUserRole(role);
    setIsLoggedIn(true);
    resetTwoFactorState();
  };

  useEffect(() => {
    const restoreSession = async () => {
      const userSession = sessionStorage.getItem('slicktech_user');
      if (userSession) {
        try {
          const user = JSON.parse(userSession);
          if (user.loggedIn) {
            setUserRole(mapToAppRole(user.role));
            setIsLoggedIn(true);
            return;
          }
        } catch (err) {
          // Invalid session, clear it
          sessionStorage.removeItem('slicktech_user');
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profileData) {
        await supabase.auth.signOut();
        return;
      }

      const role = mapToAppRole(profileData.role);
      if (role === 'admin' || role === 'staff') {
        const mfaApi = (supabase.auth as any)?.mfa;
        if (mfaApi?.getAuthenticatorAssuranceLevel) {
          const assurance = await mfaApi.getAuthenticatorAssuranceLevel();
          const currentAal = String(assurance?.data?.currentLevel || '').toLowerCase();
          if (currentAal !== 'aal2') {
            await supabase.auth.signOut();
            setError('Two-factor verification is required for admin/staff access. Please sign in again.');
            return;
          }
        }
      }

      setUserRole(role);
      setIsLoggedIn(true);
    };

    restoreSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const nextErrors: Partial<Record<'email' | 'password', string>> = {};

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      nextErrors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(normalizedEmail)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError('Please correct the highlighted fields.');
      setLoading(false);
      return;
    }

    setFieldErrors({});

    try {
      // Use Supabase auth to sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError || !authData?.user) {
        const authMsg = String(authError?.message || '').toLowerCase();
        if (authMsg.includes('invalid login credentials')) {
          setError('Incorrect email or password. Double-check your credentials and try again.');
        } else if (authMsg.includes('email not confirmed')) {
          setError('Please confirm your email address first, then sign in.');
        } else {
          setError(authError?.message || 'Unable to sign in right now. Please try again.');
        }
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
        setError('Your profile could not be loaded. Please contact support if this keeps happening.');
        setLoading(false);
        return;
      }

      const role = mapToAppRole(profileData.role);

      if (role === 'admin' || role === 'staff') {
        const mfaApi = (supabase.auth as any)?.mfa;
        if (!mfaApi?.listFactors || !mfaApi?.challenge || !mfaApi?.verify) {
          await supabase.auth.signOut();
          setError('Two-factor authentication is required for admin and staff accounts, but MFA is not configured in this environment.');
          setLoading(false);
          return;
        }

        const factorsResponse = await mfaApi.listFactors();
        const totpFactors = Array.isArray(factorsResponse?.data?.totp)
          ? factorsResponse.data.totp
          : Array.isArray(factorsResponse?.data?.all)
          ? factorsResponse.data.all.filter((factor: any) => String(factor?.factor_type || '').toLowerCase() === 'totp')
          : [];
        const verifiedFactor = totpFactors.find((factor: any) => String(factor?.status || '').toLowerCase() === 'verified');

        if (!verifiedFactor?.id) {
          const enrollResponse = await mfaApi.enroll({
            factorType: 'totp',
            friendlyName: `${role.toUpperCase()}-${new Date().toISOString().slice(0, 10)}`,
            issuer: 'SlickTech Solutions',
          });

          const enrolledFactorId = String(enrollResponse?.data?.id || '');
          const qrPayload = String(enrollResponse?.data?.totp?.qr_code || '');
          const secretPayload = String(enrollResponse?.data?.totp?.secret || '');

          if (!enrolledFactorId) {
            await supabase.auth.signOut();
            setError('Could not initialize two-factor enrollment. Please retry.');
            setLoading(false);
            return;
          }

          const challengeResponse = await mfaApi.challenge({ factorId: enrolledFactorId });
          const challengeId = challengeResponse?.data?.id || challengeResponse?.data?.challengeId || '';
          if (!challengeId) {
            await supabase.auth.signOut();
            setError('Could not start two-factor enrollment challenge. Please retry.');
            setLoading(false);
            return;
          }

          setPendingLoginContext({ role, profile: profileData });
          setMfaFactorId(enrolledFactorId);
          setMfaChallengeId(String(challengeId));
          setMfaQrCode(qrPayload);
          setMfaSecret(secretPayload);
          setRequiresTwoFactor(true);
          setIsTwoFactorEnrollment(true);
          setTwoFactorCode('');
          setError(null);
          setLoading(false);
          return;
        }

        const challengeResponse = await mfaApi.challenge({ factorId: verifiedFactor.id });
        const challengeId = challengeResponse?.data?.id || challengeResponse?.data?.challengeId || '';
        if (!challengeId) {
          await supabase.auth.signOut();
          setError('Could not start two-factor verification challenge. Please retry.');
          setLoading(false);
          return;
        }

        setPendingLoginContext({ role, profile: profileData });
        setMfaFactorId(String(verifiedFactor.id));
        setMfaChallengeId(String(challengeId));
        setRequiresTwoFactor(true);
        setIsTwoFactorEnrollment(false);
        setTwoFactorCode('');
        setError(null);
        setLoading(false);
        return;
      }

      completeLogin(role, profileData);
      setLoading(false);
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed due to a temporary issue. Please retry in a moment.');
      setLoading(false);
    }
  };

  const handleTwoFactorVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = twoFactorCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit verification code from your authenticator app.');
      return;
    }

    if (!pendingLoginContext || !mfaFactorId || !mfaChallengeId) {
      setError('Two-factor session expired. Please sign in again.');
      resetTwoFactorState();
      await supabase.auth.signOut();
      return;
    }

    setLoading(true);
    try {
      const mfaApi = (supabase.auth as any)?.mfa;
      if (!mfaApi?.verify) {
        throw new Error('MFA verification is unavailable in this environment.');
      }

      const verifyResponse = await mfaApi.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code,
      });

      if (verifyResponse?.error) {
        throw verifyResponse.error;
      }

      completeLogin(pendingLoginContext.role, pendingLoginContext.profile);
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('invalid')) {
        setError('Invalid 2FA code. Please try again.');
      } else if (msg.includes('expired')) {
        setError('2FA code expired. Please sign in again to request a new challenge.');
      } else {
        setError(err?.message || 'Could not verify two-factor code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = useCallback((reason?: 'inactivity') => {
    supabase.auth.signOut();
    sessionStorage.removeItem('slicktech_user');
    setUserRole(null);
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setLoading(false);
    setIsForgotPassword(false);
    resetTwoFactorState();
    setShowInactivityWarning(false);
    setCountdownSeconds(30);
    if (reason === 'inactivity') {
      setError('You were logged out due to inactivity. Please sign in again.');
    } else {
      setError(null);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setShowInactivityWarning(false);
      setCountdownSeconds(30);
      return;
    }

    const resetInactivityTimer = () => {
      inactivityDeadlineRef.current = Date.now() + INACTIVITY_TIMEOUT_MS;
      setShowInactivityWarning(false);
      setCountdownSeconds(30);
    };

    const handleInactivityTick = () => {
      const remainingMs = inactivityDeadlineRef.current - Date.now();

      if (remainingMs <= 0) {
        handleLogout('inactivity');
        return;
      }

      if (remainingMs <= WARNING_WINDOW_MS) {
        setShowInactivityWarning(true);
        setCountdownSeconds(Math.ceil(remainingMs / 1000));
      } else {
        setShowInactivityWarning(false);
      }
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    resetInactivityTimer();

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true });
    });

    const tickInterval = window.setInterval(handleInactivityTick, 1000);

    return () => {
      window.clearInterval(tickInterval);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
    };
  }, [INACTIVITY_TIMEOUT_MS, WARNING_WINDOW_MS, isLoggedIn, handleLogout]);

  const renderInactivityWarning = () => {
    if (!showInactivityWarning || !isLoggedIn) {
      return null;
    }

    return (
      <div className="fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-xl">
        <p className="text-sm font-semibold text-amber-900">Session expiring soon</p>
        <p className="mt-1 text-xs text-amber-800">
          You will be logged out in <span className="font-bold">{countdownSeconds}s</span> due to inactivity.
        </p>
      </div>
    );
  };

  if (isForgotPassword) {
    return <ForgotPasswordScreen onBack={() => setIsForgotPassword(false)} />;
  }

  if (isLoggedIn && userRole === 'admin') {
    return (
      <>
        <AdminDashboard onLogout={handleLogout} />
        {renderInactivityWarning()}
      </>
    );
  }

  if (isLoggedIn && userRole === 'staff') {
    return (
      <>
        <StaffDashboard onLogout={handleLogout} />
        {renderInactivityWarning()}
      </>
    );
  }

  if (isLoggedIn && userRole === 'user') {
    return (
      <>
        <UserDashboard onLogout={handleLogout} />
        {renderInactivityWarning()}
      </>
    );
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

          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Welcome Back</h1>
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

          <form className="space-y-6" onSubmit={requiresTwoFactor ? handleTwoFactorVerification : handleLogin}>
            {requiresTwoFactor && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-semibold">{isTwoFactorEnrollment ? 'Set up two-factor authentication' : 'Two-factor verification required'}</p>
                <p className="mt-1">{isTwoFactorEnrollment ? 'Scan the QR code with your authenticator app, then enter the 6-digit code to finish setup.' : 'Enter the 6-digit code from your authenticator app to continue.'}</p>
              </div>
            )}

            {requiresTwoFactor && isTwoFactorEnrollment && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Authenticator QR Code</p>
                <div className="flex justify-center">
                  {mfaQrCode.startsWith('<svg') ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-2" dangerouslySetInnerHTML={{ __html: mfaQrCode }} />
                  ) : mfaQrCode ? (
                    <img src={mfaQrCode} alt="2FA QR code" className="h-48 w-48 rounded-lg border border-slate-200 bg-white p-2" />
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">QR preview unavailable. Use the manual setup key below.</div>
                  )}
                </div>
                {mfaSecret && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-600">Manual setup key</p>
                    <p className="mt-1 break-all font-mono text-xs font-semibold text-slate-800">{mfaSecret}</p>
                  </div>
                )}
              </div>
            )}
            {/* Email Field */}
            {!requiresTwoFactor && (
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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                  title="Enter a valid email address"
                  placeholder="Enter your email address" 
                  className="w-full pl-12 pr-4 py-4 outline-none text-sm text-slate-700 placeholder-slate-400 rounded-xl bg-transparent"
                />
              </div>
              {fieldErrors.email && <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors.email}</p>}
            </div>
            )}

            {/* Password Field */}
            {!requiresTwoFactor && (
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }}
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
              {fieldErrors.password && <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors.password}</p>}
            </div>
            )}

            {requiresTwoFactor && (
              <div className="group">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{isTwoFactorEnrollment ? 'Enter code from newly added authenticator' : 'Authenticator Code'}</label>
                <div className="relative bg-white rounded-xl border-2 border-slate-200 hover:border-blue-300 focus-within:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                    <FaLock />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full pl-12 pr-4 py-4 outline-none text-sm tracking-[0.35em] font-bold text-slate-700 placeholder-slate-400 rounded-xl bg-transparent"
                  />
                </div>
              </div>
            )}

            {!requiresTwoFactor && <div className="flex items-center justify-end text-sm">
              <button 
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors hover:underline"
              >
                Forgot Password?
              </button>
            </div>}

            {requiresTwoFactor && (
              <div className="flex items-center justify-end text-sm">
                <button
                  type="button"
                  onClick={async () => {
                    resetTwoFactorState();
                    await supabase.auth.signOut();
                    setError(isTwoFactorEnrollment ? 'Two-factor setup cancelled. Please sign in again.' : 'Two-factor verification cancelled. Please sign in again.');
                  }}
                  className="text-slate-600 hover:text-slate-800 font-medium transition-colors hover:underline"
                >
                  Cancel and sign in again
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {requiresTwoFactor ? 'Verifying...' : 'Signing In...'}
                </div>
              ) : (
                requiresTwoFactor ? 'Verify 2FA' : 'Sign In'
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