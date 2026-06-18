"use client";

import React, { useState } from 'react';
import { Note } from '@/stores/notesStore';
import { MOOD_STYLES } from '@/lib/moods';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

interface NoteTableProps {
  notes: Note[];
  onToggleHide: (id: string, currentHidden: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const NoteTable: React.FC<NoteTableProps> = ({ notes, onToggleHide, onDelete }) => {
  const [actioningId, setActioningId] = useState<string | null>(null);

  const handleToggleHide = async (id: string, currentHidden: boolean) => {
    setActioningId(id);
    await onToggleHide(id, currentHidden);
    setActioningId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this note?')) {
      setActioningId(id);
      await onDelete(id);
      setActioningId(null);
    }
  };

  if (notes.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
        No notes found in the database.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#c9a96e]/20 bg-[#fbf9f4]/60 backdrop-blur-sm shadow-xl font-sans">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-[#4a3e2e]">
          <thead className="bg-[#eae6db]/30 text-xs font-semibold uppercase tracking-wider text-[#7d6c56] border-b border-[#eae6db]">
            <tr>
              <th className="px-6 py-4 font-mono">Author</th>
              <th className="px-6 py-4 font-mono">Country</th>
              <th className="px-6 py-4 font-mono">Mood</th>
              <th className="px-6 py-4 w-1/3 font-mono">Message</th>
              <th className="px-6 py-4 font-mono">Date</th>
              <th className="px-6 py-4 text-right font-mono">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eae6db]/80 bg-transparent">
            {notes.map((note) => {
              const moodStyle = MOOD_STYLES[note.mood.toLowerCase()] || MOOD_STYLES.happy;
              const isBusy = actioningId === note.id;

              return (
                <tr 
                  key={note.id} 
                  className={`hover:bg-[#eae6db]/20 transition-colors ${
                    note.is_hidden ? 'opacity-40 bg-[#f5f2eb]/50' : ''
                  }`}
                >
                  {/* Name */}
                  <td className="whitespace-nowrap px-6 py-4 font-semibold text-[#4a3e2e] font-mono">
                    {note.random_name}
                  </td>
                  
                  {/* Country */}
                  <td className="whitespace-nowrap px-6 py-4 font-mono">
                    📍 {note.country}
                  </td>
                  
                  {/* Mood */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full text-white font-medium bg-gradient-to-r ${moodStyle.gradient} font-mono`}>
                      {moodStyle.emoji} {moodStyle.label}
                    </span>
                  </td>
                  
                  {/* Message */}
                  <td className="px-6 py-4 text-xs max-h-20 overflow-y-auto">
                    <p className="line-clamp-2 italic">&ldquo;{note.message}&rdquo;</p>
                  </td>
                  
                  {/* Date */}
                  <td className="whitespace-nowrap px-6 py-4 text-[#7d6c56] font-mono">
                    {new Date(note.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  
                  {/* Actions */}
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {/* Hide/Unhide Toggle */}
                      <button
                        onClick={() => handleToggleHide(note.id, note.is_hidden)}
                        disabled={isBusy}
                        title={note.is_hidden ? 'Show Note' : 'Hide Note'}
                        className={`rounded-lg p-1.5 transition-colors ${
                          note.is_hidden
                            ? 'text-emerald-700 hover:bg-emerald-100/50'
                            : 'text-[#c9a96e] hover:bg-[#c9a96e]/10'
                        } disabled:opacity-50`}
                      >
                        {note.is_hidden ? (
                          <Eye className="h-4.5 w-4.5" />
                        ) : (
                          <EyeOff className="h-4.5 w-4.5" />
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(note.id)}
                        disabled={isBusy}
                        title="Delete Permanently"
                        className="rounded-lg p-1.5 text-rose-700 hover:bg-rose-100/50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NoteTable;
