import { getMyStoreOrRedirect } from "@/lib/store";
import { NewStoryForm } from "@/components/stories/new-story-form";

export default async function NewStoryPage() {
  const { supabase, store } = await getMyStoreOrRedirect();
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("store_id", store.id)
    .eq("status", "active")
    .order("name");

  return (
    <main className="mx-auto max-w-lg px-4 py-8 md:px-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold">New story</h1>
      <NewStoryForm storeId={store.id} products={products ?? []} />
    </main>
  );
}
