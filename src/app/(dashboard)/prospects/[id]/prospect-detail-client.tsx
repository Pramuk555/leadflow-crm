'use client';

import { useState } from 'react';
import { Prospect, ActivityLogWithAuthor, FollowUp, TeamMember } from '@/lib/types';
import { ProspectHeader } from '@/components/prospect/prospect-header';
import { ActivityTimeline } from '@/components/prospect/activity-timeline';
import { AiSummary } from '@/components/prospect/ai-summary';
import { QuickActions } from '@/components/prospect/quick-actions';
import { useRouter } from 'next/navigation';

interface ClientWrapperProps {
  initialProspect: Prospect;
  initialActivities: ActivityLogWithAuthor[];
  initialFollowUps: FollowUp[];
  team: TeamMember[];
  initialSummary: string | null;
}

export function ProspectDetailClientWrapper({
  initialProspect,
  initialActivities,
  initialFollowUps,
  team,
  initialSummary,
}: ClientWrapperProps) {
  const [prospect, setProspect] = useState<Prospect>(initialProspect);
  const [activities, setActivities] = useState<ActivityLogWithAuthor[]>(initialActivities);
  const [followUps, setFollowUps] = useState<FollowUp[]>(initialFollowUps);
  const router = useRouter();

  const handleUpdateProspect = (updated: Partial<Prospect>) => {
    setProspect((prev) => ({ ...prev, ...updated }));
    refreshData();
  };

  const refreshData = async () => {
    router.refresh();
    try {
      const [actRes, folRes] = await Promise.all([
        fetch(`/api/prospects/${prospect.id}/activity`),
        fetch(`/api/prospects/${prospect.id}/follow-ups`),
      ]);
      const actData = await actRes.json();
      const folData = await folRes.json();

      if (actData.data) setActivities(actData.data);
      if (folData.data) setFollowUps(folData.data);
    } catch {
      // Ignore background refresh errors
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in">
      <ProspectHeader prospect={prospect} team={team} onUpdate={handleUpdateProspect} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: AI Summary + Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <AiSummary
            prospectId={prospect.id}
            initialSummary={initialSummary}
            onSummaryGenerated={refreshData}
          />

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 mb-6 flex items-center justify-between">
              <span>Activity History & Timeline</span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700">
                {activities.length} entries
              </span>
            </h3>
            <ActivityTimeline activities={activities} />
          </div>
        </div>

        {/* Right Column: Quick Actions & Follow-ups */}
        <div className="lg:col-span-1">
          <QuickActions
            prospectId={prospect.id}
            followUps={followUps}
            onActivityAdded={refreshData}
            onFollowUpUpdated={refreshData}
          />
        </div>
      </div>
    </div>
  );
}
