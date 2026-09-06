import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, isAdminRole } from "@/lib/require-admin";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const role = await getUserRole(supabase, user.id);
  if (!isAdminRole(role)) redirect("/");
  return supabase;
}

export default async function AdminSubscriptionsPage() {
  const supabase = await requireAdmin();

  const [{ data: storeSubs }, { data: aiSubs }, { data: boosts }] = await Promise.all([
    supabase
      .from("store_subscriptions")
      .select("id, status, billing_cycle, current_period_end, created_at, stores(store_name), subscription_plans(name, price_monthly)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("ai_subscriptions")
      .select("id, status, expires_at, created_at, stores(store_name), ai_plans(name, price)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("boost_campaigns")
      .select("id, status, target_type, expires_at, created_at, stores(store_name), boost_plans(duration_days, price)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const storeRevenue = (storeSubs ?? []).reduce((sum, s) => {
    const plan = s.subscription_plans as unknown as { price_monthly: number } | null;
    return sum + (plan?.price_monthly ?? 0);
  }, 0);
  const aiRevenue = (aiSubs ?? []).reduce((sum, s) => {
    const plan = s.ai_plans as unknown as { price: number } | null;
    return sum + (plan?.price ?? 0);
  }, 0);
  const boostRevenue = (boosts ?? []).reduce((sum, b) => {
    const plan = b.boost_plans as unknown as { price: number } | null;
    return sum + (plan?.price ?? 0);
  }, 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Subscriptions</h1>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-white/50">Store plan revenue</p>
          <p className="text-xl font-bold text-success">${storeRevenue.toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-xs text-white/50">AI Assistant revenue</p>
          <p className="text-xl font-bold text-success">${aiRevenue.toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-xs text-white/50">Boost revenue</p>
          <p className="text-xl font-bold text-success">${boostRevenue.toFixed(2)}</p>
        </Card>
      </div>
      <p className="mb-6 text-xs text-white/30">
        Revenue figures reflect each purchase's plan price at the time of query (demo payment
        mode — no real payment provider is connected yet).
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-white/70">Store subscriptions</h2>
          <div className="space-y-2">
            {(storeSubs ?? []).length === 0 && <p className="text-sm text-white/40">None yet.</p>}
            {(storeSubs ?? []).map((s) => {
              const store = s.stores as unknown as { store_name: string } | null;
              const plan = s.subscription_plans as unknown as { name: string; price_monthly: number } | null;
              return (
                <Card key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{store?.store_name ?? "—"}</p>
                    <p className="text-xs text-white/40">
                      {plan?.name} · ${plan?.price_monthly}/mo · {s.billing_cycle}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", s.status === "active" ? "bg-success/15 text-success" : "bg-white/10 text-white/40")}>
                      {s.status}
                    </span>
                    <p className="mt-1 text-[10px] text-white/30">until {new Date(s.current_period_end ?? "").toLocaleDateString()}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-white/70">AI Assistant subscriptions</h2>
          <div className="space-y-2">
            {(aiSubs ?? []).length === 0 && <p className="text-sm text-white/40">None yet.</p>}
            {(aiSubs ?? []).map((s) => {
              const store = s.stores as unknown as { store_name: string } | null;
              const plan = s.ai_plans as unknown as { name: string; price: number } | null;
              return (
                <Card key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{store?.store_name ?? "—"}</p>
                    <p className="text-xs text-white/40">
                      {plan?.name} · ${plan?.price}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", s.status === "active" ? "bg-success/15 text-success" : "bg-white/10 text-white/40")}>
                      {s.status}
                    </span>
                    <p className="mt-1 text-[10px] text-white/30">until {new Date(s.expires_at).toLocaleDateString()}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-white/70">Boost campaigns</h2>
          <div className="space-y-2">
            {(boosts ?? []).length === 0 && <p className="text-sm text-white/40">None yet.</p>}
            {(boosts ?? []).map((b) => {
              const store = b.stores as unknown as { store_name: string } | null;
              const plan = b.boost_plans as unknown as { duration_days: number; price: number } | null;
              return (
                <Card key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{store?.store_name ?? "—"}</p>
                    <p className="text-xs capitalize text-white/40">
                      {b.target_type} · {plan?.duration_days}d · ${plan?.price}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", b.status === "active" ? "bg-success/15 text-success" : "bg-white/10 text-white/40")}>
                    {b.status}
                  </span>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
