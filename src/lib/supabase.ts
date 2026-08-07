import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client.
 *
 * Uses the secret (service_role) key, which bypasses RLS. The funnel_* tables
 * have RLS on with no policies, so this key is the only way in: the project's
 * publishable key, which ships in another app's browser bundle, cannot read or
 * write them.
 *
 * `server-only` makes the build fail rather than let this reach the client.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local (see .env.example).",
    );
  }

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
