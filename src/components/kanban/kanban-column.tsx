'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ProspectWithRelations, TeamMember } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { KanbanCard } from './kanban-card';
import { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface KanbanColumnProps {
  id: string;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  prospects: ProspectWithRelations[];
  totalRevenue: number;
  team: TeamMember[];
}

export function KanbanColumn({ id, title, icon, color, bgColor, borderColor, prospects, totalRevenue, team }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const router = useRouter();
  const prospectIds = prospects.map(p => p.id);

  return (
    <div className="flex flex-col w-[280px] min-w-[280px] h-full shrink-0 bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
      <div className={cn("h-1 w-full", bgColor)} />
      
      <div className="p-3 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/80">
        <div className="flex items-center gap-2">
            <span className="text-sm">{icon}</span>
            <h3 className="font-semibold text-sm text-slate-200">{title}</h3>
            <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium">
                {prospects.length}
            </span>
        </div>
        {totalRevenue > 0 && (
            <div className="text-xs font-medium text-emerald-400">
                {formatCurrency(totalRevenue)}
            </div>
        )}
      </div>

      <div 
        ref={setNodeRef} 
        className={cn(
            "flex-1 p-3 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-thin transition-colors duration-200",
            isOver ? "bg-slate-800/30" : ""
        )}
      >
        <SortableContext items={prospectIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3 min-h-[100px]">
                {prospects.map(prospect => (
                    <KanbanCard 
                        key={prospect.id} 
                        prospect={prospect} 
                        team={team} 
                        onClick={() => router.push(`/prospects/${prospect.id}`)}
                    />
                ))}
                {prospects.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center">
                        <span className="text-slate-500 text-sm">No leads</span>
                    </div>
                )}
            </div>
        </SortableContext>
      </div>
    </div>
  );
}
