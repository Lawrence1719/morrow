"use client";

import React from 'react';
import { X, MapPin } from 'lucide-react';
import { Note } from '@/stores/notesStore';
import { MOOD_STYLES } from '@/lib/moods';

interface GlobeDetailsCardProps {
  note: Note | null;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const GlobeDetailsCard: React.FC<GlobeDetailsCardProps> = ({ 
  note, 
  onClose,
  onMouseEnter,
  onMouseLeave
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
      className="fixed bottom-0 left-0 right-0 z-[1000] md:absolute md:top-6 md:right-6 md:left-auto md:bottom-auto md:max-w-sm w-full p-4 md:p-0 transition-all duration-300 animate-slide-up"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div 
        className="w-full rounded-t-2xl md:rounded-2xl border border-[#c9a96e]/20 bg-[#fbf9f4]/90 backdrop-blur-md p-5 shadow-2xl text-[#4a3e2e]"
      >
        {/* Glow accent */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 h-1 w-20 blur-sm bg-gradient-to-r ${moodStyle.gradient}`} />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-4 mt-1">
          <span className="text-xs font-semibold text-[#7d6c56] flex items-center gap-1 font-mono">
            <MapPin className="h-3.5 w-3.5 text-[#c9a96e]" />
            {note.country}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-medium bg-gradient-to-r ${moodStyle.gradient} font-mono`}>
              {moodStyle.emoji} {moodStyle.label}
            </span>
            <button 
              onClick={onClose}
              className="rounded-full p-1 text-[#7d6c56] hover:bg-[#eae6db] hover:text-[#4a3e2e] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message body */}
        <p className="text-sm md:text-base text-[#4a3e2e] leading-relaxed italic my-3 font-mono">
          &ldquo;{note.message}&rdquo;
        </p>

        {/* Card Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#eae6db] text-[10px] text-[#7d6c56] font-mono">
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
