import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

function friendlyCreateUserError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes('already') || lower.includes('registered') || lower.includes('duplicate')) {
    return 'This email already has an account. Sign in instead.';
  }

  if (lower.includes('password')) {
    return 'Use a stronger password with at least 8 characters.';
  }

  return message || 'Could not create the account. Please try again.';
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Use a password with at least 8 characters.' }, { status: 400 });
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: friendlyCreateUserError(error.message) }, { status: 400 });
    }

    return NextResponse.json({ user_id: data.user?.id, success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    return NextResponse.json({ error: friendlyCreateUserError(message) }, { status: 500 });
  }
}
