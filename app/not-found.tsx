"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time day/night theme check based on PH time (Asia/Manila)
  const [isNight, setIsNight] = useState(() => {
    const now = new Date();
    try {
      const phOptionsHour = { timeZone: 'Asia/Manila', hour: '2-digit', hour12: false } as const;
      const formatterHour = new Intl.DateTimeFormat('en-US', phOptionsHour);
      const hour = parseInt(formatterHour.format(now), 10);
      return hour >= 18 || hour < 6;
    } catch (e) {
      if (typeof window !== 'undefined') {
        const localHour = now.getHours();
        return localHour >= 18 || localHour < 6;
      }
      return false;
    }
  });

  interface Star {
    id: number;
    top: number;
    left: number;
    size: number;
    duration: number;
    delay: number;
  }
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      try {
        const phOptionsHour = { timeZone: 'Asia/Manila', hour: '2-digit', hour12: false } as const;
        const formatterHour = new Intl.DateTimeFormat('en-US', phOptionsHour);
        const hour = parseInt(formatterHour.format(now), 10);
        setIsNight(hour >= 18 || hour < 6);
      } catch (e) {
        const localHour = now.getHours();
        setIsNight(localHour >= 18 || localHour < 6);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);

    // Generate stars only on client side to avoid Next.js hydration mismatch
    const generatedStars = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2 + 0.8, // 0.8px to 2.8px
      duration: Math.random() * 25 + 25, // 25s to 50s (slow majestic float)
      delay: Math.random() * -50, // Negative delay so stars start scattered and moving instantly on load
    }));
    setStars(generatedStars);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <main className={`min-h-screen w-screen flex items-center justify-center p-4 font-sans relative overflow-hidden ${mounted ? 'theme-transition' : ''} ${
      isNight ? 'bg-[#0b0f19] text-[#eae6db]' : 'bg-[#f5f2eb] text-[#4a3e2e]'
    }`}>
      {/* Dynamic Background Layer for Day (warm sun, blurred clouds) */}
      <div className={`absolute inset-0 z-0 ${mounted ? 'transition-opacity duration-1000' : ''} ${isNight ? 'opacity-0' : 'opacity-100 bg-[#f5f2eb]'}`}>
        {/* Soft Glowing Sun */}
        <div className="absolute -top-32 -left-32 w-[55vw] h-[55vw] max-w-[550px] max-h-[550px] rounded-full bg-amber-200/20 blur-[110px] pointer-events-none select-none" />
        
        {/* Soft drifting clouds */}
        <div className="absolute top-[12%] left-[15%] w-[320px] h-[110px] rounded-full bg-[#fbf9f4]/45 blur-[65px] animate-drift-slow pointer-events-none select-none" />
        <div className="absolute top-[42%] right-[8%] w-[420px] h-[140px] rounded-full bg-[#fbf9f4]/35 blur-[75px] animate-drift-medium pointer-events-none select-none" />
        <div className="absolute bottom-[8%] left-[28%] w-[260px] h-[90px] rounded-full bg-[#fbf9f4]/30 blur-[55px] animate-drift-slow pointer-events-none select-none" />
      </div>

      {/* Dynamic Background Layer for Night (moon glow, twinkling stars) */}
      <div className={`absolute inset-0 z-0 ${mounted ? 'transition-opacity duration-1000' : ''} ${isNight ? 'opacity-100 bg-gradient-to-b from-[#0b0f19] to-[#16222f]' : 'opacity-0'}`}>
        {/* Soft Glowing Moon */}
        <div className="absolute -top-32 -left-32 w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] rounded-full bg-blue-100/10 blur-[100px] pointer-events-none select-none" />
        
        {/* Twinkling Stars grid */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full bg-white/75 animate-twinkle"
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                '--twinkle-duration': `${star.duration}s`,
                animationDelay: `${star.delay}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      {/* Main card */}
      <div className={`relative w-full max-w-md border rounded-2xl p-8 backdrop-blur-md shadow-2xl text-center space-y-6 theme-transition z-10 ${
        isNight ? 'bg-[#16222f]/45 border-white/10 text-[#eae6db]' : 'bg-[#fbf9f4]/80 border-[#c9a96e]/20 text-[#4a3e2e]'
      }`}>
        
        {/* Animated Compass Icon */}
        <div className={`mx-auto h-16 w-16 rounded-full bg-gradient-to-tr from-[#9c89a4] to-[#e3d3b4] flex items-center justify-center text-[#fbf9f4] shadow-md animate-bounce`}>
          <Compass className="h-8 w-8 animate-spin-slow" />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h2 className={`text-4xl font-extrabold tracking-tight font-mono theme-transition ${isNight ? 'text-[#e3d3b4]' : 'text-[#4a3e2e]'}`}>404</h2>
          <h3 className={`text-lg font-bold font-mono uppercase tracking-wider theme-transition ${isNight ? 'text-[#e3d3b4]' : 'text-[#7d6c56]'}`}>Off the Map</h3>
          <p className={`text-xs font-mono leading-relaxed max-w-xs mx-auto theme-transition ${isNight ? 'text-[#a1a1aa]' : 'text-[#7d6c56]'}`}>
            It looks like you've drifted off the coordinates. The page you're searching for doesn't exist or has been moved.
          </p>
        </div>

        {/* Divider */}
        <div className={`border-t w-12 mx-auto theme-transition ${isNight ? 'border-white/10' : 'border-[#eae6db]'}`} />

        {/* Back Link Button */}
        <div className="pt-2">
          <Link
            href="/"
            className={`inline-flex items-center justify-center gap-2 w-full rounded-xl py-3 text-xs font-semibold uppercase tracking-wider shadow-md transition-all duration-300 hover:opacity-90 active:scale-[0.98] font-mono ${
              isNight
                ? 'bg-[#eae6db] hover:bg-[#f5f2eb] text-[#0b0f19]'
                : 'bg-[#c9a96e] hover:bg-[#b8985c] text-[#fbf9f4]'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Map</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
