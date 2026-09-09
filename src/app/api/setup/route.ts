import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existingMember } = await supabase.from('team_members').select('org_id').eq('user_id', user.id).single();
  if (existingMember) return NextResponse.json({ error: 'User already belongs to an organization' }, { status: 400 });

  const body = await request.json();
  const { org_name, display_name } = body;
  if (!org_name || !display_name) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  const { data: org, error: orgError } = await supabase.from('organizations').insert({ name: org_name }).select().single();
  if (orgError) return NextResponse.json({ error: orgError.message }, { status: 400 });

  const { data: member, error: memberError } = await supabase.from('team_members').insert({
    org_id: org.id,
    user_id: user.id,
    display_name,
    role: 'owner'
  }).select().single();

  if (memberError) {
    // Rollback org creation if possible
    await supabase.from('organizations').delete().eq('id', org.id);
    return NextResponse.json({ error: memberError.message }, { status: 400 });
  }

  return NextResponse.json({ data: { org, member }, success: true }, { status: 201 });
}
