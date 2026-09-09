'use client';

import { ActivityLogWithAuthor } from '@/lib/types';
import { ACTIVITY_CONFIG } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import { Phone, FileText, ArrowRightLeft, Sparkles, User } from 'lucide-react';

interface ActivityTimelineProps {
  activities: ActivityLogWithAuthor[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
        <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-slate-300 font-semibold mb-1">No Activity Logged</h3>
        <p className="text-slate-500 text-xs">Calls, notes, and status changes will appear here.</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4 text-emerald-400" />;
      case 'note':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'status_change':
        return <ArrowRightLeft className="w-4 h-4 text-violet-400" />;
      case 'ai_summary':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'note':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'status_change':
        return 'bg-violet-500/10 border-violet-500/20';
      case 'ai_summary':
        return 'bg-amber-500/10 border-amber-500/20';
      default:
        return 'bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
      {activities.map((activity) => {
        const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.note;

        return (
          <div key={activity.id} className="relative group animate-fade-in">
            {/* Timeline icon dot */}
            <div className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border flex items-center justify-center bg-slate-900 ${getBgColor(activity.type)}`}>
              {getIcon(activity.type)}
            </div>

            {/* Activity Card */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700 shadow-md">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getBgColor(activity.type)}`}>
                    {config.label}
                  </span>
                  {activity.author && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      {activity.author.display_name}
                    </span>
                  )}
                </div>
                <time className="text-[11px] text-slate-500">
                  {formatDateTime(activity.created_at)}
                </time>
              </div>

              <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {activity.content}
              </div>

              {Boolean(activity.metadata && (activity.metadata.old_status || activity.metadata.new_status)) && (
                <div className="mt-2 text-xs text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
                  <span>
                    Moved from <strong className="text-slate-300">{String(activity.metadata.old_status || '')}</strong> to <strong className="text-blue-400">{String(activity.metadata.new_status || '')}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
