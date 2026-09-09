import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ProspectDetailClientWrapper } from './prospect-detail-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProspectDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch prospect
  const { data: prospect } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', id)
    .single();

  if (!prospect) {
    notFound();
  }

  // Fetch team members
  const { data: team } = await supabase
    .from('team_members')
    .select('*')
    .eq('org_id', prospect.org_id);

  // Fetch activities
  const { data: rawActivities } = await supabase
    .from('activity_log')
    .select('*')
    .eq('prospect_id', id)
    .order('created_at', { ascending: false });

  const teamList = team || [];
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

  const latestAiSummary = activities.find((a) => a.type === 'ai_summary')?.content || null;

  return (
    <ProspectDetailClientWrapper
      initialProspect={prospect}
      initialActivities={activities}
      initialFollowUps={followUps || []}
      team={teamList}
      initialSummary={latestAiSummary}
    />
  );
}
