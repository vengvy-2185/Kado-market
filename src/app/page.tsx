import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { PostCard } from "@/components/posts/post-card";
import { HomeProductCard } from "@/components/home/home-product-card";
import { ProductFilters } from "@/components/home/product-filters";
import { PopularShopsRow } from "@/components/home/popular-shops-row";
import { HeroBannerCarousel } from "@/components/home/hero-banner-carousel";
import { T } from "@/components/t";
import { StoryBar, type StoryGroup } from "@/components/stories/story-bar";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; minPrice?: string; maxPrice?: string; location?: string; sort?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, username, role, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  let categoryId: string | null = null;
  if (searchParams.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", searchParams.category)
      .maybeSingle();
    categoryId = cat?.id ?? null;
  }

  const hasLocationFilter = Boolean(searchParams.location?.trim());

  let productQuery = supabase
    .from("products")
    .select(
      hasLocationFilter
        ? "id, name, slug, price, compare_at_price, store_id, sales_count, avg_rating, review_count, product_images(url, sort_order), stores!inner(store_name, slug, verified, city, province)"
        : "id, name, slug, price, compare_at_price, store_id, sales_count, avg_rating, review_count, product_images(url, sort_order), stores(store_name, slug, verified, city, province)"
    )
    .eq("status", "active")
    .limit(24);

  if (searchParams.q) productQuery = productQuery.ilike("name", `%${searchParams.q}%`);
  if (categoryId) productQuery = productQuery.eq("category_id", categoryId);
  if (searchParams.minPrice) productQuery = productQuery.gte("price", Number(searchParams.minPrice));
  if (searchParams.maxPrice) productQuery = productQuery.lte("price", Number(searchParams.maxPrice));
  if (hasLocationFilter) {
    const loc = `%${searchParams.location!.trim()}%`;
    productQuery = productQuery.or(`city.ilike.${loc},province.ilike.${loc}`, { foreignTable: "stores" });
  }

  switch (searchParams.sort) {
    case "price_asc":
      productQuery = productQuery.order("price", { ascending: true });
      break;
    case "price_desc":
      productQuery = productQuery.order("price", { ascending: false });
      break;
    case "best_selling":
      productQuery = productQuery.order("sales_count", { ascending: false });
      break;
    default:
      productQuery = productQuery.order("created_at", { ascending: false });
  }

  const { data: products } = await productQuery;

  const { data: aiStoreRows } = await supabase
    .from("ai_subscriptions")
    .select("store_id")
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString());
  const aiEnabledStoreIds = new Set((aiStoreRows ?? []).map((r) => r.store_id));

  let savedIds = new Set<string>();
  if (user) {
    const { data: saved } = await supabase.from("saved_products").select("product_id").eq("user_id", user.id);
    savedIds = new Set((saved ?? []).map((s) => s.product_id));
  }

  const isFiltered = Boolean(
    searchParams.q || searchParams.category || searchParams.minPrice || searchParams.maxPrice || searchParams.location || searchParams.sort
  );

  // Posts feed — only shown on the unfiltered default view, most recent first
  type RawPost = {
    id: string;
    content: string;
    created_at: string;
    store_id: string;
    stores: { id: string; store_name: string; slug: string; logo_url: string | null; verified: boolean; seller_id: string } | null;
    post_media: { url: string; sort_order: number }[] | null;
    products: { name: string; slug: string; price: number } | null;
    likes: { user_id: string }[] | null;
    comments: { id: string; content: string; created_at: string; user_id: string; parent_id: string | null; profiles: { full_name: string | null } | null }[] | null;
  };

  let posts: RawPost[] = [];
  let sponsoredPostIds = new Set<string>();
  if (!isFiltered) {
    const { data } = await supabase
      .from("posts")
      .select(
        "id, content, created_at, store_id, stores(id, store_name, slug, logo_url, verified, seller_id), post_media(url, sort_order), products(name, slug, price), likes(user_id), comments(id, content, created_at, user_id, parent_id, profiles(full_name))"
      )
      .order("created_at", { ascending: false })
      .limit(10);
    posts = (data as unknown as RawPost[]) ?? [];

    if (posts.length > 0) {
      const { data: boosts } = await supabase
        .from("boost_campaigns")
        .select("post_id")
        .in("post_id", posts.map((p) => p.id))
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString());
      sponsoredPostIds = new Set((boosts ?? []).map((b) => b.post_id).filter(Boolean) as string[]);
    }
  }

  const myStoreId = user
    ? (await supabase.from("stores").select("id").eq("seller_id", user.id).maybeSingle()).data?.id ?? null
    : null;

  // Popular shops — real ranking by product count, no fabricated follower numbers
  let popularShops: { store_name: string; slug: string; verified: boolean; logo_url: string | null; product_count: number }[] = [];
  if (!isFiltered) {
    const { data: shopRows } = await supabase
      .from("stores")
      .select("store_name, slug, verified, logo_url, products(count)")
      .eq("status", "active")
      .limit(50);
    popularShops = ((shopRows ?? []) as unknown as { store_name: string; slug: string; verified: boolean; logo_url: string | null; products: { count: number }[] }[])
      .map((s) => ({ store_name: s.store_name, slug: s.slug, verified: s.verified, logo_url: s.logo_url, product_count: s.products?.[0]?.count ?? 0 }))
      .filter((s) => s.product_count > 0)
      .sort((a, b) => b.product_count - a.product_count)
      .slice(0, 10);
  }

  // Stories — real, expiring after 24h (filtered server-side by expires_at)
  let storyGroups: StoryGroup[] = [];
  if (!isFiltered) {
    const { data: storyRows } = await supabase
      .from("stories")
      .select(
        "id, media_type, media_url, caption, text_content, store_id, stores(store_name, slug, logo_url, verified), products(name, slug)"
      )
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });

    const map = new Map<string, StoryGroup>();
    for (const row of storyRows ?? []) {
      const store = row.stores as unknown as { store_name: string; slug: string; logo_url: string | null; verified: boolean } | null;
      if (!store) continue;
      if (!map.has(row.store_id)) {
        map.set(row.store_id, {
          storeId: row.store_id,
          storeName: store.store_name,
          storeSlug: store.slug,
          logoUrl: store.logo_url,
          verified: store.verified,
          stories: [],
        });
      }
      map.get(row.store_id)!.stories.push({
        id: row.id,
        media_type: row.media_type,
        media_url: row.media_url,
        caption: row.caption,
        text_content: row.text_content,
        product: row.products as unknown as { name: string; slug: string } | null,
      });
    }
    storyGroups = Array.from(map.values());
  }

  return (
    <AppShell showCategories searchDefaultValue={searchParams.q} activeCategory={searchParams.category}>
      <div className="px-4 py-6 md:px-6 md:py-8">

      <StoryBar groups={storyGroups} />
      {!isFiltered && <HeroBannerCarousel />}
      <ProductFilters />
      {!isFiltered && <PopularShopsRow shops={popularShops} />}

      {/* Compact welcome / role links */}
      {user && profile ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-white/50">
            Welcome, <span className="text-white">{profile.full_name ?? user.email}</span>
          </span>
          {(profile.role === "seller" || profile.role === "admin" || profile.role === "super_admin") && (
            <Link href="/dashboard" className="text-accent hover:underline">
              Seller Dashboard
            </Link>
          )}
          {(profile.role === "admin" || profile.role === "super_admin") && (
            <Link href="/admin" className="text-accent hover:underline">
              Admin Dashboard
            </Link>
          )}
          <Link href="/account/orders" className="text-accent hover:underline">
            My Orders
          </Link>
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-3 text-sm text-white/50">
          <span>New here?</span>
          <Link href="/signup" className="text-accent hover:underline">
            Create an account
          </Link>
          <span>to save favorites, cart items, and track orders.</span>
        </div>
      )}

      {/* Interleaved feed: posts with product rows mixed in, not one big block of each */}
      {!isFiltered && posts.length > 0 && (
        <div className="mb-8 space-y-4">
          {posts.map((post, postIndex) => {
            const media = (post.post_media ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
            const likeArr = post.likes ?? [];
            const commentArr = post.comments ?? [];
            const interleavedProducts = (products ?? []).slice(postIndex * 2, postIndex * 2 + 2);
            return (
              <div key={post.id} className="space-y-4">
                <PostCard
                  currentUserId={user?.id ?? null}
                  isLoggedIn={Boolean(user)}
                  canModerate={Boolean(myStoreId && myStoreId === post.store_id)}
                  isSponsored={sponsoredPostIds.has(post.id)}
                  post={{
                    id: post.id,
                    content: post.content,
                    created_at: post.created_at,
                    store: post.stores,
                    media: media.map((m) => ({ url: m.url })),
                    product: post.products,
                    likeCount: likeArr.length,
                    likedByMe: Boolean(user && likeArr.some((l) => l.user_id === user.id)),
                    commentCount: commentArr.length,
                    comments: commentArr.map((c) => ({
                      id: c.id,
                      content: c.content,
                      created_at: c.created_at,
                      user_id: c.user_id,
                      parent_id: c.parent_id,
                      author_name: c.profiles?.full_name ?? "Someone",
                    })),
                  }}
                />
                {interleavedProducts.length > 0 && (
                  <div className="mx-auto max-w-lg">
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/30">
                      <ShoppingBag className="h-3 w-3" /> <T k="home_picks_for_you" />
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {interleavedProducts.map((p) => (
                        <HomeProductCard
                          key={p.id}
                          product={p as unknown as Parameters<typeof HomeProductCard>[0]["product"]}
                          isLoggedIn={Boolean(user)}
                          isSaved={savedIds.has(p.id)}
                          hasAiAssistant={aiEnabledStoreIds.has(p.store_id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Remaining products (or full results grid when searching/filtering) */}
      <h2 className="mb-4 text-sm font-semibold text-white/70">
        {isFiltered ? (
          <>
            <T k="home_results_for" />
            {searchParams.q ? ` for "${searchParams.q}"` : ""}
          </>
        ) : (
          <T k="home_more_products" />
        )}
      </h2>

      {!products || products.length === 0 ? (
        <p className="text-sm text-white/40">
          {isFiltered ? <T k="home_no_match" /> : <T k="home_no_products" />}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {(isFiltered ? products : products.slice(posts.length * 2)).map((p) => (
            <HomeProductCard
              key={p.id}
              product={p as unknown as Parameters<typeof HomeProductCard>[0]["product"]}
              isLoggedIn={Boolean(user)}
              isSaved={savedIds.has(p.id)}
              hasAiAssistant={aiEnabledStoreIds.has(p.store_id)}
            />
          ))}
        </div>
      )}
      </div>
    </AppShell>
  );
}
