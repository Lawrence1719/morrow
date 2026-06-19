'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Mail, Lock, ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid admin credentials.');
        setIsLoading(false);
      } else {
        router.push('/admin-management');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsLoading(false);
    }
  };

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

      {/* Main Container */}
      <div className={`relative w-full max-w-md border rounded-2xl p-8 backdrop-blur-md shadow-xl theme-transition z-10 ${
        isNight ? 'bg-[#16222f]/45 border-white/10 text-[#eae6db]' : 'bg-[#fbf9f4]/80 border-[#c9a96e]/20 text-[#4a3e2e]'
      }`}>
        
        {/* Back Link */}
        <Link 
          href="/"
          className={`inline-flex items-center gap-1.5 text-xs mb-6 transition-colors font-mono ${
            isNight ? 'text-[#a1a1aa] hover:text-[#eae6db]' : 'text-[#7d6c56] hover:text-[#4a3e2e]'
          }`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to map</span>
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className={`mx-auto h-12 w-12 rounded-full bg-gradient-to-tr from-[#c9a96e] to-[#e3d3b4] flex items-center justify-center text-[#fbf9f4] shadow-md mb-3`}>
            <KeyRound className="h-5 w-5" />
          </div>
          <h2 className={`text-2xl font-bold tracking-tight font-mono theme-transition ${isNight ? 'text-[#e3d3b4]' : 'text-[#4a3e2e]'}`}>Admin Portal</h2>
          <p className={`text-xs mt-1 font-mono theme-transition ${isNight ? 'text-[#a1a1aa]' : 'text-[#7d6c56]'}`}>Authenticate to manage map note submissions.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email input */}
          <div className="space-y-2">
            <label className={`text-xs font-semibold uppercase tracking-wider font-mono theme-transition ${isNight ? 'text-[#a1a1aa]' : 'text-[#7d6c56]'}`}>
              Admin Email
            </label>
            <div className="relative">
              <span className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none theme-transition ${isNight ? 'text-[#a1a1aa]' : 'text-[#7d6c56]'}`}>
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@morrow.map"
                className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm transition-all font-mono theme-transition focus:outline-none focus:ring-1 ${
                  isNight
                    ? 'border-white/10 bg-white/5 text-[#eae6db] placeholder-[#a1a1aa]/55 focus:border-[#e3d3b4] focus:ring-[#e3d3b4]'
                    : 'border-[#eae6db] bg-[#fbf9f4] text-[#4a3e2e] placeholder-[#a3907a]/70 focus:border-[#c9a96e] focus:ring-[#c9a96e]'
                }`}
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <label className={`text-xs font-semibold uppercase tracking-wider font-mono theme-transition ${isNight ? 'text-[#a1a1aa]' : 'text-[#7d6c56]'}`}>
              Password
            </label>
            <div className="relative">
              <span className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none theme-transition ${isNight ? 'text-[#a1a1aa]' : 'text-[#7d6c56]'}`}>
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm transition-all font-mono theme-transition focus:outline-none focus:ring-1 ${
                  isNight
                    ? 'border-white/10 bg-white/5 text-[#eae6db] placeholder-[#a1a1aa]/55 focus:border-[#e3d3b4] focus:ring-[#e3d3b4]'
                    : 'border-[#eae6db] bg-[#fbf9f4] text-[#4a3e2e] placeholder-[#a3907a]/70 focus:border-[#c9a96e] focus:ring-[#c9a96e]'
                }`}
              />
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 font-mono">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center rounded-xl py-3 text-sm font-semibold shadow-md transition-all duration-300 active:scale-[0.98] disabled:opacity-50 font-mono text-xs uppercase tracking-wider ${
              isNight 
                ? 'bg-[#eae6db] hover:bg-[#f5f2eb] text-[#0b0f19]' 
                : 'bg-[#c9a96e] hover:bg-[#b8985c] text-[#fbf9f4]'
            }`}
          >
            {isLoading ? (
              <div className={`h-5 w-5 animate-spin rounded-full border-2 border-t-transparent ${isNight ? 'border-[#0b0f19]' : 'border-[#fbf9f4]'}`} />
            ) : (
              'Sign In'
            )}
          </button>

        </form>

      </div>
    </main>
  );
}
