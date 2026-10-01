'use client';

import { useState, useEffect } from 'react';
import { Key, Users, Shield, Check, Eye, EyeOff, Loader2, UserPlus, BadgeIndianRupee } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'api' | 'team' | 'profile'>('api');
  
  // API Key state
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  // Team state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'affiliate'>('member');
  const [inviteName, setInviteName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [fixedAffiliateAmount, setFixedAffiliateAmount] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.data?.gemini_api_key) {
        setApiKey(data.data.gemini_api_key);
      }
    } catch {
      // Ignore
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gemini_api_key: apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update API key');

      toast.success('Gemini API key saved securely!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingKey(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !invitePassword) return;

    setInviting(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          display_name: inviteName || inviteEmail.split('@')[0],
          password: invitePassword,
          fixed_affiliate_amount: fixedAffiliateAmount ? Number(fixedAffiliateAmount) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create login');

      toast.success(`Login created for ${inviteEmail}`);
      setInviteEmail('');
      setInviteName('');
      setInvitePassword('');
      setFixedAffiliateAmount('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create login');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">Settings & Team Configuration</h1>
        <p className="text-sm text-slate-400">Manage API keys, team access, and organization preferences.</p>
      </div>

      {/* Tabs */}
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto border-b border-slate-800 px-4 scrollbar-thin md:mx-0 md:mb-8 md:gap-4 md:px-0">
        <button
          onClick={() => setActiveTab('api')}
          className={`shrink-0 pb-3 px-3 sm:px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'api'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-4 h-4" /> AI Key Settings
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`shrink-0 pb-3 px-3 sm:px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'team'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> Team Management
        </button>
      </div>

      {/* API Key Settings Tab */}
      {activeTab === 'api' && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl max-w-2xl sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Key className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Google Gemini API Key</h2>
              <p className="text-xs text-slate-400">Used for automated lead activity summarization.</p>
            </div>
          </div>

          <form onSubmit={handleSaveApiKey} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <Shield className="w-4 h-4" /> Security Note
              </div>
              <p>
                Your API key is stored in your organization's database record and accessed exclusively server-side via Next.js API routes. It is never exposed in browser scripts or client network requests.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingKey}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 sm:w-auto"
            >
              {savingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save API Key
            </button>
          </form>
        </div>
      )}

      {/* Team Management Tab */}
      {activeTab === 'team' && (
        <div className="space-y-6 max-w-2xl">
          {/* Login / Affiliate Form */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <UserPlus className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Create Team Login</h2>
                <p className="text-xs text-slate-400">Create staff or affiliate credentials without Supabase email invites.</p>
              </div>
            </div>

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="person@gmail.com"
                    required
                    className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Alex Smith"
                    className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Dedicated Password</label>
                <input
                  type="text"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'affiliate')}
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="member" className="bg-slate-900">Member (Full lead tracking access)</option>
                  <option value="admin" className="bg-slate-900">Admin (Manage team & settings)</option>
                  <option value="affiliate" className="bg-slate-900">Affiliate (Add prospect details only)</option>
                </select>
              </div>

              {inviteRole === 'affiliate' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fixed Affiliate Amount</label>
                  <div className="relative">
                    <BadgeIndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={fixedAffiliateAmount}
                      onChange={(e) => setFixedAffiliateAmount(e.target.value)}
                      placeholder="e.g. 1000"
                      required
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    This amount becomes owed when one of this affiliate's leads is marked won.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={inviting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 sm:w-auto"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create Login
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
