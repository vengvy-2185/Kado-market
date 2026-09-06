import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import { getMyStoreOrRedirect } from "@/lib/store";
import { Card } from "@/components/ui/card";

export default async function CustomersPage() {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { data: orders } = await supabase
    .from("orders")
    .select("customer_id, total, created_at, status")
    .eq("store_id", store.id);

  const byCustomer = new Map<string, { orderCount: number; totalSpent: number; lastOrderAt: string }>();
  for (const o of orders ?? []) {
    if (o.status === "cancelled" || o.status === "refunded") continue;
    const existing = byCustomer.get(o.customer_id);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += Number(o.total);
      if (o.created_at > existing.lastOrderAt) existing.lastOrderAt = o.created_at;
    } else {
      byCustomer.set(o.customer_id, { orderCount: 1, totalSpent: Number(o.total), lastOrderAt: o.created_at });
    }
  }

  const customerIds = Array.from(byCustomer.keys());
  let profiles: { id: string; full_name: string | null; avatar_url: string | null; username: string | null }[] = [];
  if (customerIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, username")
      .in("id", customerIds);
    profiles = data ?? [];
  }

  const rows = customerIds
    .map((id) => {
      const stats = byCustomer.get(id)!;
      const profile = profiles.find((p) => p.id === id);
      return { id, profile, ...stats };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold">Customers</h1>

      {rows.length === 0 ? (
        <Card>
          <p className="text-white/60">No customers yet — they'll show up here after their first order.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id} className="flex items-center gap-3">
              <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-full bg-white/5">
                {r.profile?.avatar_url ? (
                  <Image src={r.profile.avatar_url} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/30">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.profile?.full_name ?? "Unknown customer"}</p>
                <p className="text-xs text-white/40">
                  {r.orderCount} order{r.orderCount > 1 ? "s" : ""} · Last order {new Date(r.lastOrderAt).toLocaleDateString()}
                </p>
              </div>
              <p className="flex-shrink-0 font-semibold text-accent">${r.totalSpent.toFixed(2)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
