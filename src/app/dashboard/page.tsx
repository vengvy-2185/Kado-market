import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockChart } from "@/components/dashboard/stock-chart";
import { FeaturedProducts } from "@/components/dashboard/featured-products";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { T } from "@/components/dashboard/t";
import { DollarSign, Eye, Users, Package, ShoppingCart, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("seller_id", user!.id)
    .single();

  let stats = { products: 0, lowStock: 0, outOfStock: 0, totalViews: 0, totalRevenue: 0, orderCount: 0, followerCount: 0 };
  let chartData: { name: string; stock: number }[] = [];
  let featured: { id: string; name: string; price: number; stock: number; thumbnail: string | null }[] = [];
  let activity: { id: string; type: string; quantity: number; reason: string | null; created_at: string; product_name: string }[] = [];

  if (store) {
    const [
      { count: productCount },
      { count: lowStockCount },
      { count: outOfStockCount },
      { data: products },
      { data: txns },
      { data: viewRows },
      { data: revenueRows },
      { count: orderCount },
      { count: followerCount },
    ] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }).eq("store_id", store.id),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("store_id", store.id)
          .gt("stock", 0)
          .lte("stock", 5),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("store_id", store.id)
          .eq("status", "out_of_stock"),
        supabase
          .from("products")
          .select("id, name, price, stock, product_images(url, sort_order)")
          .eq("store_id", store.id)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("inventory_transactions")
          .select("id, type, quantity, reason, created_at, products(name)")
          .eq("store_id", store.id)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase.from("products").select("view_count").eq("store_id", store.id),
        supabase
          .from("orders")
          .select("total")
          .eq("store_id", store.id)
          .in("status", ["paid", "processing", "packed", "shipped", "delivered"]),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("store_id", store.id),
        supabase.from("store_followers").select("*", { count: "exact", head: true }).eq("store_id", store.id),
      ]);

    stats = {
      products: productCount ?? 0,
      lowStock: lowStockCount ?? 0,
      outOfStock: outOfStockCount ?? 0,
      totalViews: (viewRows ?? []).reduce((sum, r) => sum + (r.view_count ?? 0), 0),
      totalRevenue: (revenueRows ?? []).reduce((sum, r) => sum + Number(r.total ?? 0), 0),
      orderCount: orderCount ?? 0,
      followerCount: followerCount ?? 0,
    };

    chartData = (products ?? []).slice(0, 6).map((p) => ({ name: p.name, stock: p.stock }));

    featured = (products ?? []).slice(0, 5).map((p) => {
      const images = (p.product_images as { url: string; sort_order: number }[] | null) ?? [];
      const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
      return { id: p.id, name: p.name, price: p.price, stock: p.stock, thumbnail: sorted[0]?.url ?? null };
    });

    activity = (txns ?? []).map((t) => ({
      id: t.id,
      type: t.type,
      quantity: t.quantity,
      reason: t.reason,
      created_at: t.created_at,
      product_name: (t.products as unknown as { name: string } | null)?.name ?? "—",
    }));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold">
        <T k="seller_dashboard" />
      </h1>

      {!store ? (
        <Card>
          <p className="text-white/60">
            No store found for this account yet — sign up again as a seller to create one.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <p className="text-sm text-white/50">
              <T k="your_store" />
            </p>
            <p className="text-xl font-semibold">{store.store_name}</p>
            <p className="text-sm text-white/50">
              Status: <span className="text-white">{store.status}</span> · Setup step{" "}
              {store.setup_step}/12 {store.setup_completed ? "(complete)" : "(incomplete)"}
            </p>

            {!store.setup_completed && (
              <div className="mt-4">
                <Link href="/dashboard/store/setup">
                  <Button>
                    <T k="continue_setup" />
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 md:gap-4">
            {[
              { label: "Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "bg-emerald-500/15 text-emerald-400" },
              { label: "Views", value: stats.totalViews, icon: Eye, color: "bg-blue-500/15 text-blue-400" },
              { label: "Followers", value: stats.followerCount, icon: Users, color: "bg-purple-500/15 text-purple-400" },
              { label: "Products", value: stats.products, icon: Package, color: "bg-amber-500/15 text-amber-400" },
              { label: "Orders", value: stats.orderCount, icon: ShoppingCart, color: "bg-pink-500/15 text-pink-400" },
              { label: "Low Stock", value: stats.lowStock, icon: AlertTriangle, color: "bg-orange-500/15 text-orange-400" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="p-4">
                  <span className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-xl", stat.color)}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <p className="text-xs text-white/50">{stat.label}</p>
                  <p className="text-lg font-bold md:text-xl">{stat.value}</p>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <h2 className="mb-1 text-sm font-semibold text-white/70">
                <T k="stock_overview" />
              </h2>
              <StockChart data={chartData} />
            </Card>

            <Card className="space-y-6">
              <FeaturedProducts products={featured} title="Featured products" />
              <RecentActivity items={activity} title="Recent activity" />
              {featured.length === 0 && activity.length === 0 && (
                <p className="text-sm text-white/40">
                  <T k="no_products_yet" />
                </p>
              )}
            </Card>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/products">
              <Button variant="outline">
                <T k="manage_products" />
              </Button>
            </Link>
            <Link href="/dashboard/inventory">
              <Button variant="outline">
                <T k="manage_inventory" />
              </Button>
            </Link>
            <Link href="/dashboard/store/setup">
              <Button variant="outline">
                <T k="edit_store_info" />
              </Button>
            </Link>
          </div>

          <p className="text-sm text-white/40">
            <T k="coming_later_note" />
          </p>
        </div>
      )}
    </div>
  );
}
