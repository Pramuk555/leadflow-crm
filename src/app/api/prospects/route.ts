import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id').eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const searchParams = request.nextUrl.searchParams;
  let query = supabase.from('prospects').select('*').eq('org_id', member.org_id).order('position');

  const status = searchParams.get('status');
  if (status) query = query.eq('status', status);
  const platform = searchParams.get('platform');
  if (platform) query = query.eq('platform', platform);
  const assigned = searchParams.get('assigned_to');
  if (assigned) query = query.eq('assigned_to', assigned);
  const search = searchParams.get('search');
  if (search) query = query.ilike('business_name', `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data, success: true });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id').eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const body = await request.json();
  
  // Get max position for 'new' status
  const { data: maxPos } = await supabase.from('prospects').select('position').eq('org_id', member.org_id).eq('status', 'new').order('position', { ascending: false }).limit(1);
  const nextPosition = maxPos && maxPos.length > 0 ? maxPos[0].position + 1 : 0;

  const { data, error } = await supabase.from('prospects').insert({
    ...body,
    org_id: member.org_id,
    status: 'new',
    position: nextPosition,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data, success: true }, { status: 201 });
}
