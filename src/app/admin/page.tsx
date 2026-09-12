import { CheckCircle2, XCircle, Users, Store, Clock, LifeBuoy, CreditCard, Bot, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { AdminBarChart } from "@/components/admin/admin-bar-chart";
import { cn } from "@/lib/utils";

function last30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
  }
  return days;
}

function dayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function AdminPage() {
  const supabase = createClient();

  const [
    { count: userCount },
    { count: storeCount },
    { count: pendingStoreCount },
    { count: openTicketCount },
    { count: activeStoreSubs },
    { count: activeAiSubs },
    { count: activeBoosts },
    { data: recentUsers },
    { data: storeSubsForChart },
    { data: aiSubsForChart },
    { data: boostsForChart },
    { data: platformSettings },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("stores").select("*", { count: "exact", head: true }),
    supabase.from("stores").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("store_subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("ai_subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("boost_campaigns").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("profiles").select("created_at").gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("store_subscriptions")
      .select("created_at, subscription_plans(price_monthly)")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("ai_subscriptions")
      .select("created_at, ai_plans(price)")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("boost_campaigns")
      .select("created_at, boost_plans(price)")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("platform_settings").select("*").eq("id", 1).single(),
  ]);

  // Build 30-day series
  const dayBuckets = last30Days();
  const userGrowth = new Map(dayBuckets.map((d) => [d, 0]));
  for (const u of recentUsers ?? []) {
    const label = dayLabel(u.created_at);
    if (userGrowth.has(label)) userGrowth.set(label, (userGrowth.get(label) ?? 0) + 1);
  }

  const revenueByDay = new Map(dayBuckets.map((d) => [d, 0]));
  for (const s of storeSubsForChart ?? []) {
    const label = dayLabel(s.created_at);
    const price = (s.subscription_plans as unknown as { price_monthly: number } | null)?.price_monthly ?? 0;
    if (revenueByDay.has(label)) revenueByDay.set(label, (revenueByDay.get(label) ?? 0) + price);
  }
  for (const s of aiSubsForChart ?? []) {
    const label = dayLabel(s.created_at);
    const price = (s.ai_plans as unknown as { price: number } | null)?.price ?? 0;
    if (revenueByDay.has(label)) revenueByDay.set(label, (revenueByDay.get(label) ?? 0) + price);
  }
  for (const b of boostsForChart ?? []) {
    const label = dayLabel(b.created_at);
    const price = (b.boost_plans as unknown as { price: number } | null)?.price ?? 0;
    if (revenueByDay.has(label)) revenueByDay.set(label, (revenueByDay.get(label) ?? 0) + price);
  }

  const userGrowthData = Array.from(userGrowth.entries()).map(([label, value]) => ({ label, value }));
  const revenueData = Array.from(revenueByDay.entries()).map(([label, value]) => ({ label, value: Math.round(value * 100) / 100 }));

  const integrations = [
    { name: "Gemini AI (AI Assistant)", ok: Boolean(process.env.GEMINI_API_KEY) },
    { name: "Platform KHQR", ok: Boolean(platformSettings?.bakong_account_id && platformSettings?.bakong_phone) },
    { name: "Site URL configured", ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL) },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold">Admin Dashboard</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Users", value: userCount ?? 0, icon: Users, color: "bg-blue-500/15 text-blue-400" },
          { label: "Total Stores", value: storeCount ?? 0, icon: Store, color: "bg-purple-500/15 text-purple-400" },
          { label: "Pending Review", value: pendingStoreCount ?? 0, icon: Clock, color: "bg-amber-500/15 text-amber-400" },
          { label: "Open Tickets", value: openTicketCount ?? 0, icon: LifeBuoy, color: "bg-pink-500/15 text-pink-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <span className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-xl", stat.color)}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <p className="text-xs text-white/50">{stat.label}</p>
              <p className="text-xl font-bold md:text-2xl">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Active store plans", value: activeStoreSubs ?? 0, icon: CreditCard, color: "bg-emerald-500/15 text-emerald-400" },
          { label: "Active AI plans", value: activeAiSubs ?? 0, icon: Bot, color: "bg-cyan-500/15 text-cyan-400" },
          { label: "Active boosts", value: activeBoosts ?? 0, icon: Zap, color: "bg-orange-500/15 text-orange-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4">
              <span className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-xl", stat.color)}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <p className="text-xs text-white/50">{stat.label}</p>
              <p className="text-xl font-bold md:text-2xl">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-white/70">New users (last 30 days)</h2>
          <AdminBarChart data={userGrowthData} color="#7C3AED" />
        </Card>
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-white/70">Platform revenue by day (last 30 days)</h2>
          <AdminBarChart data={revenueData} color="#22C55E" format="currency" />
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-white/70">Integrations status</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {integrations.map((i) => (
            <div key={i.name} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
              {i.ok ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" /> : <XCircle className="h-4 w-4 flex-shrink-0 text-danger" />}
              <span className={cn(i.ok ? "text-white/80" : "text-white/50")}>{i.name}</span>
            </div>
          ))}
        </div>
      </Card>

      <p className="mt-6 text-sm text-white/40">
        Product moderation, boost pricing overrides, and content reports are good candidates for
        a future pass.
      </p>
    </div>
  );
}
