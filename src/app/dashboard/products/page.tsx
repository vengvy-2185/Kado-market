import Link from "next/link";
import { getMyStoreOrRedirect } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function ProductsPage() {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, stock, status, low_stock_threshold, slug")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/dashboard/products/new">
          <Button>+ Add product</Button>
        </Link>
      </div>

      {!products || products.length === 0 ? (
        <Card>
          <p className="text-white/60">No products yet. Add your first one to get started.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const isOutOfStock = p.stock === 0;
            const isLowStock = !isOutOfStock && p.stock <= p.low_stock_threshold;
            return (
              <Link key={p.id} href={`/dashboard/products/${p.id}/edit`}>
                <Card className="flex items-center justify-between transition-colors hover:border-primary/40">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-white/50">
                      ${p.price} ·{" "}
                      <span
                        className={cn(
                          isOutOfStock && "text-danger",
                          isLowStock && "text-warning",
                          !isOutOfStock && !isLowStock && "text-white/50"
                        )}
                      >
                        {isOutOfStock ? "OUT OF STOCK" : isLowStock ? `LOW STOCK (${p.stock})` : `Stock: ${p.stock}`}
                      </span>
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                      p.status === "active" && "bg-success/15 text-success",
                      p.status === "draft" && "bg-white/10 text-white/60",
                      p.status === "out_of_stock" && "bg-danger/15 text-danger",
                      p.status === "archived" && "bg-white/5 text-white/40"
                    )}
                  >
                    {p.status.replace("_", " ")}
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
