'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

// Dynamically import map component with SSR disabled
const WorldMap = dynamic(() => import('@/components/Map/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#f5f2eb] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-4 border-[#c9a96e] border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm font-semibold text-[#4a3e2e]/80 animate-pulse font-mono">preparing world map...</span>
    </div>
  ),
});

import NoteForm from '@/components/Map/NoteForm';

export default function Home() {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isNoteActive, setIsNoteActive] = useState(false);
  
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
    <main className="relative w-screen h-screen overflow-hidden bg-[#f5f2eb] text-[#4a3e2e] font-sans select-none">
      
      {/* 1. World Map background layer */}
      <div className="absolute inset-0 w-full h-full z-0">
        <WorldMap onNoteSelectChange={setIsNoteActive} />
      </div>

      {/* 2. Glassmorphic App Header overlay (editorial style) */}
      <header className="absolute top-4 left-4 right-4 md:right-auto md:top-6 md:left-6 md:max-w-sm rounded-2xl border border-[#c9a96e]/20 bg-[#fbf9f4]/85 p-4 md:p-5 backdrop-blur-md shadow-xl pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#c9a96e] animate-pulse" />
          <h1 
            onClick={handleLogoClick}
            className="text-xl md:text-2xl font-extrabold tracking-tight text-[#4a3e2e] cursor-pointer active:scale-95 transition-transform font-mono"
            title="morrow"
          >
            morrow
          </h1>
        </div>
        <p className="mt-1.5 text-[11px] md:text-xs text-[#7d6c56] leading-relaxed font-mono hidden sm:block">
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
        <NoteForm onClose={() => setIsFormOpen(false)} />
      )}
      
    </main>
  );
}
