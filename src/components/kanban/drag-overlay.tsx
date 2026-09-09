'use client';

import { ProspectWithRelations } from '@/lib/types';
import { PLATFORM_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface KanbanDragOverlayProps {
  prospect: ProspectWithRelations | null;
}

export function KanbanDragOverlay({ prospect }: KanbanDragOverlayProps) {
  if (!prospect) return null;

  const platformConfig = PLATFORM_CONFIG[prospect.platform];
  const PlatformIcon = platformConfig.icon;

  return (
    <div className="bg-slate-800 border-blue-500/50 border rounded-xl p-3 shadow-2xl scale-105 rotate-2 opacity-90 w-full cursor-grabbing">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-slate-100 text-sm truncate">{prospect.business_name}</h4>
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
      </div>
    </div>
  );
}
