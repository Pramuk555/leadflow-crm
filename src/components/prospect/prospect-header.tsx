'use client';

import { useState } from 'react';
import { Prospect, TeamMember, ProspectStatus, PriorityLevel, Platform } from '@/lib/types';
import { STATUS_CONFIG, PLATFORM_CONFIG, PRIORITY_CONFIG } from '@/lib/constants';
import { cn, formatDateTime, calculateTemperature, calculateDaysInStage, formatCurrency } from '@/lib/utils';
import { ExternalLink, ArrowLeft, Building2, User, Phone, Mail, DollarSign, Calendar, Edit2, Check, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface ProspectHeaderProps {
  prospect: Prospect;
  team: TeamMember[];
  onUpdate: (updated: Partial<Prospect>) => void;
}

export function ProspectHeader({ prospect, team, onUpdate }: ProspectHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [businessName, setBusinessName] = useState(prospect.business_name);
  const [category, setCategory] = useState(prospect.category || '');
  const [contactName, setContactName] = useState(prospect.contact_name || '');
  const [contactPhone, setContactPhone] = useState(prospect.contact_phone || '');
  const [contactEmail, setContactEmail] = useState(prospect.contact_email || '');
  const [expectedRevenue, setExpectedRevenue] = useState(prospect.expected_revenue?.toString() || '0');
  const [profileLink, setProfileLink] = useState(prospect.profile_link || '');
  const [saving, setSaving] = useState(false);

  const statusConfig = STATUS_CONFIG[prospect.status];
  const platformConfig = PLATFORM_CONFIG[prospect.platform];
  const priorityConfig = PRIORITY_CONFIG[prospect.priority];
  const daysInStage = calculateDaysInStage(prospect.status_changed_at);

  const handleStatusChange = async (newStatus: ProspectStatus) => {
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      onUpdate(data.data);
      toast.success(`Status changed to ${STATUS_CONFIG[newStatus].label}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAssigneeChange = async (assignedTo: string | null) => {
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: assignedTo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reassign');
      onUpdate(data.data);
      toast.success('Assignee updated');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      const payload = {
        business_name: businessName,
        category,
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        expected_revenue: parseFloat(expectedRevenue) || 0,
        profile_link: profileLink,
      };

      const res = await fetch(`/api/prospects/${prospect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save changes');

      onUpdate(data.data);
      setIsEditing(false);
      toast.success('Prospect details updated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
      {/* Back button & top meta */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Kanban Board
        </Link>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Created {formatDateTime(prospect.created_at)}</span>
          <span>•</span>
          <span className="bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
            {daysInStage}d in current stage
          </span>
        </div>
      </div>

      {/* Main header body */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="space-y-2">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="text-2xl font-bold bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white w-full max-w-md focus:outline-none focus:border-blue-500"
                placeholder="Business Name"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-slate-200 focus:outline-none"
                  placeholder="Category (e.g. Café)"
                />
                <input
                  type="url"
                  value={profileLink}
                  onChange={(e) => setProfileLink(e.target.value)}
                  className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-slate-200 flex-1 focus:outline-none"
                  placeholder="Profile URL"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
                    {prospect.business_name}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit prospect info"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', platformConfig.bgColor, platformConfig.color)}>
                    {platformConfig.icon} {platformConfig.label}
                  </span>
                  {prospect.category && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300 border border-slate-700">
                      {prospect.category}
                    </span>
                  )}
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', priorityConfig.bgColor, priorityConfig.color)}>
                    {priorityConfig.icon} {priorityConfig.label} Priority
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls & External Link */}
        <div className="flex flex-wrap items-center gap-3">
          {prospect.profile_link && (
            <a
              href={prospect.profile_link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-500/5"
            >
              Open Profile <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Status Dropdown */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl p-1">
            <span className="text-xs text-slate-400 pl-2">Status:</span>
            <select
              value={prospect.status}
              onChange={(e) => handleStatusChange(e.target.value as ProspectStatus)}
              className="bg-transparent text-sm font-semibold text-slate-100 py-1 pr-2 focus:outline-none cursor-pointer"
            >
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key} className="bg-slate-900 text-slate-200">
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Dropdown */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl p-1">
            <span className="text-xs text-slate-400 pl-2">Owner:</span>
            <select
              value={prospect.assigned_to || ''}
              onChange={(e) => handleAssigneeChange(e.target.value || null)}
              className="bg-transparent text-sm text-slate-100 py-1 pr-2 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-400">Unassigned</option>
              {team.map((m) => (
                <option key={m.user_id} value={m.user_id} className="bg-slate-900 text-slate-200">
                  {m.display_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Editable Contact & Revenue Bar */}
      <div className="mt-4 pt-2">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Contact Phone</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                placeholder="+1 234 567 890"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                placeholder="john@shop.com"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Expected Revenue (₹)</label>
              <input
                type="number"
                value={expectedRevenue}
                onChange={(e) => setExpectedRevenue(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                placeholder="25000"
              />
            </div>
            <div className="md:col-span-4 flex justify-end gap-2 mt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDetails}
                disabled={saving}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
              <User className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="text-slate-400 block">Contact Person</span>
                <span className="font-semibold text-slate-200">{prospect.contact_name || 'Not set'}</span>
              </div>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-slate-400 block">Phone</span>
                <span className="font-semibold text-slate-200">{prospect.contact_phone || 'Not set'}</span>
              </div>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
              <Mail className="w-4 h-4 text-violet-400 shrink-0" />
              <div>
                <span className="text-slate-400 block">Email</span>
                <span className="font-semibold text-slate-200">{prospect.contact_email || 'Not set'}</span>
              </div>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-slate-400 block">Expected Revenue</span>
                <span className="font-semibold text-amber-300">
                  {formatCurrency(prospect.expected_revenue || 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
