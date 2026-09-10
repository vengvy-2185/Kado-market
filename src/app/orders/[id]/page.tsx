import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { OrderStatusControl } from "@/components/product/order-status-control";
import { BackButton } from "@/components/dashboard/back-button";
import { KhqrDisplay } from "@/components/settings/khqr-display";
import { generateKhqr } from "@/lib/khqr";
import { ReviewForm } from "@/components/reviews/review-form";
import { OrderTracker } from "@/components/product/order-tracker";
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

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/orders/${params.id}`);

  const { data: order } = await supabase.from("orders").select("*, stores(store_name, city, seller_id, bakong_account_id, bakong_phone)").eq("id", params.id).single();
  if (!order) notFound();

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order.id);
  const { data: history } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  const store = order.stores as unknown as { store_name: string; city: string | null; seller_id: string; bakong_account_id: string | null; bakong_phone: string | null } | null;
  const isSeller = store?.seller_id === user.id;

  let reviewedItemIds = new Set<string>();
  if (!isSeller && order.status === "delivered") {
    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("order_item_id")
      .in("order_item_id", (items ?? []).map((i) => i.id));
    reviewedItemIds = new Set((existingReviews ?? []).map((r) => r.order_item_id));
  }
  const address = order.shipping_address as { full_name: string; phone: string; address_line: string; city: string | null; province: string | null; country: string | null };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
          <p className="text-sm text-white/50">{store?.store_name}</p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", STATUS_COLOR[order.status])}>
          {order.status}
        </span>
      </div>

      {order.payment_method === "demo" && (
        <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning">
          DEMO PAYMENT MODE — no real charge was made for this order.
        </div>
      )}

      {store?.bakong_account_id && store?.bakong_phone && (
        <Card className="mb-4 flex flex-col items-center gap-2">
          <h2 className="text-sm font-semibold text-white/70">Pay via KHQR</h2>
          <KhqrDisplay
            khqrString={generateKhqr({
              bakongAccountId: store.bakong_account_id,
              accountInformation: store.bakong_phone,
              merchantName: store.store_name,
              merchantCity: store.city ?? "Phnom Penh",
              amount: Number(order.total),
              currency: "USD",
            })}
            merchantName={store.store_name}
            amountLabel={`$${order.total}`}
          />
          <p className="text-xs text-white/40">Scan with any Cambodian banking app to pay</p>
        </Card>
      )}

      <Card className="mb-4 space-y-3">
        <h2 className="text-sm font-semibold text-white/70">Items</h2>
        {(items ?? []).map((item) => (
          <div key={item.id}>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                {item.product_image && (
                  <Image src={item.product_image} alt={item.product_name} width={56} height={56} className="h-14 w-14 object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.product_name}</p>
                <p className="text-xs text-white/50">Qty {item.quantity} × ${item.unit_price}</p>
              </div>
              <p className="text-sm font-semibold">${item.subtotal}</p>
            </div>
            {!isSeller && order.status === "delivered" && item.product_id && !reviewedItemIds.has(item.id) && (
              <div className="mt-2">
                <ReviewForm orderItemId={item.id} productId={item.product_id} storeId={order.store_id} productName={item.product_name} />
              </div>
            )}
          </div>
        ))}
        <div className="border-t border-white/10 pt-3 text-right text-sm">
          <p className="text-white/50">Subtotal: ${order.subtotal}</p>
          <p className="text-white/50">Shipping: ${order.shipping_fee}</p>
          <p className="mt-1 text-base font-bold">Total: ${order.total}</p>
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-white/70">Shipping address</h2>
        <p className="text-sm">{address.full_name} · {address.phone}</p>
        <p className="text-sm text-white/60">
          {address.address_line}
          {address.city ? `, ${address.city}` : ""}
          {address.province ? `, ${address.province}` : ""}
          {address.country ? `, ${address.country}` : ""}
        </p>
        {order.customer_note && <p className="mt-2 text-sm text-white/50">Note: {order.customer_note}</p>}
      </Card>

      {isSeller && (
        <Card className="mb-4">
          <h2 className="mb-2 text-sm font-semibold text-white/70">Update status</h2>
          <OrderStatusControl orderId={order.id} currentStatus={order.status} />
        </Card>
      )}

      <Card className="mb-4">
        <h2 className="mb-4 text-sm font-semibold text-white/70">Order tracking</h2>
        <OrderTracker currentStatus={order.status} history={history ?? []} />
      </Card>
    </main>
  );
}
