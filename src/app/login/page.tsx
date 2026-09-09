'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, Sparkles, Play, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message + ' (Tip: Click "Explore Demo Mode" below to preview without Supabase setup!)');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError('Could not connect to Supabase backend. Click "Explore Demo Mode" below to preview the frontend!');
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    document.cookie = 'leadflow_demo=true; path=/; max-age=86400';
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050810] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          {/* Branding */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 mb-4 border border-blue-500/20">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              LeadFlow CRM
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Lead tracking for web dev agencies</p>
          </div>

          {/* Quick Demo Preview Option */}
          <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-violet-950/60 p-4 rounded-xl border border-blue-500/30 text-center space-y-2">
            <span className="text-xs font-semibold text-blue-300 block">✨ Want to preview the app right now?</span>
            <button
              type="button"
              onClick={handleDemoMode}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Explore Demo Preview Mode <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 text-slate-500 text-xs px-3 absolute">OR SIGN IN WITH SUPABASE</span>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agency.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-xs text-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Sign In with Supabase Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
