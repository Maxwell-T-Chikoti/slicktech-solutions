"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FaCheckCircle, FaTimesCircle, FaSearch, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';
import supabase from '@/app/lib/supabaseClient';
import { buildCertificateId, buildBookingToken } from '@/app/lib/pdfUtils';

const VerifyCertificatePage = () => {
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const initialParams = useMemo(() => {
    if (typeof window === 'undefined') return { cert: '', booking: '', type: '' };
    const params = new URLSearchParams(window.location.search);
    return {
      cert: params.get('cert') || '',
      booking: params.get('booking') || '',
      type: params.get('type') || '',
    };
  }, []);

  const verifyRecord = async (value: string) => {
    if (!value.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    const normalized = value.trim().toUpperCase();
    let bookingId = '';
    let verificationType: 'certificate' | 'booking' = 'certificate';

    if (normalized.startsWith('ST-')) {
      bookingId = normalized.replace('ST-', '');
      verificationType = 'certificate';
    } else if (normalized.startsWith('BOOK-')) {
      bookingId = normalized.replace('BOOK-', '');
      verificationType = 'booking';
    } else if (/^\d+$/.test(normalized)) {
      bookingId = normalized;
      verificationType = 'booking';
    } else {
      setError('Enter a valid certificate ID, booking token, or booking number.');
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from('bookings')
      .select('id, service, status, date, time, price, user_id')
      .eq('id', bookingId)
      .single();

    if (queryError || !data) {
      setError('No matching record was found.');
      setLoading(false);
      return;
    }

    const isCertificateValid = data.status === 'Complete' || data.status === 'Confirmed';
    const isBookingValid = ['Pending', 'Confirmed', 'Complete', 'Rejected'].includes(data.status);

    setResult({
      ...data,
      verificationType,
      certificateId: buildCertificateId(data.id),
      bookingToken: buildBookingToken(data.id),
      valid: verificationType === 'certificate' ? isCertificateValid : isBookingValid,
    });
    setLoading(false);
  };

  useEffect(() => {
    const autoValue = initialParams.cert || initialParams.booking;
    if (autoValue) {
      setSearchValue(autoValue);
      verifyRecord(initialParams.cert ? initialParams.cert : `BOOK-${initialParams.booking}`);
    }
  }, [initialParams]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 mb-6">
          <FaArrowLeft /> Back to home
        </Link>

        <div className="rounded-[2rem] border-2 border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FaShieldAlt className="text-2xl" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">Certificate & Booking Verification</h1>
            <p className="mt-3 text-slate-500">Enter a certificate ID like <strong>ST-123</strong> or a booking token like <strong>BOOK-123</strong>.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Enter certificate ID or booking token"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
            />
            <button
              onClick={() => verifyRecord(searchValue)}
              disabled={loading || !searchValue.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-300"
            >
              <FaSearch /> {loading ? 'Checking…' : 'Verify'}
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              <div className="flex items-center gap-2 font-bold"><FaTimesCircle /> Invalid record</div>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className={`mt-6 rounded-[1.5rem] border p-6 ${result.valid ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center gap-3">
                {result.valid ? <FaCheckCircle className="text-2xl text-emerald-600" /> : <FaTimesCircle className="text-2xl text-red-600" />}
                <div>
                  <h2 className={`text-xl font-black ${result.valid ? 'text-emerald-700' : 'text-red-700'}`}>
                    {result.valid ? 'Valid record found' : 'Record is not valid'}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {result.verificationType === 'certificate'
                      ? 'This certificate belongs to a confirmed SlickTech service.'
                      : 'This booking token matches a SlickTech booking record.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-white p-4 border border-white/80">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Service</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{result.service}</p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-white/80">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Status</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{result.status}</p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-white/80">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Date & Time</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{result.date} · {result.time}</p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-white/80">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Reference</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{result.verificationType === 'certificate' ? result.certificateId : result.bookingToken}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificatePage;
