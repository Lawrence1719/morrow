import React from 'react';
import { Note } from '@/stores/notesStore';
import { MOOD_STYLES } from '@/lib/moods';

interface MoodStatsProps {
  notes: Note[];
}

const MoodStats: React.FC<MoodStatsProps> = ({ notes }) => {
  const totalNotes = notes.length;
  const hiddenNotes = notes.filter((n) => n.is_hidden).length;
  const activeNotes = totalNotes - hiddenNotes;

  // Initialize count of moods
  const moodCounts: Record<string, number> = {
    happy: 0,
    sad: 0,
    peaceful: 0,
    anxious: 0,
    dreamy: 0,
  };

  // Count active moods (optional: count all moods, but counting active ones aligns with public map)
  notes.forEach((note) => {
    const m = note.mood.toLowerCase();
    if (m in moodCounts) {
      moodCounts[m]++;
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
      
      {/* Metric Cards */}
      <div className="md:col-span-1 flex flex-col gap-4">
        {/* Card 1: Total */}
        <div className="rounded-xl border border-[#c9a96e]/20 bg-[#fbf9f4]/60 p-6 backdrop-blur-sm shadow-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7d6c56] font-mono">Total Dropped Notes</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-[#4a3e2e] font-mono">{totalNotes}</span>
            <span className="text-xs text-[#7d6c56] font-mono">submissions</span>
          </div>
        </div>

        {/* Card 2: Active vs Hidden */}
        <div className="rounded-xl border border-[#c9a96e]/20 bg-[#fbf9f4]/60 p-6 backdrop-blur-sm shadow-md flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7d6c56] font-mono">Map Visibility</span>
            <div className="mt-2 text-sm text-[#4a3e2e]">
              <span className="font-bold text-emerald-700">{activeNotes}</span> Visible / <span className="font-bold text-amber-600">{hiddenNotes}</span> Moderated
            </div>
          </div>
        </div>
      </div>

      {/* Mood Distribution */}
      <div className="md:col-span-2 rounded-xl border border-[#c9a96e]/20 bg-[#fbf9f4]/60 p-6 backdrop-blur-sm shadow-md">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-[#7d6c56] font-mono mb-4">Mood Frequency Breakdown</h4>
        
        <div className="space-y-4">
          {Object.entries(MOOD_STYLES).map(([key, style]) => {
            const count = moodCounts[key] || 0;
            const percentage = totalNotes > 0 ? Math.round((count / totalNotes) * 100) : 0;
            
            return (
              <div key={key} className="space-y-1">
                {/* Info */}
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-[#4a3e2e] font-mono">
                    <span>{style.emoji}</span>
                    <span>{style.label}</span>
                  </span>
                  <span className="text-[#7d6c56] font-mono">
                    {count} notes ({percentage}%)
                  </span>
                </div>
                {/* Progress bar container */}
                <div className="h-2 w-full rounded-full bg-[#eae6db]/40 overflow-hidden border border-[#c9a96e]/10">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${style.gradient} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
};

export default MoodStats;
