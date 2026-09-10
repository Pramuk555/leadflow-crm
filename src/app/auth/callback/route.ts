import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedNext = searchParams.get('next') ?? '/dashboard';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//')
    ? requestedNext
    : '/dashboard';

  if (!code) return NextResponse.redirect(`${origin}/login?error=Could+not+authenticate`);

  const response = NextResponse.redirect(`${origin}${next}`);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers.get('cookie')?.split(';').map((cookie) => {
            const [name, ...value] = cookie.trim().split('=');
            return { name, value: value.join('=') };
          }) ?? [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return error ? NextResponse.redirect(`${origin}/login?error=Could+not+authenticate`) : response;
}
