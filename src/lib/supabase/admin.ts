import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdminConfig } from './config';

// Admin client that bypasses RLS. Use for server-side admin operations only.
export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseAdminConfig();

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
