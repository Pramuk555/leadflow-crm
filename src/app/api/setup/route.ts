import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existingMember, error: existingMemberError } = await supabase
    .from('team_members')
    .select('org_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMemberError) {
    return NextResponse.json({ error: existingMemberError.message }, { status: 400 });
  }

  if (existingMember) return NextResponse.json({ error: 'User already belongs to an organization' }, { status: 400 });

  const body = await request.json();
  const org_name = typeof body.org_name === 'string' ? body.org_name.trim() : '';
  const display_name = typeof body.display_name === 'string' ? body.display_name.trim() : '';
  if (!org_name || !display_name) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  const { data, error } = await supabase.rpc('setup_user_workspace', {
    p_org_name: org_name,
    p_display_name: display_name,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data, success: true }, { status: 201 });
}
