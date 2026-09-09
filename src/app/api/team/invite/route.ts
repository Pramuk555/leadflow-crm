import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id, role').eq('user_id', user.id).single();
  if (!member || !['owner', 'admin'].includes(member.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { email, display_name, role = 'member' } = body;
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const adminSupabase = createAdminClient();
  const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email);
  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 });

  if (inviteData?.user?.id) {
    const { error: insertError } = await supabase.from('team_members').insert({
      org_id: member.org_id,
      user_id: inviteData.user.id,
      display_name: display_name || email.split('@')[0],
      role
    });

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
