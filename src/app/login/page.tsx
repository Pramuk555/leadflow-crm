'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, Sparkles, UserPlus } from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const changeMode = (next: Mode) => {
    setMode(next);
    setError('');
    setSuccess('');
  };

  const submitCredentials = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (mode === 'signup' && password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        document.cookie = 'leadflow_demo=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.replace('/dashboard');
        router.refresh();
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
      });
      if (error) throw error;
      if (data.session) {
        router.replace('/dashboard');
        router.refresh();
      } else {
        setSuccess('Account created. Check your email to confirm your address, then sign in.');
        setMode('login');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setSuccess('If an account exists for that email, a password-reset link is on its way.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send the reset link.');
    } finally {
      setLoading(false);
    }
  };

  const isCredentialsMode = mode !== 'forgot';
  const title = mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset your password';

  return (
    <main className="min-h-screen bg-[#050810] px-4 py-10 flex items-center justify-center relative overflow-hidden">
      <div className="absolute -top-36 -left-24 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="absolute -bottom-36 -right-24 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl" />
      <section className="relative w-full max-w-md rounded-3xl border border-slate-700/70 bg-slate-900/85 p-7 sm:p-8 shadow-2xl backdrop-blur-xl">
        <header className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
            {mode === 'signup' ? <UserPlus className="h-6 w-6 text-violet-300" /> : mode === 'forgot' ? <KeyRound className="h-6 w-6 text-violet-300" /> : <Sparkles className="h-6 w-6 text-blue-300" />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{mode === 'login' ? 'Sign in to your LeadFlow workspace.' : mode === 'signup' ? 'Set up your LeadFlow workspace in minutes.' : 'We’ll email you a secure reset link.'}</p>
        </header>

        {error && <p role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
        {success && <p className="mb-4 flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />{success}</p>}

        <form onSubmit={isCredentialsMode ? submitCredentials : submitReset} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-200">Email address</label>
            <div className="relative"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          {isCredentialsMode && <div>
            <div className="mb-1.5 flex items-center justify-between"><label htmlFor="password" className="text-sm font-medium text-slate-200">Password</label>{mode === 'login' && <button type="button" onClick={() => changeMode('forgot')} className="text-xs font-semibold text-blue-300 hover:text-blue-200">Forgot password?</button>}</div>
            <div className="relative"><Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input id="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required minLength={mode === 'signup' ? 8 : undefined} className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3 pl-10 pr-11 text-sm text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>}
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-400">
          {mode === 'forgot' ? <button onClick={() => changeMode('login')} className="inline-flex items-center gap-1 font-semibold text-blue-300 hover:text-blue-200"><ArrowLeft className="h-4 w-4" />Back to sign in</button> : <>{mode === 'login' ? 'New to LeadFlow?' : 'Already have an account?'} <button onClick={() => changeMode(mode === 'login' ? 'signup' : 'login')} className="font-semibold text-blue-300 hover:text-blue-200">{mode === 'login' ? 'Create an account' : 'Sign in'}</button></>}
        </div>
      </section>
    </main>
  );
}
