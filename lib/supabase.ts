import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

// Server only: bypasses row level security. Used to create orders after
// they're validated and priced.
export function serviceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role is not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

// Anonymous reads (the public menu), on the server.
export function publicClient(): SupabaseClient {
  if (!url || !anonKey) throw new Error("Supabase is not configured");
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

let browser: SupabaseClient | null = null;

// The admin pages sign in with this client; row level security limits
// what a signed-in user can read and change to accounts listed in `admins`.
export function browserClient(): SupabaseClient {
  if (!url || !anonKey) throw new Error("Supabase is not configured");
  browser ??= createClient(url, anonKey);
  return browser;
}
