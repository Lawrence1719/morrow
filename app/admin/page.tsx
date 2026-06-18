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
      <div className="min-h-screen w-screen bg-[#f5f2eb] flex flex-col items-center justify-center gap-3 font-sans">
        <div className="w-10 h-10 border-4 border-[#c9a96e] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-semibold text-[#7d6c56] font-mono">Loading admin panel...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2eb] text-[#4a3e2e] font-sans p-6 sm:p-8 relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-[#c9a96e]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#eae6db]">
          <div>
            <div className="flex items-center gap-2">
              <Link 
                href="/"
                className="flex items-center gap-1 text-xs text-[#7d6c56] hover:text-[#4a3e2e] transition-colors mr-2 font-mono"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Map</span>
              </Link>
              <span className="text-[#eae6db]">|</span>
              <span className="text-xs text-[#7d6c56] font-mono">Dashboard</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#4a3e2e] mt-1 font-mono">
              Management Console
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAdminNotes(true)}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[#c9a96e]/20 bg-[#fbf9f4]/85 px-4 py-2.5 text-xs font-semibold text-[#7d6c56] hover:bg-[#eae6db] hover:text-[#4a3e2e] transition-all disabled:opacity-50 font-mono uppercase tracking-wider"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#4a3e2e] px-4 py-2.5 text-xs font-semibold text-[#fbf9f4] hover:bg-[#3d3224] hover:shadow-md transition-all active:scale-[0.98] font-mono uppercase tracking-wider"
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
        <MoodStats notes={notes} />

        {/* Table Content Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#4a3e2e] font-mono">All Submissions</h3>
            <span className="text-xs text-[#7d6c56] font-mono bg-[#fbf9f4] border border-[#c9a96e]/20 rounded px-2 py-0.5 shadow-sm">
              {notes.length} total entries
            </span>
          </div>
          <NoteTable 
            notes={notes} 
            onToggleHide={handleToggleHide} 
            onDelete={handleDelete} 
          />
        </div>

      </div>
    </div>
  );
}
