import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { UserStatusSelect } from "@/components/admin/user-status-select";
import { cn } from "@/lib/utils";

export default async function AdminUsersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (myProfile?.role !== "admin" && myProfile?.role !== "super_admin") redirect("/");

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, username, role, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        <Users className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Users</h1>
      </div>

      <div className="space-y-2">
        {(users ?? []).map((u) => (
          <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{u.full_name ?? u.email}</p>
              <p className="text-xs text-white/40">
                @{u.username ?? "—"} · {u.email} · joined {new Date(u.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize",
                  u.role === "customer" && "bg-white/10 text-white/60",
                  u.role === "seller" && "bg-accent/15 text-accent",
                  (u.role === "admin" || u.role === "super_admin") && "bg-highlight/15 text-highlight"
                )}
              >
                {u.role.replace("_", " ")}
              </span>
              <UserStatusSelect userId={u.id} currentStatus={u.status} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
