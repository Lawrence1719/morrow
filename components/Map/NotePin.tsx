import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Note } from '@/stores/notesStore';
import { MOOD_STYLES } from '@/lib/moods';

interface NotePinProps {
  note: Note;
}

export const createMoodIcon = (mood: string) => {
  const style = MOOD_STYLES[mood.toLowerCase()] || MOOD_STYLES.happy;
  return L.divIcon({
    className: 'custom-mood-marker',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full ${style.bg} opacity-50"></span>
        <span class="relative inline-flex rounded-full h-3.5 w-3.5 ${style.bg} border-2 border-white shadow-md"></span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -10]
  });
};

const NotePin: React.FC<NotePinProps> = ({ note }) => {
  const moodStyle = MOOD_STYLES[note.mood.toLowerCase()] || MOOD_STYLES.happy;
  const formattedDate = new Date(note.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Marker 
      position={[note.latitude, note.longitude]} 
      icon={createMoodIcon(note.mood)}
    >
      <Popup className="mood-popup">
        <div className="p-1 min-w-[200px] text-slate-800 font-sans">
          {/* Card Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              📍 {note.country}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-medium bg-gradient-to-r ${moodStyle.gradient}`}>
              {moodStyle.emoji} {moodStyle.label}
            </span>
          </div>

          {/* Message content */}
          <p className="text-sm text-slate-700 leading-relaxed italic my-2">
            &ldquo;{note.message}&rdquo;
          </p>

          {/* Card Footer */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
            <span className="font-semibold text-slate-500">
              — {note.random_name}
            </span>
            <span>
              {formattedDate}
            </span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default NotePin;
