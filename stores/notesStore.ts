import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Note {
  id: string;
  random_name: string;
  message: string;
  mood: string;
  latitude: number;
  longitude: number;
  country: string;
  is_hidden: boolean;
  created_at: string;
}

interface NotesState {
  notes: Note[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  addNote: (message: string, mood: string) => Promise<{ success: boolean; error?: string }>;
  subscribeToRealtime: () => () => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/notes');
      if (!res.ok) {
        throw new Error('Failed to fetch notes');
      }
      const data = await res.json();
      set({ notes: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'An error occurred while fetching notes', isLoading: false });
    }
  },

  addNote: async (message: string, mood: string) => {
    set({ isSubmitting: true, error: null });
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, mood }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit note');
      }

      // Optimistic UI update: immediately push the note to local state
      set((state) => {
        if (state.notes.some((n) => n.id === data.id)) return state;
        return { notes: [data, ...state.notes] };
      });

      set({ isSubmitting: false });
      return { success: true };
    } catch (err: any) {
      set({ isSubmitting: false, error: err.message || 'Failed to add note' });
      return { success: false, error: err.message || 'Failed to add note' };
    }
  },

  subscribeToRealtime: () => {
    console.log('🔌 Subscribing to Supabase Realtime...');
    
    const channel = supabase
      .channel('notes-realtime-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          console.log('🔔 Realtime change received:', eventType, payload);

          if (eventType === 'INSERT') {
            const note = newRecord as Note;
            if (!note.is_hidden) {
              set((state) => {
                if (state.notes.some((n) => n.id === note.id)) return state;
                return { notes: [note, ...state.notes] };
              });
            }
          } else if (eventType === 'UPDATE') {
            const note = newRecord as Note;
            set((state) => {
              if (note.is_hidden) {
                return { notes: state.notes.filter((n) => n.id !== note.id) };
              } else {
                const exists = state.notes.some((n) => n.id === note.id);
                if (exists) {
                  return { notes: state.notes.map((n) => (n.id === note.id ? note : n)) };
                } else {
                  return { notes: [note, ...state.notes] };
                }
              }
            });
          } else if (eventType === 'DELETE') {
            const note = oldRecord as { id: string };
            set((state) => ({
              notes: state.notes.filter((n) => n.id !== note.id),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Unsubscribing from Supabase Realtime');
      supabase.removeChannel(channel);
    };
  },
}));
