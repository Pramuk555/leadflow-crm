'use client';

import { useState, useEffect } from 'react';
import { Key, Users, User, Shield, Check, Eye, EyeOff, Loader2, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'api' | 'team' | 'profile'>('api');
  
  // API Key state
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  // Team state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

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
    if (!inviteEmail) return;

    setInviting(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          display_name: inviteName || inviteEmail.split('@')[0],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invite');

      toast.success(`Invite sent to ${inviteEmail}!`);
      setInviteEmail('');
      setInviteName('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Settings & Team Configuration</h1>
        <p className="text-sm text-slate-400">Manage API keys, team access, and organization preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-8 gap-4">
        <button
          onClick={() => setActiveTab('api')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'api'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-4 h-4" /> AI Key Settings
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
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
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl">
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
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
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
          {/* Invite Form */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <UserPlus className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Invite Team Member</h2>
                <p className="text-xs text-slate-400">Send an invitation email to collaborate on leads.</p>
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
                    placeholder="teammate@agency.com"
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="member" className="bg-slate-900">Member (Full lead tracking access)</option>
                  <option value="admin" className="bg-slate-900">Admin (Manage team & settings)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={inviting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Send Invitation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
