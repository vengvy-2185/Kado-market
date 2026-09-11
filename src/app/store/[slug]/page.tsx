import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Store as StoreIcon, MapPin, ShieldCheck, Package, MessageCircle, Bot } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MobileBottomNav } from "@/components/home/mobile-bottom-nav";
import { QuickActions } from "@/components/product/quick-actions";
import { startConversation } from "@/lib/actions/chat";
import { getOrStartAiThread } from "@/lib/actions/ai-assistant";
import { BackButton } from "@/components/dashboard/back-button";
import { SiteHeader } from "@/components/site-header";
import { StoryBar, type StoryGroup } from "@/components/stories/story-bar";
import { LocationCard } from "@/components/map/location-card";

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

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, compare_at_price, product_images(url, sort_order)")
    .eq("store_id", store.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

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

  const storeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.store_name,
    description: store.description ?? undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/store/${store.slug}`,
    logo: store.logo_url ?? undefined,
    image: store.cover_image_url ?? undefined,
    address: store.city
      ? { "@type": "PostalAddress", addressLocality: store.city, addressCountry: store.country ?? "KH" }
      : undefined,
    sameAs: [store.facebook_url, store.telegram_url, store.tiktok_url, store.instagram_url, store.website_url].filter(Boolean),
  };

  return (
    <main className="mx-auto max-w-4xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }} />
      <SiteHeader />
      <div className="px-4 pb-16 md:px-6">
      <div className="mb-4">
        <BackButton />
      </div>
      {store.status !== "active" && user?.id === store.seller_id && (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning">
          Preview only — this store is <span className="font-semibold capitalize">{store.status.replace("_", " ")}</span> and isn&apos;t visible to customers yet.
        </div>
      )}
      {/* Cover */}
      <div className="relative -mx-4 h-40 w-[calc(100%+2rem)] bg-white/5 md:-mx-6 md:h-56 md:w-[calc(100%+3rem)]">
        {store.cover_image_url ? (
          <Image src={store.cover_image_url} alt="" fill className="object-cover" priority />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/20">
            <StoreIcon className="h-10 w-10" />
          </div>
        )}
      </div>

      {/* Header */}
      <div className="relative -mt-10 mb-6 flex flex-wrap items-end justify-between gap-4">
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
            {store.latitude && store.longitude && (
              <div className="mt-1.5">
                <LocationCard latitude={store.latitude} longitude={store.longitude} label={`View ${store.store_name} on map`} />
              </div>
            )}
          </div>
        </div>
        {user && user.id !== store.seller_id && (
          <div className="flex flex-wrap gap-2 pb-1">
            {hasAiAssistant && (
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
            <form action={startConversation.bind(null, store.id)}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold"
              >
                <MessageCircle className="h-4 w-4" />
                Chat with Seller
              </button>
            </form>
          </div>
        )}
      </div>

      <StoryBar groups={storyGroups} />

      {store.description && <p className="mb-6 text-sm text-white/70">{store.description}</p>}

      <h2 className="mb-3 text-sm font-semibold text-white/70">
        Products {products && products.length > 0 ? `(${products.length})` : ""}
      </h2>

      {!products || products.length === 0 ? (
        <p className="text-sm text-white/40">This store hasn&apos;t published any products yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => {
            const images = (p.product_images as { url: string; sort_order: number }[] | null) ?? [];
            const thumb = [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
            return (
              <div
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-surface/60 transition-colors hover:border-primary/40"
              >
                <Link href={`/product/${p.slug}`}>
                  <div className="aspect-square bg-white/5">
                    {thumb ? (
                      <Image src={thumb} alt={p.name} width={300} height={300} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-white/20">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link href={`/product/${p.slug}`}>
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-sm font-semibold text-accent">${p.price}</p>
                      {p.compare_at_price && (
                        <p className="text-xs text-white/30 line-through">${p.compare_at_price}</p>
                      )}
                    </div>
                  </Link>
                  {user && <QuickActions productId={p.id} storeId={store.id} hasAiAssistant={hasAiAssistant} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="h-16 md:hidden" aria-hidden />
      <MobileBottomNav isLoggedIn={Boolean(user)} />
      </div>
    </main>
  );
}
