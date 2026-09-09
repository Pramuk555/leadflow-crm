import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ProspectDetailClientWrapper } from './prospect-detail-client';
import { cookies } from 'next/headers';
import { MOCK_PROSPECTS, MOCK_ACTIVITIES, MOCK_FOLLOW_UPS, MOCK_TEAM } from '@/lib/mock-data';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProspectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('leadflow_demo')?.value === 'true';

  if (isDemo) {
    const mockProspect = MOCK_PROSPECTS.find((p) => p.id === id) || MOCK_PROSPECTS[0];
    const mockActivities = MOCK_ACTIVITIES[mockProspect.id] || MOCK_ACTIVITIES['p-1'] || [];
    const mockFollows = MOCK_FOLLOW_UPS.filter((f) => f.prospect_id === mockProspect.id);

    return (
      <ProspectDetailClientWrapper
        initialProspect={mockProspect}
        initialActivities={mockActivities}
        initialFollowUps={mockFollows}
        team={MOCK_TEAM}
        initialSummary="Prospect is highly interested in migrating manual IG order taking to a automated Shopify storefront. Next action: deliver catalog mockup & pricing tiers."
      />
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch prospect
  const { data: prospect } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', id)
    .single();

  const targetProspect = prospect || MOCK_PROSPECTS.find((p) => p.id === id) || MOCK_PROSPECTS[0];

  // Fetch team members
  const { data: team } = await supabase
    .from('team_members')
    .select('*')
    .eq('org_id', targetProspect.org_id);

  // Fetch activities
  const { data: rawActivities } = await supabase
    .from('activity_log')
    .select('*')
    .eq('prospect_id', id)
    .order('created_at', { ascending: false });

  const teamList = (team && team.length > 0) ? team : MOCK_TEAM;
  const teamMap = new Map(teamList.map((t) => [t.user_id, t]));
  const activities = (rawActivities || []).map((a) => ({
    ...a,
    author: a.created_by ? teamMap.get(a.created_by) || null : null,
  }));

  // Fetch follow-ups
  const { data: followUps } = await supabase
    .from('follow_ups')
    .select('*')
    .eq('prospect_id', id)
    .order('due_date', { ascending: true });

  const latestAiSummary = (activities || []).find((a) => a.type === 'ai_summary')?.content || null;

  return (
    <ProspectDetailClientWrapper
      initialProspect={targetProspect}
      initialActivities={activities.length > 0 ? activities : (MOCK_ACTIVITIES[targetProspect.id] || [])}
      initialFollowUps={followUps || MOCK_FOLLOW_UPS.filter((f) => f.prospect_id === targetProspect.id)}
      team={teamList}
      initialSummary={latestAiSummary}
    />
  );
}
