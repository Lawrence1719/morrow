'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Note } from '@/stores/notesStore';
import NoteTable from '@/components/Admin/NoteTable';
import MoodStats from '@/components/Admin/MoodStats';
import { LogOut, ArrowLeft, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
      duration: Math.random() * 4 + 3, // 3s to 7s
      delay: Math.random() * 5, // 0s to 5s
    }));
    setStars(generatedStars);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchAdminNotes = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/notes?admin=true');
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized session.');
        }
        throw new Error('Failed to fetch administrator records.');
      }
      const data = await res.json();
      setNotes(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading notes.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Redirect if not authenticated (middleware should also protect this, but it is good defense in depth)
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      fetchAdminNotes();
    }
  }, [status, router]);

  const handleToggleHide = async (id: string, currentHidden: boolean) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_hidden: !currentHidden }),
      });

      if (!res.ok) {
        throw new Error('Failed to update note status.');
      }

      // Update local state directly for instantaneous UI response
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === id ? { ...note, is_hidden: !currentHidden } : note
        )
      );
    } catch (err: any) {
      alert(err.message || 'An error occurred during update.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete note.');
      }

      // Update local state directly for instantaneous UI response
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
    } catch (err: any) {
      alert(err.message || 'An error occurred during deletion.');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className={`min-h-screen w-screen flex flex-col items-center justify-center gap-3 font-sans ${mounted ? 'theme-transition' : ''} ${
        isNight 
          ? 'bg-[#0b0f19] text-[#eae6db]' 
          : 'bg-[#f5f2eb] text-[#4a3e2e]'
      }`}>
        <div className={`w-10 h-10 border-4 rounded-full animate-spin ${
          isNight ? 'border-[#e3d3b4] border-t-transparent' : 'border-[#c9a96e] border-t-transparent'
        }`}></div>
        <span className={`text-sm font-semibold font-mono ${
          isNight ? 'text-[#a1a1aa]' : 'text-[#7d6c56]'
        }`}>Loading admin panel...</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans p-6 sm:p-8 relative overflow-x-hidden ${mounted ? 'theme-transition' : ''} ${
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

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation / Header */}
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b theme-transition ${
          isNight ? 'border-white/10' : 'border-[#eae6db]'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <Link 
                href="/"
                className={`flex items-center gap-1 text-xs transition-colors mr-2 font-mono ${
                  isNight ? 'text-[#a1a1aa] hover:text-[#eae6db]' : 'text-[#7d6c56] hover:text-[#4a3e2e]'
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Map</span>
              </Link>
              <span className={isNight ? 'text-white/10' : 'text-[#eae6db]'}>|</span>
              <span className={`text-xs font-mono ${isNight ? 'text-[#a1a1aa]' : 'text-[#7d6c56]'}`}>Dashboard</span>
            </div>
            <h1 className={`text-3xl font-extrabold tracking-tight mt-1 font-mono theme-transition ${
              isNight ? 'text-[#e3d3b4]' : 'text-[#4a3e2e]'
            }`}>
              Management Console
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAdminNotes(true)}
              disabled={isRefreshing}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all disabled:opacity-50 font-mono uppercase tracking-wider theme-transition ${
                isNight 
                  ? 'border-white/15 bg-[#16222f]/45 text-[#eae6db]/80 hover:bg-[#16222f]/85 hover:text-[#eae6db]' 
                  : 'border-[#c9a96e]/20 bg-[#fbf9f4]/85 text-[#7d6c56] hover:bg-[#eae6db] hover:text-[#4a3e2e]'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-[0.98] font-mono uppercase tracking-wider theme-transition ${
                isNight 
                  ? 'bg-[#eae6db] text-[#0b0f19] hover:bg-[#f5f2eb] hover:shadow-md' 
                  : 'bg-[#4a3e2e] text-[#fbf9f4] hover:bg-[#3d3224] hover:shadow-md'
              }`}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-mono">
            {error}
          </div>
        )}

        {/* Mood Aggregates and Analytics Section */}
        <MoodStats notes={notes} isNight={isNight} />

        {/* Table Content Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className={`text-lg font-bold font-mono transition-colors duration-1000 ${isNight ? 'text-[#eae6db]' : 'text-[#4a3e2e]'}`}>All Submissions</h3>
            <span className={`text-xs font-mono border rounded px-2 py-0.5 shadow-sm transition-all duration-1000 ${
              isNight 
                ? 'text-[#a1a1aa] bg-[#16222f]/40 border-white/10' 
                : 'text-[#7d6c56] bg-[#fbf9f4] border-[#c9a96e]/20'
            }`}>
              {notes.length} total entries
            </span>
          </div>
          <NoteTable 
            notes={notes} 
            onToggleHide={handleToggleHide} 
            onDelete={handleDelete} 
            isNight={isNight}
          />
        </div>

      </div>
    </div>
  );
}
