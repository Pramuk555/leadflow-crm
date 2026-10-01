import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase
    .from('team_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const searchParams = request.nextUrl.searchParams;
  let query = supabase.from('prospects').select('*').eq('org_id', member.org_id).order('position');

  if (member.role === 'affiliate') {
    query = query.eq('affiliate_user_id', user.id);
  }

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

  const { data: member } = await supabase
    .from('team_members')
    .select('org_id, role, fixed_affiliate_amount')
    .eq('user_id', user.id)
    .single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const body = await request.json();
  const assignedTo = cleanText(body.assigned_to);
  const affiliateUserId = cleanText(body.affiliate_user_id);
  
  // Get max position for 'new' status
  const { data: maxPos } = await supabase.from('prospects').select('position').eq('org_id', member.org_id).eq('status', 'new').order('position', { ascending: false }).limit(1);
  const nextPosition = maxPos && maxPos.length > 0 ? maxPos[0].position + 1 : 0;

  const { data, error } = await supabase.from('prospects').insert({
    business_name: cleanText(body.business_name),
    platform: cleanText(body.platform) || 'other',
    profile_link: cleanText(body.profile_link),
    address: cleanText(body.address),
    category: cleanText(body.category),
    contact_name: cleanText(body.contact_name),
    contact_phone: cleanText(body.contact_phone),
    contact_email: cleanText(body.contact_email),
    priority: cleanText(body.priority) || 'medium',
    expected_revenue: cleanNumber(body.expected_revenue),
    org_id: member.org_id,
    created_by: user.id,
    affiliate_user_id: member.role === 'affiliate' ? user.id : affiliateUserId || null,
    affiliate_fixed_amount: member.role === 'affiliate' ? Number(member.fixed_affiliate_amount) || 0 : cleanNumber(body.affiliate_fixed_amount),
    affiliate_payout_status: member.role === 'affiliate' ? 'pending_conversion' : affiliateUserId ? 'pending_conversion' : 'not_applicable',
    assigned_to: member.role === 'affiliate' ? null : assignedTo || null,
    status: 'new',
    position: nextPosition,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data, success: true }, { status: 201 });
}
