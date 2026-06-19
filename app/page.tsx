'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

const checkIsNightPHT = (): boolean => {
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
};

function MapLoadingPlaceholder() {
  const [isNight, setIsNight] = useState(checkIsNightPHT);
  
  useEffect(() => {
    setIsNight(checkIsNightPHT());
  }, []);

  return (
    <div className={`w-full h-screen flex flex-col items-center justify-center gap-3 theme-transition ${
      isNight ? 'bg-[#0b0f19] text-[#eae6db]' : 'bg-[#f5f2eb] text-[#4a3e2e]'
    }`}>
      <div className={`w-10 h-10 border-4 rounded-full animate-spin ${
        isNight ? 'border-[#e3d3b4] border-t-transparent' : 'border-[#c9a96e] border-t-transparent'
      }`}></div>
      <span className={`text-sm font-semibold animate-pulse font-mono ${
        isNight ? 'text-[#a1a1aa]' : 'text-[#4a3e2e]/80'
      }`}>preparing world map...</span>
    </div>
  );
}

// Dynamically import map component with SSR disabled
const WorldMap = dynamic(() => import('@/components/Map/WorldMap'), {
  ssr: false,
  loading: () => <MapLoadingPlaceholder />,
});

import NoteForm from '@/components/Map/NoteForm';

export default function Home() {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isNoteActive, setIsNoteActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Real-time day/night theme check based on PH time (Asia/Manila)
  const [isNight, setIsNight] = useState(checkIsNightPHT);
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('');
  const [nickname, setNickname] = useState('');
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

        const phOptionsTime = { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true } as const;
        const formatterTime = new Intl.DateTimeFormat('en-US', phOptionsTime);
        setCurrentTime(formatterTime.format(now));
      } catch (e) {
        const localHour = now.getHours();
        setIsNight(localHour >= 18 || localHour < 6);
        setCurrentTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
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

  // Generate random greeting and nickname on mount/refresh and day-night transitions
  useEffect(() => {
    const nightGreetings = [
      'Good evening',
      'Welcome under the stars',
      'Embrace the quiet night',
      'Hello, creature of the dark',
      'Sweet dreams await',
      'Welcome to the midnight hour',
      'Greetings, night stargazer',
      'Rest your mind tonight',
      'Seek comfort in the shadows',
      'Under the silver glow'
    ];

    const dayGreetings = [
      'Good morning',
      'Good afternoon',
      'Hello, sunshine',
      'Have a wonderful day',
      'Welcome to the daylight',
      'Rise and shine',
      'Embrace the warm glow',
      'Greetings, day traveler',
      'Chase the morning dew',
      'Welcome to a fresh dawn'
    ];

    const nightNicknames = [
      'Night Owl', 'Stargazer', 'Midnight Firefly', 'Dreamy Wanderer', 
      'Cosmic Traveler', 'Shadow Seeker', 'Moonlight Sleeper', 'Starry Explorer',
      'Luminous Echo', 'Midnight Nebula', 'Obsidian Voyager', 'Indigo Stardust',
      'Velvet Seeker', 'Starry Sentinel', 'Drifting Dreamer'
    ];

    const dayNicknames = [
      'Early Bird', 'Sun Seeker', 'Day Dreamer', 'Morning Lark', 
      'Solar Traveler', 'Vibrant Pioneer', 'Golden Breeze', 'Petal Wanderer',
      'Shining Robin', 'Bright Seedling', 'Dewy Sprout', 'Meadow Wanderer',
      'Sunflower Seeker', 'Warm Ray', 'Dawning Adventurer'
    ];

    const greetings = isNight ? nightGreetings : dayGreetings;
    const nicknames = isNight ? nightNicknames : dayNicknames;

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    const randomNickname = nicknames[Math.floor(Math.random() * nicknames.length)];

    setGreeting(randomGreeting);
    setNickname(randomNickname);
  }, [isNight]);

  // Easter egg: Click logo 5 times rapidly to navigate to admin panel
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 1000) {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount >= 5) {
        router.push('/admin');
      }
    } else {
      setClickCount(1);
    }
    setLastClickTime(now);
  };

  // Keyboard shortcut listener (Ctrl + Shift + A) to open admin panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        router.push('/admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <main className={`relative w-screen h-screen overflow-hidden select-none ${mounted ? 'theme-transition' : ''} ${
      isNight 
        ? 'bg-[#0b0f19] text-[#eae6db]' 
        : 'bg-[#f5f2eb] text-[#4a3e2e]'
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

      {/* 1. World Map background layer */}
      <div className="absolute inset-0 w-full h-full z-10">
        <WorldMap onNoteSelectChange={setIsNoteActive} isNight={isNight} />
      </div>

      {/* 2. Glassmorphic App Header overlay (editorial style) */}
      <header className={`absolute top-4 left-4 right-4 md:right-auto md:top-6 md:left-6 md:max-w-sm rounded-2xl border p-4 md:p-5 backdrop-blur-xl shadow-2xl pointer-events-auto z-20 ${mounted ? 'theme-transition' : ''} ${
        isNight
          ? 'border-white/20 bg-[#16222f]/20 text-[#eae6db]'
          : 'border-white/60 bg-white/10 text-[#4a3e2e]'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full animate-pulse theme-transition ${
              isNight ? 'bg-[#e3d3b4]' : 'bg-[#c9a96e]'
            }`} />
            <h1 
              onClick={handleLogoClick}
              className={`text-xl md:text-2xl font-extrabold tracking-tight cursor-pointer active:scale-95 transition-transform font-mono theme-transition ${
                isNight ? 'text-[#e3d3b4]' : 'text-[#4a3e2e]'
              }`}
              title="morrow"
            >
              morrow
            </h1>
          </div>
          {currentTime && (
            <div className={`text-xs md:text-sm font-mono px-3 py-1.5 rounded-lg theme-transition ${
              isNight ? 'bg-[#eae6db]/10 text-[#eae6db]' : 'bg-[#4a3e2e]/5 text-[#4a3e2e]'
            }`}>
              {currentTime} <span className="opacity-70 text-[10px] md:text-xs">PHT</span>
            </div>
          )}
        </div>
        {greeting && nickname && (
          <p className={`mt-2.5 text-xs font-mono font-bold tracking-wide uppercase ${
            isNight ? 'text-[#e3d3b4]' : 'text-[#c9a96e]'
          }`}>
            {greeting}, {nickname}
          </p>
        )}
        <p className={`mt-1.5 text-[11px] md:text-xs leading-relaxed font-mono hidden sm:block theme-transition ${
          isNight ? 'text-[#a1a1aa]' : 'text-[#7d6c56]'
        }`}>
          An anonymous, geolocated map of human emotion. Share how you are feeling right now and see thoughts from around the globe.
        </p>
      </header>

      {/* 3. Drop Note Floating Action Button (aged gold - full width on mobile) */}
      <div className={`absolute bottom-6 left-6 right-6 md:left-auto md:right-10 md:bottom-10 z-[1000] pointer-events-auto transition-all duration-300 ${isNoteActive ? 'opacity-0 scale-95 pointer-events-none md:opacity-100 md:scale-100 md:pointer-events-auto' : ''}`}>
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full md:w-auto group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#c9a96e] px-6 py-4 font-semibold text-[#fbf9f4] shadow-[0_4px_20px_rgba(201,169,110,0.3)] transition-all duration-300 hover:scale-[1.04] hover:bg-[#b8985c] hover:shadow-[0_4px_30px_rgba(201,169,110,0.5)] active:scale-[0.98] font-mono text-xs uppercase tracking-wider"
        >
          <Sparkles className="h-4 w-4 text-[#fbf9f4] animate-pulse" />
          <span>Drop a Note</span>
        </button>
      </div>

      {/* 5. Submitting Form Modal Overlay */}
      {isFormOpen && (
        <NoteForm onClose={() => setIsFormOpen(false)} isNight={isNight} />
      )}
      
    </main>
  );
}
