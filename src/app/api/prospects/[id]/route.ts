import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id, role').eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  let query = supabase.from('prospects').select('*').eq('id', id).eq('org_id', member.org_id);
  if (member.role === 'affiliate') query = query.eq('affiliate_user_id', user.id);

  const { data, error } = await query.single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data, success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id, role').eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const body = await request.json();
  const updates = { ...body };

  if (member.role === 'affiliate') {
    delete updates.assigned_to;
    delete updates.affiliate_user_id;
    delete updates.affiliate_fixed_amount;
    delete updates.affiliate_payout_status;
    delete updates.status;
    delete updates.expected_revenue;
  }
  
  // Check if status is changing
  if (updates.status) {
    const { data: oldProspect } = await supabase.from('prospects').select('status').eq('id', id).single();
    if (oldProspect && oldProspect.status !== updates.status) {
      await supabase.from('activity_log').insert({
        prospect_id: id,
        created_by: user.id,
        type: 'status_change',
        content: `Status changed from ${oldProspect.status} to ${updates.status}`,
        metadata: { old_status: oldProspect.status, new_status: updates.status }
      });
    }

    if (updates.status === 'won') {
      updates.affiliate_payout_status = 'owed';
    }
  }

  let updateQuery = supabase.from('prospects').update(updates).eq('id', id).eq('org_id', member.org_id);
  if (member.role === 'affiliate') updateQuery = updateQuery.eq('affiliate_user_id', user.id);

  const { data, error } = await updateQuery.select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data, success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id, role').eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });
  if (member.role === 'affiliate') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await supabase.from('prospects').delete().eq('id', id).eq('org_id', member.org_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
