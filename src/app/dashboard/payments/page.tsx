import Link from "next/link";
import { CreditCard } from "lucide-react";
import { getMyStoreOrRedirect } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-white/10 text-white/60",
  success: "bg-success/15 text-success",
  failed: "bg-danger/15 text-danger",
  expired: "bg-white/10 text-white/40",
  refunded: "bg-danger/15 text-danger",
};

export default async function PaymentsPage() {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, total, discount_amount, payment_status, payment_method, paid_at, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  const totalReceived = (orders ?? [])
    .filter((o) => o.payment_status === "success")
    .reduce((sum, o) => sum + Number(o.total), 0);
  const pendingCount = (orders ?? []).filter((o) => o.payment_status === "pending").length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Payments</h1>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-white/50">Total received</p>
          <p className="text-xl font-bold text-success">${totalReceived.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-white/50">Transactions</p>
          <p className="text-xl font-bold">{orders?.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-white/50">Pending</p>
          <p className="text-xl font-bold text-warning">{pendingCount}</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-white/70">Transaction history</h2>
        {!orders || orders.length === 0 ? (
          <p className="text-sm text-white/40">No payments yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:bg-white/[0.06]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{o.order_number}</p>
                  <p className="text-xs text-white/40 capitalize">
                    {o.payment_method} · {new Date(o.created_at).toLocaleDateString()}
                    {o.discount_amount > 0 && ` · -$${o.discount_amount} discount`}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <span className="font-semibold">${o.total}</span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize", STATUS_COLOR[o.payment_status])}>
                    {o.payment_status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <p className="mt-4 text-xs text-white/30">
        All payments are currently processed in DEMO MODE — no real payment provider is connected yet (spec section 31).
      </p>
    </div>
  );
}
