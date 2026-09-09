'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AiSummaryProps {
  prospectId: string;
  initialSummary?: string | null;
  onSummaryGenerated?: () => void;
}

export function AiSummary({ prospectId, initialSummary, onSummaryGenerated }: AiSummaryProps) {
  const [summary, setSummary] = useState<string | null>(initialSummary || null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_id: prospectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate AI summary');

      setSummary(data.summary);
      toast.success('AI summary generated!');
      if (onSummaryGenerated) onSummaryGenerated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-violet-950/40 via-slate-900 to-blue-950/40 border border-violet-500/20 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <h3 className="font-bold text-slate-100 text-sm">AI Deal Summary</h3>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-3 py-1.5 bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/40 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" /> {summary ? 'Regenerate' : 'Summarize with AI'}
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="space-y-2 py-2">
          <div className="h-4 bg-violet-500/10 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-violet-500/10 rounded animate-pulse w-5/6" />
        </div>
      ) : summary ? (
        <div className="text-sm text-slate-200 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-violet-500/10">
          {summary}
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          Click "Summarize with AI" to analyze all logged calls, notes, and activity for this prospect using Gemini.
        </p>
      )}
    </div>
  );
}
