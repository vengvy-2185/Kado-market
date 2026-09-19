import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductGallery } from "@/components/product/product-gallery";
import { RecordRecentlyViewed, RecentlyViewedStrip } from "@/components/product/recently-viewed";
import { FlashSaleCountdown } from "@/components/product/flash-sale-countdown";
import { T } from "@/components/t";
import { BuyNowPanel } from "@/components/product/buy-now-panel";
import { SaveButton } from "@/components/product/save-button";
import { BackButton } from "@/components/dashboard/back-button";
import { AppShell } from "@/components/app-shell";
import { startConversation } from "@/lib/actions/chat";
import { StarRating } from "@/components/reviews/star-rating";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewsList } from "@/components/reviews/reviews-list";

async function getProduct(slug: string) {
  const supabase = createClient();
  // No app-level status filter — RLS already correctly scopes this to
  // active products from active stores for the public, while still
  // letting the product's own store owner (or an admin) preview it
  // regardless of status. Filtering by status here too would 404 an
  // owner previewing their own draft/pending product.
  const { data: product } = await supabase
    .from("products")
    .select(
      "*, product_images(url, sort_order), product_variants(*), stores(id, store_name, slug, verified, city, country, seller_id)"
    )
    .eq("slug", slug)
    .single();
  return product;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product not found" };
  const images = (product.product_images as { url: string }[] | null)?.map((i) => i.url) ?? [];
  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? `Buy ${product.name} on KADO MARKET`,
    alternates: { canonical: `/product/${params.slug}` },
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      url: `/product/${params.slug}`,
      images,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description ?? undefined,
      images,
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // best-effort view counter — doesn't need to block on errors
  await supabase.rpc("increment_product_view", { p_product_id: product.id });

  let isSaved = false;
  if (user) {
    const { data } = await supabase
      .from("saved_products")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();
    isSaved = Boolean(data);
  }

  const images = ((product.product_images as { url: string; sort_order: number }[] | null) ?? []).sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const variants = (product.product_variants as never[] | null) ?? [];
  const store = product.stores as unknown as { id: string; store_name: string; slug: string; verified: boolean; city: string | null; country: string | null; seller_id: string } | null;

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("id, rating, comment, images, seller_reply, created_at, profiles(full_name)")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false });
  const reviews = (reviewRows as unknown as Parameters<typeof ReviewsList>[0]["reviews"]) ?? [];

  let reviewableItems: { id: string }[] = [];
  if (user) {
    const { data: candidateItems } = await supabase
      .from("order_items")
      .select("id, orders!inner(customer_id, status)")
      .eq("product_id", product.id)
      .eq("orders.customer_id", user.id)
      .eq("orders.status", "delivered");
    const { data: existingReviews } = await supabase.from("reviews").select("order_item_id").eq("customer_id", user.id).eq("product_id", product.id);
    const reviewedOrderItemIds = new Set((existingReviews ?? []).map((r) => r.order_item_id));
    reviewableItems = (candidateItems ?? []).filter((ci) => !reviewedOrderItemIds.has(ci.id)).map((ci) => ({ id: ci.id }));
  }

  // "You might also like" -- other active products in the same category,
  // skipped entirely for uncategorized products rather than showing an
  // unrelated grab-bag.
  let similarProducts: { id: string; slug: string; name: string; price: number; product_images: { url: string; sort_order: number }[] | null }[] = [];
  if (product.category_id) {
    const { data } = await supabase
      .from("products")
      .select("id, slug, name, price, product_images(url, sort_order)")
      .eq("category_id", product.category_id)
      .eq("status", "active")
      .neq("id", product.id)
      .limit(8);
    similarProducts = data ?? [];
  }

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: images.map((img) => img.url),
    sku: product.sku ?? undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/product/${product.slug}`,
      priceCurrency: "USD",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: store ? { "@type": "Organization", name: store.store_name } : undefined,
    },
  };

  return (
    <AppShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <div className="px-4 py-6 md:px-6 md:py-8">
      <div className="mb-4">
        <BackButton />
      </div>
      {product.status !== "active" && user?.id === store?.seller_id && (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning">
          Preview only — this product is <span className="font-semibold capitalize">{product.status.replace("_", " ")}</span> and isn&apos;t visible to customers yet.
        </div>
      )}
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <ProductGallery images={images} alt={product.name} />
        </div>

        <div>
          {store && (
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm text-white/50">
                Sold by <Link href={`/store/${store.slug}`} className="text-white/80 hover:underline">{store.store_name}</Link>
                {store.verified && " · Verified"}
              </p>
              {user && user.id !== store.seller_id && (
                <form action={startConversation.bind(null, store.id)}>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium hover:bg-white/10"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat
                  </button>
                </form>
              )}
            </div>
          )}
          <h1 className="text-2xl font-bold">{product.name}</h1>
          {product.review_count > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <StarRating rating={product.avg_rating} />
              <span className="text-sm text-white/50">
                {product.avg_rating} ({product.review_count} review{product.review_count === 1 ? "" : "s"})
              </span>
            </div>
          )}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-accent">${product.price}</span>
            {product.compare_at_price && (
              <span className="text-white/40 line-through">${product.compare_at_price}</span>
            )}
          </div>
          {product.sale_ends_at && new Date(product.sale_ends_at).getTime() > Date.now() && (
            <div className="mt-2">
              <FlashSaleCountdown endsAt={product.sale_ends_at} />
            </div>
          )}

          {product.description && <p className="mt-4 text-sm text-white/70">{product.description}</p>}

          <div className="mt-6 space-y-3">
            <BuyNowPanel
              productId={product.id}
              price={product.price}
              stock={product.stock}
              variants={variants as { id: string; variant_name: string; price: number | null; stock: number }[]}
            />
            {user && <SaveButton productId={product.id} initialSaved={isSaved} variant="inline" />}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold">Reviews</h2>
        {reviewableItems.map((item) => (
          <div key={item.id} className="mb-3">
            <ReviewForm orderItemId={item.id} productId={product.id} storeId={store?.id ?? ""} productName={product.name} />
          </div>
        ))}
        <ReviewsList reviews={reviews} />
      </div>

      {similarProducts.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-white/70">
            <T k="similar_products" />
          </h2>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {similarProducts.map((p) => {
              const thumb = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
              return (
                <Link key={p.id} href={`/product/${p.slug}`} className="w-28 flex-shrink-0 sm:w-32">
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white/5">
                    {thumb ? (
                      <Image src={thumb} alt={p.name} width={128} height={128} className="h-full w-full object-contain p-2" />
                    ) : (
                      <div className="h-full w-full bg-white/5" />
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-1 text-xs text-white/70">{p.name}</p>
                  <p className="text-xs font-semibold text-accent">${p.price}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <RecentlyViewedStrip excludeProductId={product.id} />
      <RecordRecentlyViewed
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: images[0]?.url ?? null,
        }}
      />
      </div>
    </AppShell>
  );
}
