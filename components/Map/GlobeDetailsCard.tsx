"use client";

import React from 'react';
import { X, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Note } from '@/stores/notesStore';
import { MOOD_STYLES } from '@/lib/moods';

interface GlobeDetailsCardProps {
  note: Note | null;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  cardRef?: React.Ref<HTMLDivElement>;
  
  // Cluster properties for multiple notes
  totalNotes?: number;
  activeIndex?: number;
  onPrevNote?: () => void;
  onNextNote?: () => void;

  isNight?: boolean;
}

const GlobeDetailsCard: React.FC<GlobeDetailsCardProps> = ({ 
  note, 
  onClose,
  onMouseEnter,
  onMouseLeave,
  cardRef,
  totalNotes = 1,
  activeIndex = 0,
  onPrevNote,
  onNextNote,
  isNight = false
}) => {
  if (!note) return null;

  const moodStyle = MOOD_STYLES[note.mood.toLowerCase()] || MOOD_STYLES.happy;
  const formattedDate = new Date(note.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div 
      ref={cardRef}
      className="fixed bottom-0 left-0 right-0 z-[1000] md:absolute md:top-6 md:right-6 md:left-auto md:bottom-auto md:max-w-sm w-full p-4 md:p-0 transition-all duration-300 animate-slide-up"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div 
        className={`w-full rounded-t-2xl md:rounded-2xl border p-5 shadow-2xl theme-transition backdrop-blur-xl ${
          isNight 
            ? 'border-white/20 bg-[#16222f]/20 text-[#eae6db]' 
            : 'border-white/60 bg-white/10 text-[#4a3e2e]'
        }`}
      >
        {/* Glow accent */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 h-1 w-20 blur-sm bg-gradient-to-r ${moodStyle.gradient}`} />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-4 mt-1">
          <span className={`text-xs font-semibold flex items-center gap-1 font-mono theme-transition ${
            isNight ? 'text-[#a1a1aa]' : 'text-[#7d6c56]'
          }`}>
            <MapPin className="h-3.5 w-3.5 text-[#c9a96e]" />
            {note.country}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-medium bg-gradient-to-r ${moodStyle.gradient} font-mono`}>
              {moodStyle.emoji} {moodStyle.label}
            </span>
            <button 
              onClick={onClose}
              className={`rounded-full p-1 transition-colors theme-transition ${
                isNight 
                  ? 'text-[#a1a1aa] hover:bg-[#1e293b] hover:text-[#eae6db]' 
                  : 'text-[#7d6c56] hover:bg-[#eae6db] hover:text-[#4a3e2e]'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message body */}
        <p className="text-sm md:text-base leading-relaxed italic my-3 font-mono">
          &ldquo;{note.message}&rdquo;
        </p>

        {/* Dynamic Pagination Bar */}
        {totalNotes > 1 && (
          <div className={`flex items-center justify-between my-3 py-1.5 px-3 rounded-xl text-xs font-mono select-none theme-transition ${
            isNight 
              ? 'bg-[#1e293b]/60 text-[#a1a1aa]' 
              : 'bg-[#eae6db]/40 text-[#7d6c56]'
          }`}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onPrevNote?.();
              }}
              className={`p-1 rounded-full transition-colors theme-transition ${
                isNight 
                  ? 'hover:bg-[#1e293b] hover:text-[#eae6db] disabled:hover:bg-transparent' 
                  : 'hover:bg-[#eae6db] hover:text-[#4a3e2e] disabled:hover:bg-transparent'
              }`}
              disabled={activeIndex === 0}
              title="Previous Note"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-[10px] md:text-[11px]">
              Note {activeIndex + 1} of {totalNotes} at this location
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onNextNote?.();
              }}
              className={`p-1 rounded-full transition-colors theme-transition ${
                isNight 
                  ? 'hover:bg-[#1e293b] hover:text-[#eae6db] disabled:hover:bg-transparent' 
                  : 'hover:bg-[#eae6db] hover:text-[#4a3e2e] disabled:hover:bg-transparent'
              }`}
              disabled={activeIndex === totalNotes - 1}
              title="Next Note"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Card Footer */}
        <div className={`flex items-center justify-between mt-4 pt-3 border-t text-[10px] font-mono theme-transition ${
          isNight 
            ? 'border-[#1e293b] text-[#a1a1aa]' 
            : 'border-[#eae6db] text-[#7d6c56]'
        }`}>
          <span className="font-semibold">
            — {note.random_name}
          </span>
          <span>
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GlobeDetailsCard;
