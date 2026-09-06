import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, isAdminRole } from "@/lib/require-admin";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function AdminErrorsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const role = await getUserRole(supabase, user.id);
  if (!isAdminRole(role)) redirect("/");

  const { data: errors } = await supabase
    .from("error_logs")
    .select("*, profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        <AlertTriangle className="h-6 w-6 text-danger" />
        <h1 className="text-2xl font-bold">Error Logs</h1>
      </div>

      {!errors || errors.length === 0 ? (
        <Card>
          <p className="text-white/60">No errors reported yet — that&apos;s a good sign.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {errors.map((e) => {
            const reporter = e.profiles as unknown as { full_name: string | null; email: string } | null;
            return (
              <Card key={e.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-danger">{e.message}</p>
                    <p className="text-xs text-white/40">
                      {e.path ?? "unknown path"} · {reporter?.full_name ?? reporter?.email ?? "anonymous"} ·{" "}
                      {new Date(e.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                      e.level === "error" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"
                    )}
                  >
                    {e.level}
                  </span>
                </div>
                {e.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-white/40 hover:text-white/60">Stack trace</summary>
                    <pre className="mt-1 overflow-x-auto rounded-lg bg-black/30 p-2 text-[11px] text-white/50">{e.stack}</pre>
                  </details>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
