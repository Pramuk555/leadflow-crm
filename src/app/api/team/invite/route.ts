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
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const display_name = typeof body.display_name === 'string' ? body.display_name.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const role = ['admin', 'member', 'affiliate'].includes(body.role) ? body.role : 'member';
  const fixed_affiliate_amount = Number(body.fixed_affiliate_amount) || 0;
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
  if (password && password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  if (role === 'affiliate' && fixed_affiliate_amount <= 0) {
    return NextResponse.json({ error: 'Fixed affiliate amount is required' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();
  const { data: userData, error: userError } = password
    ? await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: display_name || email.split('@')[0], role },
      })
    : await adminSupabase.auth.admin.inviteUserByEmail(email);

  if (userError) return NextResponse.json({ error: userError.message }, { status: 400 });

  if (userData?.user?.id) {
    const { error: insertError } = await supabase.from('team_members').upsert({
      org_id: member.org_id,
      user_id: userData.user.id,
      display_name: display_name || email.split('@')[0],
      role,
      fixed_affiliate_amount: role === 'affiliate' ? fixed_affiliate_amount : 0,
    }, {
      onConflict: 'org_id,user_id',
    });

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, created_login: Boolean(password) }, { status: 201 });
}
