import { CreditCard, CheckCircle2 } from "lucide-react";
import { getMyStoreOrRedirect } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { ChangePlanButton } from "@/components/subscription/change-plan-button";
import { PlatformKhqrToggle } from "@/components/platform-khqr-toggle";
import { cn } from "@/lib/utils";

export default async function SubscriptionPage() {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { data: currentSub } = await supabase
    .from("store_subscriptions")
    .select("*, subscription_plans(*)")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: plans } = await supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order");
  const { data: platformSettingsRows } = await supabase.rpc("get_public_platform_khqr");
  const platformSettings = platformSettingsRows?.[0] ?? null;
  const hasPlatformKhqr = Boolean(platformSettings?.bakong_account_id && platformSettings?.bakong_phone);

  const currentPlan = currentSub?.subscription_plans as unknown as { id: string; name: string } | null;
  const isExpired = currentSub ? new Date(currentSub.current_period_end ?? 0) < new Date() : true;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Subscription</h1>
      </div>

      <Card className="mb-6">
        {currentSub && currentPlan ? (
          <>
            <div className={cn("mb-2 flex items-center gap-2", isExpired ? "text-warning" : "text-success")}>
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">
                {currentPlan.name} plan {isExpired ? "(expired)" : ""}
              </span>
            </div>
            <p className="text-sm text-white/50">
              {isExpired ? "Expired" : "Renews"} on {new Date(currentSub.current_period_end ?? "").toLocaleDateString()} ·{" "}
              {currentSub.billing_cycle}
            </p>
          </>
        ) : (
          <p className="text-white/60">No active subscription — choose a plan below.</p>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {(plans ?? []).map((p) => {
          const isCurrent = !isExpired && currentPlan?.id === p.id;
          return (
            <Card key={p.id} className={cn("text-center", isCurrent && "border-primary/50")}>
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="my-2 text-2xl font-bold text-accent">${p.price_monthly}</p>
              <p className="mb-1 text-xs text-white/40">per month</p>
              <p className="mb-3 text-xs text-white/40">${p.price_yearly}/year</p>
              <ul className="mb-4 space-y-1 text-left text-xs text-white/50">
                <li>{p.product_limit ? `Up to ${p.product_limit} products` : "Unlimited products"}</li>
                {p.ai_enabled && <li>AI Assistant eligible</li>}
                {p.analytics_enabled && <li>Advanced analytics</li>}
                {p.stories_enabled && <li>Stories</li>}
                {p.boost_enabled && <li>Post/product boosting</li>}
              </ul>
              {isCurrent ? (
                <span className="block rounded-xl border border-primary/40 bg-primary/10 py-2 text-sm font-semibold text-primary">
                  Current plan
                </span>
              ) : (
                <>
                  <ChangePlanButton planId={p.id} label={currentSub ? "Switch to this plan" : "Subscribe"} />
                  {hasPlatformKhqr && (
                    <PlatformKhqrToggle
                      accountId={platformSettings!.bakong_account_id!}
                      phone={platformSettings!.bakong_phone!}
                      merchantName={platformSettings!.platform_name}
                      merchantCity={platformSettings!.platform_city}
                      amount={p.price_monthly}
                    />
                  )}
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
