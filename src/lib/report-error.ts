import { createClient } from "@/lib/supabase/client";

export function reportClientError(error: Error, path?: string) {
  try {
    const supabase = createClient();
    supabase.rpc("log_client_error", {
      p_message: error.message,
      p_stack: error.stack ?? null,
      p_path: path ?? (typeof window !== "undefined" ? window.location.pathname : null),
      p_level: "error",
    });
  } catch {
    // if we can't even report the error, there's nothing more to do
  }
}
