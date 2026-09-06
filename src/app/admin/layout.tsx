import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") redirect("/");

  const [{ count: pendingStores }, { count: openTickets }, { count: recentErrors }] = await Promise.all([
    supabase.from("stores").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase
      .from("error_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  return (
    <AdminShell badges={{ pendingStores: pendingStores ?? 0, openTickets: openTickets ?? 0, recentErrors: recentErrors ?? 0 }}>
      {children}
    </AdminShell>
  );
}
