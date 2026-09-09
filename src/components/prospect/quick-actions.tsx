'use client';

import { useState } from 'react';
import { FollowUp } from '@/lib/types';
import { isDueTodayOrOverdue, isOverdue, formatDate } from '@/lib/utils';
import { PhoneCall, FileText, Calendar, CheckCircle2, Clock, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuickActionsProps {
  prospectId: string;
  followUps: FollowUp[];
  onActivityAdded: () => void;
  onFollowUpUpdated: () => void;
}

export function QuickActions({
  prospectId,
  followUps,
  onActivityAdded,
  onFollowUpUpdated,
}: QuickActionsProps) {
  const [activeTab, setActiveTab] = useState<'call' | 'note' | 'followup'>('call');
  const [callContent, setCallContent] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callContent.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/prospects/${prospectId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'call',
          content: callContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log call');

      setCallContent('');
      toast.success('Call log saved');
      onActivityAdded();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/prospects/${prospectId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'note',
          content: noteContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save note');

      setNoteContent('');
      toast.success('Note saved');
      onActivityAdded();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/prospects/${prospectId}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          due_date: dueDate,
          note: followUpNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set follow-up');

      setDueDate('');
      setFollowUpNote('');
      toast.success('Follow-up scheduled');
      onFollowUpUpdated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFollowUp = async (followUp: FollowUp) => {
    try {
      const res = await fetch(`/api/prospects/${prospectId}/follow-ups`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: followUp.id,
          is_done: !followUp.is_done,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update follow-up');

      toast.success(followUp.is_done ? 'Follow-up reopened' : 'Follow-up marked complete');
      onFollowUpUpdated();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const activeFollowUps = followUps.filter((f) => !f.is_done);
  const completedFollowUps = followUps.filter((f) => f.is_done);

  return (
    <div className="space-y-6">
      {/* Quick Action Box */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span>⚡</span> Quick Actions
        </h3>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-800 mb-4">
          <button
            onClick={() => setActiveTab('call')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'call'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" /> Log Call
          </button>
          <button
            onClick={() => setActiveTab('note')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'note'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Add Note
          </button>
          <button
            onClick={() => setActiveTab('followup')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'followup'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Schedule Follow-up
          </button>
        </div>

        {/* Tab Forms */}
        {activeTab === 'call' && (
          <form onSubmit={handleAddCall} className="space-y-3">
            <textarea
              value={callContent}
              onChange={(e) => setCallContent(e.target.value)}
              placeholder="Record call outcome, client responses, pitch details..."
              rows={3}
              required
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PhoneCall className="w-3.5 h-3.5" />}
              Save Call Log
            </button>
          </form>
        )}

        {activeTab === 'note' && (
          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add free-text internal note..."
              rows={3}
              required
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              Save Note
            </button>
          </form>
        )}

        {activeTab === 'followup' && (
          <form onSubmit={handleAddFollowUp} className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Note / Objective (optional)</label>
              <input
                type="text"
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                placeholder="e.g. Call to check proposal feedback"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
              Schedule Follow-up
            </button>
          </form>
        )}
      </div>

      {/* Pending Follow-ups */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Scheduled Follow-ups
          </span>
          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
            {activeFollowUps.length}
          </span>
        </h3>

        {activeFollowUps.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">No pending follow-ups scheduled.</p>
        ) : (
          <div className="space-y-2">
            {activeFollowUps.map((f) => {
              const overdue = isOverdue(f.due_date);

              return (
                <div
                  key={f.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                    overdue
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <button
                    onClick={() => handleToggleFollowUp(f)}
                    className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-semibold ${overdue ? 'text-rose-400' : 'text-slate-200'}`}>
                        Due: {formatDate(f.due_date)} {overdue && '(Overdue)'}
                      </span>
                    </div>
                    {f.note && <p className="text-xs text-slate-400 leading-snug">{f.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed Follow-ups accordion */}
        {completedFollowUps.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 block mb-2">
              Completed ({completedFollowUps.length})
            </span>
            <div className="space-y-1.5 opacity-60">
              {completedFollowUps.map((f) => (
                <div key={f.id} className="flex items-center gap-2 text-xs text-slate-400 line-through">
                  <button onClick={() => handleToggleFollowUp(f)} className="text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <span>{formatDate(f.due_date)} - {f.note || 'Follow-up'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
