import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { OrgSetup } from '@/components/setup/org-setup';
import { cookies } from 'next/headers';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isDemo = cookieStore.get('leadflow_demo')?.value === 'true';

  if (isDemo) {
    return (
      <div className="flex min-h-screen bg-[#050810] text-slate-100">
        <Sidebar user={{ name: 'Alex Rivera (Demo)', email: 'demo@agency.com' }} />
        <main className="flex-1 overflow-y-auto min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Fetch team_member record
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('display_name, org_id')
    .eq('user_id', user.id)
    .single();

  if (!teamMember) {
    return <OrgSetup />;
  }

  return (
    <div className="flex min-h-screen bg-[#050810] text-slate-100">
      <Sidebar user={{ name: teamMember.display_name || 'Team Member', email: user.email || '' }} />
      <main className="flex-1 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
