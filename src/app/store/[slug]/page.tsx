import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { MapPin, ShieldCheck, MessageCircle, Bot, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { startConversation } from "@/lib/actions/chat";
import { getOrStartAiThread } from "@/lib/actions/ai-assistant";
import { BackButton } from "@/components/dashboard/back-button";
import { AppShell } from "@/components/app-shell";
import { StoryBar, type StoryGroup } from "@/components/stories/story-bar";
import { FollowButton } from "@/components/store/follow-button";
import { CollapsibleCover } from "@/components/store/collapsible-cover";
import { StoreInfoPanel } from "@/components/store/store-info-panel";
import { StoreProductTabs } from "@/components/store/store-product-tabs";
import { ReviewsList } from "@/components/reviews/reviews-list";
import { StarRating } from "@/components/reviews/star-rating";

async function getStore(slug: string) {
  const supabase = createClient();
  // No app-level status filter here — RLS (products_select.../stores select
  // policy) already correctly returns active stores to the public, plus a
  // store's own owner/admin regardless of status. Filtering by status here
  // too would 404 an owner previewing their own pending/suspended store,
  // even though they're supposed to be allowed to see it.
  const { data: store } = await supabase.from("stores").select("*").eq("slug", slug).single();
  return store;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const store = await getStore(params.slug);
  if (!store) return { title: "Store not found" };
  const images = store.cover_image_url ? [store.cover_image_url] : [];
  return {
    title: store.store_name,
    description: store.description?.slice(0, 160) ?? `Shop ${store.store_name} on KADO MARKET`,
    alternates: { canonical: `/store/${params.slug}` },
    openGraph: {
      title: store.store_name,
      description: store.description ?? undefined,
      url: `/store/${params.slug}`,
      images,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: store.store_name,
      description: store.description ?? undefined,
      images,
    },
  };
}

export default async function StorePage({ params }: { params: { slug: string } }) {
  const store = await getStore(params.slug);
  if (!store) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: aiSub } = await supabase
    .from("ai_subscriptions")
    .select("id")
    .eq("store_id", store.id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  const hasAiAssistant = Boolean(aiSub);

  const { data: productRows } = await supabase
    .from("products")
    .select("id, name, slug, price, compare_at_price, product_images(url, sort_order), categories(name)")
    .eq("store_id", store.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const products = (productRows ?? []).map((p) => ({
    ...p,
    category_name: (p.categories as unknown as { name: string } | null)?.name ?? null,
  }));

  const { data: storyRows } = await supabase
    .from("stories")
    .select("id, media_type, media_url, caption, text_content, products(name, slug)")
    .eq("store_id", store.id)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });

  const storyGroups: StoryGroup[] =
    storyRows && storyRows.length > 0
      ? [
          {
            storeId: store.id,
            storeName: store.store_name,
            storeSlug: store.slug,
            logoUrl: store.logo_url,
            verified: store.verified,
            stories: storyRows.map((s) => ({
              id: s.id,
              media_type: s.media_type,
              media_url: s.media_url,
              caption: s.caption,
              text_content: s.text_content,
              product: s.products as unknown as { name: string; slug: string } | null,
            })),
          },
        ]
      : [];

  // Real follower count + whether the current viewer follows this store
  const { count: followerCount } = await supabase
    .from("store_followers")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id);
  let isFollowing = false;
  if (user) {
    const { data: followRow } = await supabase
      .from("store_followers")
      .select("id")
      .eq("store_id", store.id)
      .eq("user_id", user.id)
      .maybeSingle();
    isFollowing = Boolean(followRow);
  }

  // Real aggregate reviews for this store (not per-product — store-wide)
  const { data: reviewRows, count: reviewCount } = await supabase
    .from("reviews")
    .select("id, rating, comment, images, seller_reply, created_at, profiles(full_name)", { count: "exact" })
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const avgRating =
    reviewRows && reviewRows.length > 0 ? reviewRows.reduce((sum, r) => sum + r.rating, 0) / reviewRows.length : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.store_name,
    description: store.description ?? undefined,
    url: `${siteUrl}/store/${store.slug}`,
    logo: store.logo_url ?? undefined,
    image: store.cover_image_url ?? undefined,
    address: store.city
      ? { "@type": "PostalAddress", addressLocality: store.city, addressCountry: store.country ?? "KH" }
      : undefined,
    sameAs: [store.facebook_url, store.telegram_url, store.tiktok_url, store.instagram_url, store.website_url].filter(Boolean),
  };

  return (
    <AppShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }} />
      <div className="lg:sticky lg:top-16 lg:z-20 lg:bg-background lg:px-4 lg:pb-3 lg:pt-2 md:px-6 px-4">
        <div className="mb-4 mt-4">
          <BackButton />
        </div>
        {store.status !== "active" && user?.id === store.seller_id && (
          <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning">
            Preview only — this store is <span className="font-semibold capitalize">{store.status.replace("_", " ")}</span> and isn&apos;t visible to customers yet.
          </div>
        )}

        {/* Cover — full width, with a collapse toggle */}
        <CollapsibleCover coverImageUrl={store.cover_image_url} />

        {/* Header */}
        <div className="relative -mt-10 mb-6 flex flex-wrap items-end justify-between gap-4 px-2">
          <div className="flex items-end gap-4">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-surface md:h-24 md:w-24">
              {store.logo_url ? (
                <Image src={store.logo_url} alt={store.store_name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-gradient text-2xl font-bold">
                  {store.store_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold">{store.store_name}</h1>
                {store.verified && <ShieldCheck className="h-5 w-5 text-accent" />}
              </div>
              {store.city && (
                <p className="flex items-center gap-1 text-sm text-white/50">
                  <MapPin className="h-3.5 w-3.5" />
                  {[store.city, store.country].filter(Boolean).join(", ")}
                </p>
              )}
              {avgRating !== null && (
                <div className="mt-0.5 flex items-center gap-1.5 text-sm">
                  <StarRating rating={avgRating} />
                  <span className="text-white/40">
                    {avgRating.toFixed(1)} ({reviewCount} review{reviewCount === 1 ? "" : "s"})
                  </span>
                </div>
              )}
            </div>
          </div>
          {user?.id !== store.seller_id && (
            <div className="flex flex-wrap gap-2 pb-1">
              <FollowButton storeId={store.id} storeSlug={store.slug} isLoggedIn={Boolean(user)} initialFollowing={isFollowing} />
              {user && hasAiAssistant && (
                <form action={getOrStartAiThread.bind(null, store.id)}>
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
                  >
                    <Bot className="h-4 w-4 text-accent" />
                    Ask AI Assistant
                  </button>
                </form>
              )}
              {user && (
                <form action={startConversation.bind(null, store.id)}>
                  <button type="submit" className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold">
                    <MessageCircle className="h-4 w-4" />
                    Chat with Seller
                  </button>
                </form>
              )}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 md:px-6">
        <div className="flex flex-col gap-6 pb-16 xl:flex-row">
          <div id="store-top" className="min-w-0 flex-1">
          <StoryBar groups={storyGroups} />

          {store.description && (
            <p id="store-about" className="mb-6 text-sm text-white/70">
              {store.description}
            </p>
          )}

          <h2 id="store-products" className="mb-3 text-sm font-semibold text-white/70">
            Products {products.length > 0 ? `(${products.length})` : ""}
          </h2>

          {products.length === 0 ? (
            <p className="text-sm text-white/40">This store hasn&apos;t published any products yet.</p>
          ) : (
            <StoreProductTabs products={products} storeId={store.id} hasAiAssistant={hasAiAssistant} isLoggedIn={Boolean(user)} />
          )}

          <div id="store-reviews" className="mt-8">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-white/70">
              <Star className="h-4 w-4" /> Reviews {reviewCount ? `(${reviewCount})` : ""}
            </h2>
            <ReviewsList reviews={reviewRows ?? []} />
          </div>
        </div>

        <StoreInfoPanel
          city={store.city}
          country={store.country}
          createdAt={store.created_at}
          followerCount={followerCount ?? 0}
          latitude={store.latitude}
          longitude={store.longitude}
          storeName={store.store_name}
          storeUrl={`${siteUrl}/store/${store.slug}`}
        />
        </div>
        </div>
    </AppShell>
  );
}
