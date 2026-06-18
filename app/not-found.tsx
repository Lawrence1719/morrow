"use client";

import React from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen w-screen bg-[#f5f2eb] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Decorative background blur blobs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-[#c9a96e]/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-[#9c89a4]/10 blur-3xl" />

      {/* Main card */}
      <div className="relative w-full max-w-md bg-[#fbf9f4]/80 border border-[#c9a96e]/20 rounded-2xl p-8 backdrop-blur-md shadow-2xl text-center space-y-6">
        
        {/* Animated Compass Icon */}
        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-tr from-[#9c89a4] to-[#e3d3b4] flex items-center justify-center text-[#fbf9f4] shadow-md animate-bounce">
          <Compass className="h-8 w-8 animate-spin-slow" />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold text-[#4a3e2e] tracking-tight font-mono">404</h2>
          <h3 className="text-lg font-bold text-[#7d6c56] font-mono uppercase tracking-wider">Off the Map</h3>
          <p className="text-xs text-[#7d6c56] font-mono leading-relaxed max-w-xs mx-auto">
            It looks like you've drifted off the coordinates. The page you're searching for doesn't exist or has been moved.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-[#eae6db] w-12 mx-auto" />

        {/* Back Link Button */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-[#c9a96e] hover:bg-[#b8985c] py-3 text-xs font-semibold uppercase tracking-wider text-[#fbf9f4] shadow-md transition-all duration-300 hover:opacity-90 active:scale-[0.98] font-mono"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Map</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
