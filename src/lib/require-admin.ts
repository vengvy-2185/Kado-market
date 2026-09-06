import type { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database.types";

/**
 * Looks up a user's role. Exists mainly to centralize a `.select("role")`
 * pattern that, at this codebase's scale, TypeScript's inference for the
 * Supabase query builder resolves to `never` on (a known sharp edge with
 * large hand-written Database types) — casting once here instead of at
 * every call site.
 */
export async function getUserRole(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<UserRole | null> {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return (data as unknown as { role: UserRole } | null)?.role ?? null;
}

export function isAdminRole(role: UserRole | null): boolean {
  return role === "admin" || role === "super_admin";
}
