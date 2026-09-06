"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMyStoreOrRedirect } from "@/lib/store";
import { slugify } from "@/lib/slugify";
import type { ProductCondition, ProductStatus } from "@/lib/types/database.types";

type VariantInput = {
  variant_name: string;
  sku?: string;
  price?: number | null;
  stock: number;
  attributes: Record<string, string>;
};

async function uniqueSlug(supabase: Awaited<ReturnType<typeof getMyStoreOrRedirect>>["supabase"], base: string) {
  let slug = base || "product";
  let suffix = 0;
  // simple collision loop — fine at this scale, product slugs are global per spec section 14
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const { data } = await supabase.from("products").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    suffix += 1;
  }
}

export async function createProduct(formData: FormData) {
  const { supabase, user, store } = await getMyStoreOrRedirect();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const price = Number(formData.get("price") ?? 0);
  const compareAtPriceRaw = formData.get("compare_at_price");
  const compare_at_price = compareAtPriceRaw ? Number(compareAtPriceRaw) : null;
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const condition = (String(formData.get("condition") ?? "new") as ProductCondition);
  const status = (String(formData.get("status") ?? "active") as ProductStatus);
  const category_id = String(formData.get("category_id") ?? "") || null;
  const initialStock = Number(formData.get("initial_stock") ?? 0);
  const lowStockThreshold = Number(formData.get("low_stock_threshold") ?? 5);
  const imageUrls = JSON.parse(String(formData.get("images") ?? "[]")) as string[];
  const variants = JSON.parse(String(formData.get("variants") ?? "[]")) as VariantInput[];

  if (!name || price < 0) {
    throw new Error("Product name and a valid price are required.");
  }

  const slug = await uniqueSlug(supabase, slugify(name));

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      store_id: store.id,
      category_id,
      name,
      slug,
      description,
      price,
      compare_at_price,
      sku,
      brand,
      condition,
      status,
      stock: 0, // established via the initial inventory transaction below
      low_stock_threshold: lowStockThreshold,
    })
    .select()
    .single();

  if (productError || !product) {
    throw new Error(productError?.message ?? "Failed to create product.");
  }

  if (imageUrls.length > 0) {
    await supabase.from("product_images").insert(
      imageUrls.map((url, i) => ({ product_id: product.id, url, sort_order: i }))
    );
  }

  if (initialStock > 0) {
    await supabase.from("inventory_transactions").insert({
      store_id: store.id,
      product_id: product.id,
      type: "stock_in",
      quantity: initialStock,
      reason: "Initial stock",
      created_by: user.id,
    });
  }

  for (const v of variants) {
    const { data: variant } = await supabase
      .from("product_variants")
      .insert({
        product_id: product.id,
        variant_name: v.variant_name,
        sku: v.sku ?? null,
        price: v.price ?? null,
        attributes: v.attributes ?? {},
        stock: 0,
      })
      .select()
      .single();

    if (variant && v.stock > 0) {
      await supabase.from("inventory_transactions").insert({
        store_id: store.id,
        product_id: product.id,
        variant_id: variant.id,
        type: "stock_in",
        quantity: v.stock,
        reason: "Initial stock",
        created_by: user.id,
      });
    }
  }

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function updateProduct(productId: string, formData: FormData) {
  const { supabase } = await getMyStoreOrRedirect();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const price = Number(formData.get("price") ?? 0);
  const compareAtPriceRaw = formData.get("compare_at_price");
  const compare_at_price = compareAtPriceRaw ? Number(compareAtPriceRaw) : null;
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const condition = (String(formData.get("condition") ?? "new") as ProductCondition);
  const status = (String(formData.get("status") ?? "active") as ProductStatus);
  const category_id = String(formData.get("category_id") ?? "") || null;
  const lowStockThreshold = Number(formData.get("low_stock_threshold") ?? 5);

  const { error } = await supabase
    .from("products")
    .update({
      name,
      description,
      price,
      compare_at_price,
      sku,
      brand,
      condition,
      status,
      category_id,
      low_stock_threshold: lowStockThreshold,
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${productId}/edit`);
}

export async function addProductImage(productId: string, url: string) {
  const { supabase } = await getMyStoreOrRedirect();
  await supabase.from("product_images").insert({ product_id: productId, url });
  revalidatePath(`/dashboard/products/${productId}/edit`);
}

export async function deleteProductImage(productId: string, imageId: string) {
  const { supabase } = await getMyStoreOrRedirect();
  await supabase.from("product_images").delete().eq("id", imageId);
  revalidatePath(`/dashboard/products/${productId}/edit`);
}

export async function deleteProduct(productId: string) {
  const { supabase } = await getMyStoreOrRedirect();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function adjustStock(formData: FormData) {
  const { supabase, user, store } = await getMyStoreOrRedirect();

  const product_id = String(formData.get("product_id"));
  const variant_id = String(formData.get("variant_id") ?? "") || null;
  const direction = String(formData.get("direction")); // "in" | "out" | "adjustment"
  const quantity = Number(formData.get("quantity") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!product_id || quantity === 0) throw new Error("Invalid stock adjustment.");

  const signedQuantity =
    direction === "stock_out" ? -Math.abs(quantity) : Math.abs(quantity);

  const { error } = await supabase.from("inventory_transactions").insert({
    store_id: store.id,
    product_id,
    variant_id,
    type: direction === "stock_out" ? "stock_out" : direction === "adjustment" ? "adjustment" : "stock_in",
    quantity: signedQuantity,
    reason,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/products");
}

export async function updateLowStockThreshold(productId: string, threshold: number) {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { error } = await supabase
    .from("products")
    .update({ low_stock_threshold: Math.max(0, threshold) })
    .eq("id", productId)
    .eq("store_id", store.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/inventory");
}
