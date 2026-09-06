import Link from "next/link";
import Image from "next/image";
import { Package, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SaveButton } from "@/components/product/save-button";
import { SiteHeader } from "@/components/site-header";
import { PostCard } from "@/components/posts/post-card";
import { MobileBottomNav } from "@/components/home/mobile-bottom-nav";
import { QuickActions } from "@/components/product/quick-actions";
import { StoryBar, type StoryGroup } from "@/components/stories/story-bar";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
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

  const { data: categories } = await supabase
    .from("categories")
    .select("slug, name")
    .eq("is_active", true)
    .order("sort_order");

  let categoryId: string | null = null;
  if (searchParams.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", searchParams.category)
      .maybeSingle();
    categoryId = cat?.id ?? null;
  }

  let productQuery = supabase
    .from("products")
    .select("id, name, slug, price, compare_at_price, store_id, product_images(url, sort_order), stores(store_name, slug, verified)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(24);

  if (searchParams.q) productQuery = productQuery.ilike("name", `%${searchParams.q}%`);
  if (categoryId) productQuery = productQuery.eq("category_id", categoryId);

  const { data: products } = await productQuery;

  const { data: aiStoreRows } = await supabase
    .from("ai_subscriptions")
    .select("store_id")
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString());
  const aiEnabledStoreIds = new Set((aiStoreRows ?? []).map((r) => r.store_id));

  let savedIds = new Set<string>();
  let cartCount = 0;
  let chatUnreadCount = 0;
  if (user) {
    const [{ data: saved }, { data: cartItems }, { count: unread }] = await Promise.all([
      supabase.from("saved_products").select("product_id").eq("user_id", user.id),
      supabase.from("cart_items").select("quantity").eq("user_id", user.id),
      supabase.from("messages").select("*", { count: "exact", head: true }).is("read_at", null).neq("sender_id", user.id),
    ]);
    savedIds = new Set((saved ?? []).map((s) => s.product_id));
    cartCount = (cartItems ?? []).reduce((sum, i) => sum + i.quantity, 0);
    chatUnreadCount = unread ?? 0;
  }

  const isFiltered = Boolean(searchParams.q || searchParams.category);

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
    <main className="mx-auto max-w-4xl">
      {/* Sticky header + category tabs — only the content below scrolls */}
      <SiteHeader showCategories searchDefaultValue={searchParams.q} activeCategory={searchParams.category} />

      <div className="px-4 py-6 md:px-6 md:py-8">

      <StoryBar groups={storyGroups} />

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

      {/* Posts feed */}
      {!isFiltered && posts.length > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className="text-sm font-semibold text-white/70">Posts</h2>
          {posts.map((post) => {
            const media = (post.post_media ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
            const likeArr = post.likes ?? [];
            const commentArr = post.comments ?? [];
            return (
              <PostCard
                key={post.id}
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
            );
          })}
        </div>
      )}

      {/* Product feed */}
      <h2 className="mb-4 text-sm font-semibold text-white/70">
        {isFiltered ? `Results${searchParams.q ? ` for "${searchParams.q}"` : ""}` : "Latest products"}
      </h2>

      {!products || products.length === 0 ? (
        <p className="text-sm text-white/40">
          {isFiltered ? "No products match your search." : "No products published yet."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => {
            const images = (p.product_images as { url: string; sort_order: number }[] | null) ?? [];
            const thumb = [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
            const store = p.stores as unknown as { store_name: string; slug: string; verified: boolean } | null;
            return (
              <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-surface/60 transition-colors hover:border-primary/40">
                {user && <SaveButton productId={p.id} initialSaved={savedIds.has(p.id)} />}
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
                  {store && (
                    <Link
                      href={`/store/${store.slug}`}
                      className="mb-1 flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70"
                    >
                      {store.store_name}
                      {store.verified && <ShieldCheck className="h-3 w-3 text-accent" />}
                    </Link>
                  )}
                  <Link href={`/product/${p.slug}`}>
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-sm font-semibold text-accent">${p.price}</p>
                      {p.compare_at_price && (
                        <p className="text-xs text-white/30 line-through">${p.compare_at_price}</p>
                      )}
                    </div>
                  </Link>
                  {user && <QuickActions productId={p.id} storeId={p.store_id} hasAiAssistant={aiEnabledStoreIds.has(p.store_id)} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="h-16 md:hidden" aria-hidden />
      </div>
      <MobileBottomNav isLoggedIn={Boolean(user)} cartCount={cartCount} favoritesCount={savedIds.size} chatUnreadCount={chatUnreadCount} />
    </main>
  );
}
