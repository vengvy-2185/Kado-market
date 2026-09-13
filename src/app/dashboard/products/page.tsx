import Link from "next/link";
import { Flame, Sparkles } from "lucide-react";
import { getMyStoreOrRedirect } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductsListWithSelection } from "@/components/dashboard/products-list-with-selection";
import { isNewProduct, isPopularProduct } from "@/lib/product-badges";

export default async function ProductsPage() {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, stock, status, low_stock_threshold, slug, sales_count, created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  const popularCount = (products ?? []).filter((p) => isPopularProduct(p.sales_count)).length;
  const newCount = (products ?? []).filter((p) => !isPopularProduct(p.sales_count) && isNewProduct(p.created_at)).length;

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
        <>
          {(popularCount > 0 || newCount > 0) && (
            <div className="mb-4 flex flex-wrap gap-3">
              {popularCount > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500">
                    <Flame className="h-4 w-4 text-white" />
                  </span>
                  <span className="text-sm text-white/70">
                    <span className="font-semibold text-white">{popularCount}</span> popular product{popularCount === 1 ? "" : "s"}
                  </span>
                </div>
              )}
              {newCount > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500">
                    <Sparkles className="h-4 w-4 text-white" />
                  </span>
                  <span className="text-sm text-white/70">
                    <span className="font-semibold text-white">{newCount}</span> new listing{newCount === 1 ? "" : "s"} (last 14 days)
                  </span>
                </div>
              )}
            </div>
          )}
          <p className="mb-3 text-xs text-white/30">Tip: press and hold a product to select multiple and duplicate them.</p>
          <ProductsListWithSelection products={products} />
        </>
      )}
    </div>
  );
}
