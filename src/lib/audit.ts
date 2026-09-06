import type { createClient } from "@/lib/supabase/server";

export async function logAudit(
  supabase: ReturnType<typeof createClient>,
  action: string,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown> = {}
) {
  try {
    await supabase.rpc("log_audit_event", {
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId,
      p_details: details,
    });
  } catch {
    // best-effort — never let audit logging break the actual action
  }
}
