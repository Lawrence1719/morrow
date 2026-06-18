'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Mail, Lock, ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid admin credentials.');
        setIsLoading(false);
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-screen bg-[#f5f2eb] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-[#c9a96e]/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-[#7d9373]/10 blur-3xl" />

      {/* Main Container */}
      <div className="relative w-full max-w-md bg-[#fbf9f4]/80 border border-[#c9a96e]/20 rounded-2xl p-8 backdrop-blur-md shadow-xl">
        
        {/* Back Link */}
        <Link 
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#7d6c56] hover:text-[#4a3e2e] mb-6 transition-colors font-mono"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to map</span>
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-tr from-[#c9a96e] to-[#e3d3b4] flex items-center justify-center text-[#fbf9f4] shadow-md mb-3">
            <KeyRound className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold text-[#4a3e2e] tracking-tight font-mono">Admin Portal</h2>
          <p className="text-xs text-[#7d6c56] mt-1 font-mono">Authenticate to manage map note submissions.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#7d6c56] font-mono">
              Admin Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7d6c56] pointer-events-none">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@morrow.map"
                className="w-full rounded-xl border border-[#eae6db] bg-[#fbf9f4] pl-10 pr-4 py-3 text-sm text-[#4a3e2e] placeholder-[#a3907a]/70 focus:border-[#c9a96e] focus:outline-none focus:ring-1 focus:ring-[#c9a96e] transition-all font-mono"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#7d6c56] font-mono">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7d6c56] pointer-events-none">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#eae6db] bg-[#fbf9f4] pl-10 pr-4 py-3 text-sm text-[#4a3e2e] placeholder-[#a3907a]/70 focus:border-[#c9a96e] focus:outline-none focus:ring-1 focus:ring-[#c9a96e] transition-all font-mono"
              />
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 font-mono">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center rounded-xl bg-[#c9a96e] hover:bg-[#b8985c] py-3 text-sm font-semibold text-[#fbf9f4] shadow-md transition-all duration-300 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 font-mono text-xs uppercase tracking-wider"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#fbf9f4] border-t-transparent" />
            ) : (
              'Sign In'
            )}
          </button>

        </form>

      </div>
    </main>
  );
}
