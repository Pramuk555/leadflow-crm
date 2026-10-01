'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot';

function getInitialCallbackError() {
  if (typeof window === 'undefined') return '';

  const params = new URLSearchParams(window.location.search);
  const callbackError = params.get('error');
  return callbackError ? friendlyAuthError(callbackError.replace(/\+/g, ' ')) : '';
}

function friendlyAuthError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Could not reach Supabase. Check your internet connection and Supabase project settings.';
  }

  if (lower.includes('invalid login credentials')) {
    return 'Email or password is incorrect.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.';
  }

  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'This email already has an account. Sign in instead.';
  }

  return message || 'Authentication failed. Please try again.';
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(getInitialCallbackError);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackError = params.get('error');

    if (callbackError) {
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const changeMode = (next: Mode) => {
    setMode(next);
    setError('');
    setSuccess('');
    setPassword('');
  };

  const submitCredentials = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Enter your email address.');
      return;
    }

    if (mode === 'signup' && password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;
        document.cookie = 'leadflow_demo=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.replace('/dashboard');
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) throw error;

      if (data.session) {
        router.replace('/dashboard');
        router.refresh();
      } else {
        setSuccess('Account created. Check your email to confirm it, then sign in.');
        setMode('login');
        setPassword('');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setError(friendlyAuthError(message));
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      setSuccess('If an account exists for that email, a reset link is on its way.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setError(friendlyAuthError(message || 'Could not send the reset link.'));
    } finally {
      setLoading(false);
    }
  };

  const isCredentialsMode = mode !== 'forgot';
  const title =
    mode === 'login'
      ? 'Sign in to LeadFlow'
      : mode === 'signup'
        ? 'Create your workspace'
        : 'Reset your password';
  const subtitle =
    mode === 'login'
      ? 'Access your lead-tracking CRM workspace.'
      : mode === 'signup'
        ? 'Start with a secure account, then set up your organization.'
        : 'We will email you a secure reset link.';

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050810] px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
      <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="absolute -right-20 bottom-16 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      <section className="relative w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/90 p-6 shadow-2xl shadow-blue-950/30 backdrop-blur-xl sm:p-8">
        <header className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-blue-400/25 bg-blue-500/10">
            {mode === 'signup' ? (
              <UserPlus className="h-6 w-6 text-cyan-300" />
            ) : mode === 'forgot' ? (
              <KeyRound className="h-6 w-6 text-cyan-300" />
            ) : (
              <Sparkles className="h-6 w-6 text-blue-300" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        </header>

        {mode !== 'forgot' && (
          <div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-700 bg-slate-950/60 p-1">
            <button
              type="button"
              onClick={() => changeMode('login')}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                mode === 'login' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => changeMode('signup')}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                mode === 'signup' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign up
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </p>
        )}
        {success && (
          <p className="mb-4 flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {success}
          </p>
        )}

        <form onSubmit={isCredentialsMode ? submitCredentials : submitReset} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-200">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {isCredentialsMode && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-slate-200">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => changeMode('forgot')}
                    className="text-xs font-semibold text-blue-300 hover:text-blue-200"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={mode === 'signup' ? 8 : undefined}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3 pl-10 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-2 text-center text-sm text-slate-400">
          {mode === 'forgot' ? (
            <button onClick={() => changeMode('login')} className="inline-flex items-center gap-1 font-semibold text-blue-300 hover:text-blue-200">
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </button>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              Protected by Supabase Auth
            </>
          )}
        </div>
      </section>
    </main>
  );
}
