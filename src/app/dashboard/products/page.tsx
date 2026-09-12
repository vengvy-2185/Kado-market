import Link from "next/link";
import { getMyStoreOrRedirect } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductsListWithSelection } from "@/components/dashboard/products-list-with-selection";

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
        <>
          <p className="mb-3 text-xs text-white/30">Tip: press and hold a product to select multiple and duplicate them.</p>
          <ProductsListWithSelection products={products} />
        </>
      )}
    </div>
  );
}
