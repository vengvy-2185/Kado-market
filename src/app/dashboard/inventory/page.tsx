import { getMyStoreOrRedirect } from "@/lib/store";
import { InventoryPanel } from "@/components/products/inventory-panel";

export default async function InventoryPage() {
  const { supabase, store } = await getMyStoreOrRedirect();

  const [{ data: products }, { data: transactions }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, stock, low_stock_threshold, sku")
      .eq("store_id", store.id)
      .order("name"),
    supabase
      .from("inventory_transactions")
      .select("*, products(name)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Inventory</h1>
      <InventoryPanel products={products ?? []} transactions={(transactions as never) ?? []} />
    </div>
  );
}
