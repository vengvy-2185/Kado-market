import { getMyStoreOrRedirect } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { RevenueChart } from "@/components/analytics/revenue-chart";
import { RangeTabs } from "@/components/analytics/range-tabs";

const VALID_RANGES = ["today", "7d", "30d", "90d", "1y"] as const;
type Range = (typeof VALID_RANGES)[number];

function rangeToStartDate(range: Range): Date {
  const now = new Date();
  switch (range) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "1y":
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  }
}

export default async function AnalyticsPage({ searchParams }: { searchParams: { range?: string } }) {
  const { supabase, store } = await getMyStoreOrRedirect();

  const range = (VALID_RANGES.includes(searchParams.range as Range) ? searchParams.range : "30d") as Range;
  const startDate = rangeToStartDate(range);

  const excludedStatuses = ["cancelled", "refunded"];

  const [{ data: orders }, { data: orderItems }, { data: viewRows }, { count: totalOrdersAllTime }] = await Promise.all([
    supabase
      .from("orders")
      .select("total, created_at, status")
      .eq("store_id", store.id)
      .gte("created_at", startDate.toISOString()),
    supabase
      .from("order_items")
      .select("product_name, quantity, subtotal, orders!inner(store_id, created_at, status)")
      .eq("orders.store_id", store.id)
      .gte("orders.created_at", startDate.toISOString()),
    supabase.from("products").select("view_count").eq("store_id", store.id),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("store_id", store.id),
  ]);

  const validOrders = (orders ?? []).filter((o) => !excludedStatuses.includes(o.status));
  const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrders = validOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalViews = (viewRows ?? []).reduce((sum, r) => sum + (r.view_count ?? 0), 0);
  const conversionRate = totalViews > 0 ? ((totalOrdersAllTime ?? 0) / totalViews) * 100 : 0;

  // group revenue by day for the chart
  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (const o of validOrders) {
    const day = new Date(o.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const existing = byDay.get(day) ?? { revenue: 0, orders: 0 };
    existing.revenue += Number(o.total);
    existing.orders += 1;
    byDay.set(day, existing);
  }
  const chartData = Array.from(byDay.entries()).map(([date, v]) => ({ date, ...v }));

  // top products by revenue within range
  const topProductsMap = new Map<string, { units: number; revenue: number }>();
  for (const item of orderItems ?? []) {
    const orderMeta = item.orders as unknown as { status: string } | null;
    if (orderMeta && excludedStatuses.includes(orderMeta.status)) continue;
    const existing = topProductsMap.get(item.product_name) ?? { units: 0, revenue: 0 };
    existing.units += item.quantity;
    existing.revenue += Number(item.subtotal);
    topProductsMap.set(item.product_name, existing);
  }
  const topProducts = Array.from(topProductsMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <RangeTabs active={range} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-white/50">Revenue</p>
          <p className="text-xl font-bold text-success">${totalRevenue.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-white/50">Orders</p>
          <p className="text-xl font-bold">{totalOrders}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-white/50">Avg. order value</p>
          <p className="text-xl font-bold">${avgOrderValue.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-white/50">Conversion (all-time)</p>
          <p className="text-xl font-bold">{conversionRate.toFixed(1)}%</p>
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-white/70">Revenue over time</h2>
        <RevenueChart data={chartData} />
      </Card>

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-white/70">Top products (this period)</h2>
        {topProducts.length === 0 ? (
          <p className="text-sm text-white/40">No sales in this period yet.</p>
        ) : (
          <div className="space-y-2">
            {topProducts.map((p) => (
              <div key={p.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                <span className="truncate">{p.name}</span>
                <span className="flex-shrink-0 text-white/50">
                  {p.units} sold · <span className="font-semibold text-accent">${p.revenue.toFixed(2)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-white/70">Product views</h2>
        <p className="text-xl font-bold">{totalViews}</p>
        <p className="text-xs text-white/40">All-time total across all products (not scoped to the selected period).</p>
      </Card>
    </div>
  );
}
