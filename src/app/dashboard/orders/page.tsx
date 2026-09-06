import Link from "next/link";
import { getMyStoreOrRedirect } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

export default async function SellerOrdersPage() {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(product_name)")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold">Orders</h1>

      {!orders || orders.length === 0 ? (
        <Card>
          <p className="text-white/60">No orders yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const buyerName = (o.shipping_address as { full_name?: string } | null)?.full_name ?? "Unknown buyer";
            const items = (o.order_items as { product_name: string }[] | null) ?? [];
            const itemsLabel = items.map((i) => i.product_name).join(", ");
            return (
              <Link key={o.id} href={`/orders/${o.id}`}>
                <Card className="flex items-center justify-between transition-colors hover:border-primary/40">
                  <div className="min-w-0">
                    <p className="font-semibold">{o.order_number}</p>
                    <p className="truncate text-sm text-white/60">
                      {buyerName} · {itemsLabel}
                    </p>
                    <p className="text-xs text-white/40">
                      ${o.total} · {new Date(o.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={cn("flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize", STATUS_COLOR[o.status])}>
                    {o.status}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
