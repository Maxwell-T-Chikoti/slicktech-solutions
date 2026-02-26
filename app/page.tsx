'use client';

import React, { useState, useEffect } from 'react';
import LoginScreen from './screens/login'; // Assuming they are in the same folder

const LandingPage = () => {
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Start the 8-second timer
    const timer = setTimeout(() => {
      setShouldRedirect(true);
    }, 8000);

    // Cleanup timer if the component unmounts
    return () => clearTimeout(timer);
  }, []);

  // If 8 seconds have passed, show the LoginScreen instead
  if (shouldRedirect) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* 1. Top Navigation Bar */}
      <nav className="w-11/12 max-w-5xl mt-6 p-2 bg-gray-300 rounded-full flex justify-between items-center px-4 shadow-sm">
        <div className="w-10 h-10 bg-gray-400 rounded-sm flex items-center justify-center">
          <span className="text-xs font-bold text-slate-800">S</span>
        </div>
        <button className="bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-bold py-2 px-6 rounded-full uppercase tracking-wider transition-colors">
          Back to Home
        </button>
      </nav>

      {/* 2. Central Logo Area */}
      <main className="flex-grow flex flex-col items-center justify-center -mt-20">
        <div className="bg-gray-400 w-80 h-80 flex flex-col items-center justify-center mb-8 shadow-md">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-slate-800 rotate-45 flex items-center justify-center">
                <span className="text-white -rotate-45 font-bold italic">S</span>
             </div>
             <div className="text-left">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">SlickTech</h1>
                <p className="text-[10px] tracking-[0.3em] text-slate-700 uppercase">Solutions</p>
             </div>
          </div>
        </div>

        {/* 3. Loading Spinner */}
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-500 rounded-full animate-spin"></div>
        
        {/* Optional: Visual countdown for testing */}
        <p className="mt-4 text-gray-400 text-[10px] uppercase tracking-widest">
          Initializing System...
        </p>
      </main>
    </div>
  );
};

export default LandingPage;