"use client";

import React, { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-white items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading password reset...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
