import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/dashboard/back-button";
import type { Database } from "@/lib/types/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"] & {
  stores: { store_name: string } | null;
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-white/10 text-white/60",
  paid: "bg-success/15 text-success",
  processing: "bg-warning/15 text-warning",
  packed: "bg-warning/15 text-warning",
  shipped: "bg-accent/15 text-accent",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-danger/15 text-danger",
  refunded: "bg-danger/15 text-danger",
};

export default async function MyOrdersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account/orders");

  const { data: ordersRaw } = await supabase
    .from("orders")
    .select("*, stores(store_name)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const orders = (ordersRaw ?? []) as unknown as OrderRow[];

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-4">
        <BackButton />
      </div>
      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>

      {orders.length === 0 ? (
        <Card>
          <p className="text-white/60">No orders yet — browse products and check out to see them here.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const store = o.stores;
            return (
              <Link key={o.id} href={`/orders/${o.id}`}>
                <Card className="flex items-center justify-between transition-colors hover:border-primary/40">
                  <div>
                    <p className="font-semibold">{o.order_number}</p>
                    <p className="text-sm text-white/50">
                      {store?.store_name} · ${o.total} · {new Date(o.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", STATUS_COLOR[o.status])}>
                    {o.status}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      </div>
    </AppShell>
  );
}
