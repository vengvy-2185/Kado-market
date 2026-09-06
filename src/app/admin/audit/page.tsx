import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function AdminAuditPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") redirect("/");

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*, profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        <ScrollText className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Audit Log</h1>
      </div>

      {!logs || logs.length === 0 ? (
        <Card>
          <p className="text-white/60">No admin actions logged yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => {
            const actor = l.profiles as unknown as { full_name: string | null; email: string } | null;
            return (
              <Card key={l.id} className="py-3">
                <p className="text-sm">
                  <span className="font-semibold">{actor?.full_name ?? actor?.email ?? "System"}</span>{" "}
                  <span className="text-white/60">{l.action.replace(/_/g, " ").replace(".", " → ")}</span>
                </p>
                <p className="mt-0.5 text-xs text-white/40">
                  {l.target_type} · {new Date(l.created_at).toLocaleString()}
                  {Object.keys(l.details ?? {}).length > 0 && ` · ${JSON.stringify(l.details)}`}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
