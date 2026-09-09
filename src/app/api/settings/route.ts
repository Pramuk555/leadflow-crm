import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id').eq('user_id', user.id).single();
  if (!member) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const { data: org, error } = await supabase.from('organizations').select('id, name, created_at, gemini_api_key').eq('id', member.org_id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const maskedKey = org.gemini_api_key ? `***${org.gemini_api_key.slice(-4)}` : null;

  return NextResponse.json({ data: { ...org, gemini_api_key: maskedKey }, success: true });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: member } = await supabase.from('team_members').select('org_id, role').eq('user_id', user.id).single();
  if (!member || !['owner', 'admin'].includes(member.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { gemini_api_key, name } = body;
  
  const updates: any = {};
  if (gemini_api_key !== undefined) updates.gemini_api_key = gemini_api_key;
  if (name !== undefined) updates.name = name;

  const { data, error } = await supabase.from('organizations').update(updates).eq('id', member.org_id).select('id, name').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  return NextResponse.json({ data, success: true });
}
