import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { cookies } from 'next/headers';
import { MOCK_PROSPECTS, MOCK_FOLLOW_UPS, MOCK_TEAM } from '@/lib/mock-data';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('leadflow_demo')?.value === 'true';

  if (isDemo) {
    return (
      <KanbanBoard
        initialProspects={MOCK_PROSPECTS}
        followUps={MOCK_FOLLOW_UPS}
        team={MOCK_TEAM}
        orgId="org-demo"
        userId="user-demo-1"
      />
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get user's org
  const { data: member } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!member) return null; // Layout handles setup

  // Fetch prospects
  const { data: prospects } = await supabase
    .from('prospects')
    .select('*')
    .eq('org_id', member.org_id)
    .order('position', { ascending: true });

  const prospectList = (prospects && prospects.length > 0) ? prospects : MOCK_PROSPECTS;

  // Fetch follow-ups for all prospects
  const prospectIds = prospectList.map(p => p.id);
  const { data: followUps } = await supabase
    .from('follow_ups')
    .select('*')
    .in('prospect_id', prospectIds.length > 0 ? prospectIds : ['none'])
    .eq('is_done', false);

  // Fetch team members
  const { data: team } = await supabase
    .from('team_members')
    .select('*')
    .eq('org_id', member.org_id);

  return (
    <KanbanBoard
      initialProspects={prospectList}
      followUps={followUps && followUps.length > 0 ? followUps : MOCK_FOLLOW_UPS}
      team={(team && team.length > 0) ? team : MOCK_TEAM}
      orgId={member.org_id}
      userId={user.id}
    />
  );
}
