import { notFound } from "next/navigation";
import { getMyStoreOrRedirect } from "@/lib/store";
import { PostCard } from "@/components/posts/post-card";
import { DeletePostButton } from "@/components/posts/delete-post-button";

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

export default async function SellerPostDetailPage({ params }: { params: { id: string } }) {
  const { supabase, user, store } = await getMyStoreOrRedirect();

  const { data } = await supabase
    .from("posts")
    .select(
      "id, content, created_at, store_id, stores(id, store_name, slug, logo_url, verified, seller_id), post_media(url, sort_order), products(name, slug, price), likes(user_id), comments(id, content, created_at, user_id, parent_id, profiles(full_name))"
    )
    .eq("id", params.id)
    .eq("store_id", store.id)
    .single();

  const post = data as unknown as RawPost | null;
  if (!post) notFound();

  const media = (post.post_media ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const likeArr = post.likes ?? [];
  const commentArr = post.comments ?? [];

  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:px-6 md:py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Post</h1>
        <DeletePostButton postId={post.id} />
      </div>

      <PostCard
        currentUserId={user.id}
        isLoggedIn
        canModerate
        post={{
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          store: post.stores,
          media: media.map((m) => ({ url: m.url })),
          product: post.products,
          likeCount: likeArr.length,
          likedByMe: likeArr.some((l) => l.user_id === user.id),
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
    </div>
  );
}
