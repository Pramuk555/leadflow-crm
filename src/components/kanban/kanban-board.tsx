'use client';

import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  PointerSensor, 
  KeyboardSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent 
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { STATUS_ORDER, STATUS_CONFIG, PLATFORM_CONFIG, PRIORITY_CONFIG } from '@/lib/constants';
import { Prospect, FollowUp, TeamMember, ProspectStatus, Platform, PriorityLevel, ProspectWithRelations } from '@/lib/types';
import { cn, calculateTemperature, formatCurrency } from '@/lib/utils';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { AddProspectModal } from './add-prospect-modal';
import { KanbanDragOverlay } from './drag-overlay';
import { Search, Plus, Filter, X } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface KanbanBoardProps {
  initialProspects: Prospect[];
  followUps: FollowUp[];
  team: TeamMember[];
  orgId: string;
  userId: string;
}

export function KanbanBoard({ initialProspects, followUps, team, orgId, userId }: KanbanBoardProps) {
  const router = useRouter();
  const [prospects, setProspects] = useState<ProspectWithRelations[]>(() => {
    return initialProspects.map(p => ({
      ...p,
      follow_ups: followUps.filter(f => f.prospect_id === p.id)
    }));
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'All'>('All');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<string | 'All'>('All');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      if (searchQuery && !p.business_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (platformFilter !== 'All' && p.platform !== platformFilter) return false;
      if (priorityFilter !== 'All' && p.priority !== priorityFilter) return false;
      if (overdueOnly) {
        const hasOverdue = p.follow_ups?.some(f => new Date(f.due_date) < new Date() && !f.is_done);
        if (!hasOverdue) return false;
      }
      if (assigneeFilter !== 'All' && p.assigned_to !== assigneeFilter) return false;
      return true;
    });
  }, [prospects, searchQuery, platformFilter, priorityFilter, overdueOnly, assigneeFilter]);

  const prospectsByStatus = useMemo(() => {
    const grouped = {} as Record<ProspectStatus, ProspectWithRelations[]>;
    STATUS_ORDER.forEach(status => {
      grouped[status] = filteredProspects
        .filter(p => p.status === status)
        .sort((a, b) => a.position - b.position);
    });
    return grouped;
  }, [filteredProspects]);

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeProspect = prospects.find(p => p.id === activeId);
    const overProspect = prospects.find(p => p.id === overId);
    
    if (!activeProspect) return;

    // Check if dropping onto a column
    const overStatus = STATUS_ORDER.includes(overId as ProspectStatus) 
      ? (overId as ProspectStatus)
      : overProspect?.status;

    if (!overStatus) return;

    if (activeProspect.status !== overStatus) {
      setProspects(prev => {
        const activeItems = prev.filter(p => p.status === activeProspect.status);
        const overItems = prev.filter(p => p.status === overStatus);
        
        const activeIndex = activeItems.findIndex(p => p.id === activeId);
        const overIndex = overProspect ? overItems.findIndex(p => p.id === overId) : overItems.length;

        const newProspect = { ...activeProspect, status: overStatus };
        
        const newPrev = prev.filter(p => p.id !== activeId);
        return [...newPrev, newProspect];
      });
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeProspect = prospects.find(p => p.id === activeId);
    const overStatus = STATUS_ORDER.includes(overId as ProspectStatus) 
      ? (overId as ProspectStatus)
      : prospects.find(p => p.id === overId)?.status;

    if (!activeProspect || !overStatus) return;

    const originalStatus = initialProspects.find(p => p.id === activeId)?.status;
    const originalPosition = initialProspects.find(p => p.id === activeId)?.position;

    // Determine new index
    const columnProspects = prospectsByStatus[overStatus] || [];
    let newIndex = columnProspects.length;
    
    if (!STATUS_ORDER.includes(overId as ProspectStatus)) {
        newIndex = columnProspects.findIndex(p => p.id === overId);
        if (newIndex === -1) newIndex = columnProspects.length;
    }

    // Reorder in local state
    setProspects(prev => {
        const activeItems = prev.filter(p => p.status === overStatus);
        const otherItems = prev.filter(p => p.status !== overStatus);
        
        const currentActiveIndex = activeItems.findIndex(p => p.id === activeId);
        
        let newActiveItems = [...activeItems];
        if (currentActiveIndex !== -1) {
            newActiveItems = arrayMove(newActiveItems, currentActiveIndex, newIndex);
        } else {
            const movedItem = prev.find(p => p.id === activeId)!;
            newActiveItems.splice(newIndex, 0, { ...movedItem, status: overStatus });
        }
        
        newActiveItems = newActiveItems.map((p, idx) => ({ ...p, position: idx }));
        return [...otherItems, ...newActiveItems];
    });

    // Update server
    try {
        const response = await fetch(`/api/prospects/${activeId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: overStatus, position: newIndex })
        });
        
        if (!response.ok) throw new Error('Failed to update');
        
        if (originalStatus !== overStatus) {
            await fetch(`/api/prospects/${activeId}/activity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'status_change', details: { from: originalStatus, to: overStatus } })
            });
            toast.success(`Moved to ${STATUS_CONFIG[overStatus].label}`);
        }
        
        router.refresh();
    } catch (error) {
        toast.error('Failed to update prospect');
    }
  };

  const onDragCancel = () => {
    setActiveId(null);
  };

  const activeProspect = activeId ? prospects.find(p => p.id === activeId) || null : null;

  return (
    <div className="flex min-h-dvh flex-col space-y-3 p-3 sm:space-y-4 sm:p-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
        <div className="relative w-full sm:min-w-[220px] sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search leads..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
            <Filter className="hidden w-4 h-4 text-slate-400 sm:block" />
            <select 
                value={platformFilter} 
                onChange={(e) => setPlatformFilter(e.target.value as Platform | 'All')}
                className="min-w-0 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-300 py-2 px-3"
            >
                <option value="All">All Platforms</option>
                {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                ))}
            </select>
            
            <select 
                value={priorityFilter} 
                onChange={(e) => setPriorityFilter(e.target.value as PriorityLevel | 'All')}
                className="min-w-0 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-300 py-2 px-3"
            >
                <option value="All">All Priorities</option>
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                ))}
            </select>
            
            <label className="col-span-2 flex items-center gap-2 text-sm text-slate-300 cursor-pointer sm:col-span-1">
                <input 
                    type="checkbox" 
                    checked={overdueOnly} 
                    onChange={(e) => setOverdueOnly(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-blue-500 focus:ring-blue-500"
                />
                Overdue
            </label>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:ml-auto sm:w-auto sm:py-2"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="-mx-3 flex-1 overflow-x-auto px-3 scrollbar-thin sm:mx-0 sm:px-0">
          <div className="flex h-full min-w-max snap-x snap-mandatory items-start gap-3 pb-4 sm:gap-4">
            {STATUS_ORDER.map(status => {
              const columnProspects = prospectsByStatus[status] || [];
              const totalRevenue = columnProspects.reduce((sum, p) => sum + (Number(p.expected_revenue) || 0), 0);
              const config = STATUS_CONFIG[status];
              
              return (
                <KanbanColumn 
                  key={status}
                  id={status}
                  title={config.label}
                  icon={config.icon}
                  color={config.color}
                  bgColor={config.bgColor}
                  borderColor={config.borderColor}
                  prospects={columnProspects}
                  totalRevenue={totalRevenue}
                  team={team}
                />
              );
            })}
          </div>
        </div>
        
        <DragOverlay>
            <KanbanDragOverlay prospect={activeProspect} />
        </DragOverlay>
      </DndContext>

      <AddProspectModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        orgId={orgId} 
        team={team} 
        onSuccess={(newProspect) => {
            setProspects(prev => [...prev, { ...newProspect, follow_ups: [] }]);
            router.refresh();
        }}
      />
    </div>
  );
}
