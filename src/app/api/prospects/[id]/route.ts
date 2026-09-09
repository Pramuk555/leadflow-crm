import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id').eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const { data, error } = await supabase.from('prospects').select('*').eq('id', id).eq('org_id', member.org_id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data, success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id').eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const body = await request.json();
  
  // Check if status is changing
  if (body.status) {
    const { data: oldProspect } = await supabase.from('prospects').select('status').eq('id', id).single();
    if (oldProspect && oldProspect.status !== body.status) {
      await supabase.from('activity_log').insert({
        prospect_id: id,
        org_id: member.org_id,
        created_by: user.id,
        type: 'status_change',
        content: `Status changed from ${oldProspect.status} to ${body.status}`,
        metadata: { old_status: oldProspect.status, new_status: body.status }
      });
    }
  }

  const { data, error } = await supabase.from('prospects').update(body).eq('id', id).eq('org_id', member.org_id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data, success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id').eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const { error } = await supabase.from('prospects').delete().eq('id', id).eq('org_id', member.org_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
