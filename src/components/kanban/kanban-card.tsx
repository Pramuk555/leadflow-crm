'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProspectWithRelations, TeamMember } from '@/lib/types';
import { PLATFORM_CONFIG, PRIORITY_CONFIG, TEMPERATURE_CONFIG } from '@/lib/constants';
import { cn, formatCurrency, calculateDaysInStage, isStale, isDueTodayOrOverdue, isOverdue, calculateTemperature } from '@/lib/utils';
import { ExternalLink, Clock, DollarSign, AlertCircle } from 'lucide-react';

interface KanbanCardProps {
  prospect: ProspectWithRelations;
  team: TeamMember[];
  onClick: () => void;
}

export function KanbanCard({ prospect, team, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: prospect.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const platformConfig = PLATFORM_CONFIG[prospect.platform];
  const priorityConfig = PRIORITY_CONFIG[prospect.priority];
  
  const assignedMember = team.find(m => m.user_id === prospect.assigned_to);
  const temp = calculateTemperature(prospect);
  const tempConfig = TEMPERATURE_CONFIG[temp];
  
  const daysInStage = calculateDaysInStage(prospect.status_changed_at || prospect.created_at);
  const stale = isStale(prospect.status_changed_at || prospect.created_at);

  const activeFollowUps = prospect.follow_ups?.filter(f => !f.is_done) || [];
  const hasOverdue = activeFollowUps.some(f => isOverdue(f.due_date));
  const hasDueToday = activeFollowUps.some(f => isDueTodayOrOverdue(f.due_date)) && !hasOverdue;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-slate-600 hover:shadow-lg hover:-translate-y-0.5 transition-all group relative",
        isDragging && "opacity-40 scale-[1.02] shadow-2xl z-50 border-blue-500/50"
      )}
    >
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 overflow-hidden">
                <div className={cn("w-2 h-2 rounded-full shrink-0", tempConfig.color)} title={`Temperature: ${tempConfig.label}`} />
                <h4 className="font-bold text-slate-100 text-sm truncate">{prospect.business_name}</h4>
            </div>
            {prospect.profile_link && (
                <a 
                    href={prospect.profile_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-slate-400 hover:text-blue-400 transition-colors p-1"
                >
                    <ExternalLink className="w-3 h-3" />
                </a>
            )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className={cn("flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded", platformConfig.bgColor, platformConfig.color)}>
                <span>{platformConfig.icon}</span>
                <span>{platformConfig.label}</span>
            </div>
            {prospect.category && (
                <div className="text-[10px] bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600/50">
                    {prospect.category}
                </div>
            )}
            <div className={cn("text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-700", priorityConfig.bgColor, priorityConfig.color)}>
                {priorityConfig.label}
            </div>
        </div>

        <div className="flex items-end justify-between mt-auto pt-2 border-t border-slate-700/50">
            <div className="flex flex-col gap-1">
                {Number(prospect.expected_revenue) > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                        <DollarSign className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-300 font-medium">{formatCurrency(Number(prospect.expected_revenue))}</span>
                    </div>
                )}
                {stale && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-500/80">
                        <Clock className="w-3 h-3" />
                        <span>{daysInStage}d in stage</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                {hasOverdue && (
                    <div className="w-4 h-4 rounded-full bg-rose-500/20 flex items-center justify-center animate-pulse" title="Overdue Follow-up">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                    </div>
                )}
                {hasDueToday && (
                    <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center" title="Follow-up Due Today">
                        <Clock className="w-3 h-3 text-amber-500" />
                    </div>
                )}
                {assignedMember && (
                    <div 
                        className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white border border-slate-600 shadow-sm"
                        title={`Assigned to ${assignedMember.display_name}`}
                    >
                        {(assignedMember.display_name || '?').charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
