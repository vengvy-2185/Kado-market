import { notFound } from "next/navigation";
import { getMyStoreOrRedirect } from "@/lib/store";
import { EditProductForm } from "@/components/products/edit-product-form";
import { ShareLinkButton } from "@/components/share-link-button";
import { T } from "@/components/t";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const { supabase, store } = await getMyStoreOrRedirect();

  const [{ data: product }, { data: images }, { data: variants }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", params.id).eq("store_id", store.id).single(),
    supabase.from("product_images").select("*").eq("product_id", params.id).order("sort_order"),
    supabase.from("product_variants").select("*").eq("product_id", params.id),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          <T k="product_form_edit_title" />
        </h1>
        {product.status === "active" && <ShareLinkButton path={`/product/${product.slug}`} />}
      </div>
      <EditProductForm
        product={product}
        images={images ?? []}
        variants={variants ?? []}
        categories={categories ?? []}
        storeId={store.id}
      />
    </div>
  );
}
