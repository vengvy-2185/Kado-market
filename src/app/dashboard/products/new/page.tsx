import { getMyStoreOrRedirect } from "@/lib/store";
import { NewProductForm } from "@/components/products/new-product-form";

export default async function NewProductPage() {
  const { supabase, store } = await getMyStoreOrRedirect();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Add a product</h1>
      <NewProductForm storeId={store.id} categories={categories ?? []} />
    </div>
  );
}
