"use client";

import React, { useState } from 'react';
import { useNotesStore } from '@/stores/notesStore';
import { useToastStore } from '@/stores/toastStore';
import { MOOD_STYLES } from '@/lib/moods';
import { X, Send } from 'lucide-react';

interface NoteFormProps {
  onClose: () => void;
  isNight?: boolean;
}

const NoteForm: React.FC<NoteFormProps> = ({ onClose, isNight = false }) => {
  const { addNote, isSubmitting, error: storeError } = useNotesStore();
  const { showToast } = useToastStore();
  
  const [message, setMessage] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('happy');
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!message.trim()) {
      setLocalError('Please write a message.');
      return;
    }

    if (message.length > 280) {
      setLocalError('Message must be 280 characters or less.');
      return;
    }

    const res = await addNote(message, selectedMood);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Success',
        message: 'Your mood note has been successfully dropped!'
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: res.error || 'Something went wrong while dropping your note.'
      });
      setLocalError(res.error || 'Something went wrong.');
    }
  };

  const remainingChars = 280 - message.length;
  const moodStyle = MOOD_STYLES[selectedMood] || MOOD_STYLES.happy;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in font-sans overflow-y-auto ${
      isNight ? 'bg-black/60' : 'bg-[#4a3e2e]/40'
    }`}>
      <div 
        className={`relative w-full max-w-md my-auto overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 max-h-[90vh] flex flex-col ${
          isNight 
            ? 'border-white/10 bg-[#16222f]/60 text-[#eae6db]' 
            : 'border-white/60 bg-white/10 text-[#4a3e2e]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow behind modal header */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-1 w-32 blur-md bg-gradient-to-r ${moodStyle.gradient}`} />

        {/* Modal Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 flex-shrink-0 ${
          isNight ? 'border-white/10' : 'border-[#eae6db]'
        }`}>
          <div>
            <h3 className={`text-lg font-bold tracking-tight font-mono ${isNight ? 'text-[#e3d3b4]' : 'text-[#4a3e2e]'}`}>Share your mood</h3>
            <p className={`text-xs font-mono ${isNight ? 'text-[#a1a1aa]' : 'text-[#7d6c56]'}`}>Your note will be pinned to your approximate location.</p>
          </div>
          <button 
            onClick={onClose}
            className={`rounded-full p-1 transition-colors ${
              isNight 
                ? 'text-[#a1a1aa] hover:bg-white/10 hover:text-white' 
                : 'text-[#7d6c56] hover:bg-[#eae6db] hover:text-[#4a3e2e]'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center text-[#fbf9f4] bg-gradient-to-br ${moodStyle.gradient} shadow-lg animate-bounce`}>
              {moodStyle.emoji}
            </div>
            <div>
              <h4 className={`text-xl font-bold font-mono ${isNight ? 'text-[#e3d3b4]' : 'text-[#4a3e2e]'}`}>Note dropped!</h4>
              <p className={`text-sm mt-1 font-mono ${isNight ? 'text-[#a1a1aa]' : 'text-[#7d6c56]'}`}>Your anonymous thoughts have been shared with the world.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-grow">
            
            {/* Mood selector */}
            <div className="space-y-2">
              <label className={`text-xs font-semibold uppercase tracking-wider font-mono ${isNight ? 'text-[#a1a1aa]' : 'text-[#7d6c56]'}`}>
                How are you feeling?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(MOOD_STYLES).map(([key, style]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleMoodSelect(key)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all duration-200 ${
                      selectedMood === key
                        ? (isNight 
                            ? 'border-[#e3d3b4] bg-[#16222f]/80 shadow-[0_4px_12px_rgba(227,211,180,0.1)] scale-105' 
                            : 'border-[#c9a96e] bg-[#f5f2eb] shadow-[0_4px_12px_rgba(201,169,110,0.15)] scale-105')
                        : (isNight
                            ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            : 'border-[#eae6db]/60 bg-[#eae6db]/25 hover:border-[#eae6db] hover:bg-[#eae6db]/50')
                    }`}
                  >
                    <span className="text-xl mb-1">{style.emoji}</span>
                    <span className={`text-[10px] font-medium font-mono ${isNight ? 'text-[#eae6db]' : 'text-[#4a3e2e]'}`}>{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className={`text-xs font-semibold uppercase tracking-wider font-mono ${isNight ? 'text-[#a1a1aa]' : 'text-[#7d6c56]'}`}>
                  Your message
                </label>
                <span className={`text-[10px] font-mono ${remainingChars < 20 ? 'text-red-500 font-bold' : (isNight ? 'text-[#a1a1aa]' : 'text-[#7d6c56]')}`}>
                  {remainingChars} chars remaining
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind? Keep it anonymous, keep it real..."
                maxLength={280}
                rows={4}
                className={`w-full rounded-xl border px-4 py-3 text-sm resize-none transition-all font-mono focus:outline-none focus:ring-1 ${
                  isNight
                    ? 'border-white/10 bg-white/5 text-[#eae6db] placeholder-[#a1a1aa]/55 focus:border-[#e3d3b4] focus:ring-[#e3d3b4]'
                    : 'border-[#eae6db] bg-[#fbf9f4] text-[#4a3e2e] placeholder-[#a3907a]/75 focus:border-[#c9a96e] focus:outline-none focus:ring-1 focus:ring-[#c9a96e]'
                }`}
              />
            </div>

            {/* Error notifications */}
            {(localError || storeError) && (
              <div className={`rounded-xl border px-4 py-3 text-xs font-mono ${
                isNight 
                  ? 'border-red-950/30 bg-red-950/20 text-red-400' 
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}>
                {localError || storeError}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-[#fbf9f4] shadow-md transition-all duration-300 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none bg-gradient-to-r ${moodStyle.gradient} font-mono uppercase tracking-wider text-xs`}
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#fbf9f4] border-t-transparent" />
              ) : (
                <>
                  <span>Drop Note</span>
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default NoteForm;
