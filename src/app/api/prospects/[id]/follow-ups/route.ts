import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id').eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const { data: prospect } = await supabase.from('prospects').select('id').eq('id', id).eq('org_id', member.org_id).single();
  if (!prospect) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await supabase.from('follow_ups').select('*').eq('prospect_id', id).order('due_date', { ascending: true });
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
  const { data, error } = await supabase.from('follow_ups').insert({
    prospect_id: id,
    org_id: member.org_id,
    created_by: user.id,
    due_date: body.due_date,
    note: body.note,
    is_done: false
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data, success: true }, { status: 201 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id').eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const { data: prospect } = await supabase.from('prospects').select('id').eq('id', id).eq('org_id', member.org_id).single();
  if (!prospect) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const { id: followUpId, ...updates } = body;
  
  if (!followUpId) return NextResponse.json({ error: 'Follow-up ID required' }, { status: 400 });

  const { data, error } = await supabase.from('follow_ups').update(updates).eq('id', followUpId).eq('prospect_id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data, success: true });
}
