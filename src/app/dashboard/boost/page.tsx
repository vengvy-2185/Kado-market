import { Zap } from "lucide-react";
import { getMyStoreOrRedirect } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { NewBoostForm } from "@/components/boost/new-boost-form";
import { CancelBoostButton } from "@/components/boost/cancel-boost-button";
import { cn } from "@/lib/utils";

export default async function BoostPage() {
  const { supabase, store } = await getMyStoreOrRedirect();

  const [{ data: posts }, { data: products }, { data: plans }, { data: campaigns }, { data: platformSettingsRows }] = await Promise.all([
    supabase.from("posts").select("id, content").eq("store_id", store.id).order("created_at", { ascending: false }),
    supabase.from("products").select("id, name").eq("store_id", store.id).eq("status", "active").order("name"),
    supabase.from("boost_plans").select("*").eq("is_active", true).order("sort_order"),
    supabase
      .from("boost_campaigns")
      .select("*, posts(content), products(name)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false }),
    supabase.rpc("get_public_platform_khqr"),
  ]);
  const platformSettings = platformSettingsRows?.[0] ?? null;

  const platformKhqr =
    platformSettings?.bakong_account_id && platformSettings?.bakong_phone
      ? {
          accountId: platformSettings.bakong_account_id,
          phone: platformSettings.bakong_phone,
          merchantName: platformSettings.platform_name,
          merchantCity: platformSettings.platform_city,
        }
      : null;

  const now = Date.now();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex items-center gap-2">
        <Zap className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Boost</h1>
      </div>

      <div className="mb-6">
        <NewBoostForm
          posts={(posts ?? []).map((p) => ({ id: p.id, label: p.content.slice(0, 40) }))}
          products={(products ?? []).map((p) => ({ id: p.id, label: p.name }))}
          plans={plans ?? []}
          platformKhqr={platformKhqr}
        />
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-white/70">Campaigns</h2>
        {!campaigns || campaigns.length === 0 ? (
          <p className="text-sm text-white/40">No boost campaigns yet.</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c) => {
              const post = c.posts as unknown as { content: string } | null;
              const product = c.products as unknown as { name: string } | null;
              const label = c.target_type === "post" ? post?.content.slice(0, 40) ?? "Post" : product?.name ?? "Product";
              const expired = new Date(c.expires_at).getTime() < now;
              const isActive = c.status === "active" && !expired;
              const isPending = c.status === "pending_payment";
              const statusLabel = isPending
                ? "Awaiting payment"
                : isActive
                  ? `Active until ${new Date(c.expires_at).toLocaleDateString()}`
                  : c.status === "cancelled"
                    ? "Cancelled"
                    : "Expired";
              return (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm capitalize">
                      {c.target_type}: {label}
                    </p>
                    <p className="text-xs text-white/40">{statusLabel}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        isActive ? "bg-success/15 text-success" : isPending ? "bg-warning/15 text-warning" : "bg-white/10 text-white/40"
                      )}
                    >
                      {isPending ? "Pending" : isActive ? "Sponsored" : c.status === "cancelled" ? "Cancelled" : "Expired"}
                    </span>
                    {(isActive || isPending) && <CancelBoostButton campaignId={c.id} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
