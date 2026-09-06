import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id, store_name, logo_url")
    .eq("seller_id", user.id)
    .single();

  let planName: string | null = null;
  if (store) {
    const { data: sub } = await supabase
      .from("store_subscriptions")
      .select("subscription_plans(name)")
      .eq("store_id", store.id)
      .maybeSingle();
    planName = (sub as unknown as { subscription_plans: { name: string } | null })?.subscription_plans?.name ?? null;
  }

  const { count: unreadCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .is("read_at", null)
    .neq("sender_id", user.id);

  let unreadAiQuestions = 0;
  if (store) {
    const { count } = await supabase
      .from("ai_messages")
      .select("*, ai_threads!inner(store_id)", { count: "exact", head: true })
      .eq("role", "user")
      .is("read_at", null)
      .eq("ai_threads.store_id", store.id);
    unreadAiQuestions = count ?? 0;
  }

  return (
    <DashboardShell
      storeName={store?.store_name ?? null}
      planName={planName}
      logoUrl={store?.logo_url ?? null}
      badges={{ nav_messages: unreadCount ?? 0, nav_ai_assistant: unreadAiQuestions }}
    >
      {children}
    </DashboardShell>
  );
}
