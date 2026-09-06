import { getMyStoreOrRedirect } from "@/lib/store";
import { NewPostForm } from "@/components/posts/new-post-form";

export default async function NewPostPage() {
  const { supabase, store } = await getMyStoreOrRedirect();
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .eq("store_id", store.id)
    .eq("status", "active")
    .order("name");

  return (
    <main className="mx-auto max-w-lg px-4 py-8 md:px-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold">New post</h1>
      <NewPostForm storeId={store.id} products={products ?? []} />
    </main>
  );
}
