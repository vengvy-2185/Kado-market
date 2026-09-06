import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

/**
 * Supabase client for use in Client Components ("use client").
 * Reads the public anon key — safe to expose to the browser because
 * every table is protected by Row Level Security policies.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
