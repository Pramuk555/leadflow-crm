import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id').eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  // Make sure prospect belongs to org
  const { data: prospect } = await supabase.from('prospects').select('id').eq('id', id).eq('org_id', member.org_id).single();
  if (!prospect) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await supabase.from('activity_log')
    .select(`
      *,
      author:team_members(display_name)
    `)
    .eq('prospect_id', id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data, success: true });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id').eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const { data: prospect } = await supabase.from('prospects').select('id').eq('id', id).eq('org_id', member.org_id).single();
  if (!prospect) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const { data, error } = await supabase.from('activity_log').insert({
    prospect_id: id,
    org_id: member.org_id,
    created_by: user.id,
    type: body.type,
    content: body.content,
    metadata: body.metadata || {}
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data, success: true }, { status: 201 });
}
