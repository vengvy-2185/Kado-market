"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function loginWithRateLimit(email: string, password: string): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count: recentFailures } = await admin
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("email", email.toLowerCase().trim())
    .eq("success", false)
    .gte("created_at", windowStart);

  if ((recentFailures ?? 0) >= MAX_FAILED_ATTEMPTS) {
    return { error: `Too many failed attempts. Please try again in ${WINDOW_MINUTES} minutes.` };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // best-effort logging — never let a logging failure block the actual login
  try {
    await admin.from("login_attempts").insert({ email: email.toLowerCase().trim(), success: !error });
  } catch {
    // ignore — logging is best-effort
  }

  if (error) return { error: error.message };
  return { error: null };
}
