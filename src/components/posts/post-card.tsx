import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, MessageCircle, ShoppingBag } from "lucide-react";
import { LikeButton } from "./like-button";
import { CommentSection } from "./comment-section";
import { startConversation } from "@/lib/actions/chat";

type Post = {
  id: string;
  content: string;
  created_at: string;
  store: { id: string; store_name: string; slug: string; logo_url: string | null; verified: boolean; seller_id: string } | null;
  media: { url: string }[];
  product: { name: string; slug: string; price: number } | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  comments: { id: string; content: string; created_at: string; user_id: string; parent_id: string | null; author_name: string }[];
};

export function PostCard({
  post,
  currentUserId,
  isLoggedIn,
  canModerate,
  isSponsored = false,
}: {
  post: Post;
  currentUserId: string | null;
  isLoggedIn: boolean;
  canModerate: boolean;
  isSponsored?: boolean;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-surface/60 p-4">
      {isSponsored && (
        <span className="mb-2 inline-block rounded-full bg-warning/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
          Sponsored
        </span>
      )}
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link href={post.store ? `/store/${post.store.slug}` : "#"} className="flex min-w-0 items-center gap-2.5">
          <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-white/5">
            {post.store?.logo_url ? (
              <Image src={post.store.logo_url} alt="" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-brand-gradient text-xs font-bold">
                {post.store?.store_name.charAt(0).toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-sm font-medium">
              {post.store?.store_name ?? "Unknown store"}
              {post.store?.verified && <ShieldCheck className="h-3.5 w-3.5 text-accent" />}
            </p>
            <p className="text-xs text-white/40">{new Date(post.created_at).toLocaleDateString()}</p>
          </div>
        </Link>
        {post.store && currentUserId && currentUserId !== post.store.seller_id && (
          <form action={startConversation.bind(null, post.store.id)}>
            <button
              type="submit"
              className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium hover:bg-white/10"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Chat
            </button>
          </form>
        )}
      </div>

      <p className="mb-3 whitespace-pre-wrap text-sm text-white/90">{post.content}</p>

      {post.media.length > 0 && (
        <div className={post.media.length > 1 ? "mb-3 grid max-w-sm grid-cols-2 gap-1.5" : "mb-3 max-w-sm"}>
          {post.media.map((m) => (
            <div key={m.url} className="aspect-square overflow-hidden rounded-xl bg-white/5">
              <Image src={m.url} alt="" width={400} height={400} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {post.product && (
        <Link
          href={`/product/${post.product.slug}`}
          className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm hover:bg-white/[0.06]"
        >
          <span className="flex min-w-0 items-center gap-2">
            <ShoppingBag className="h-4 w-4 flex-shrink-0 text-white/40" />
            <span className="truncate">{post.product.name}</span>
          </span>
          <span className="flex-shrink-0 rounded-full bg-accent/15 px-2.5 py-1 text-sm font-semibold text-accent">
            ${post.product.price.toFixed(2)}
          </span>
        </Link>
      )}

      <div className="flex items-center gap-3 border-t border-white/5 pt-2">
        <LikeButton postId={post.id} initialLiked={post.likedByMe} initialCount={post.likeCount} />
        <CommentSection
          postId={post.id}
          comments={post.comments}
          commentCount={post.commentCount}
          currentUserId={currentUserId}
          canModerate={canModerate}
          isLoggedIn={isLoggedIn}
        />
      </div>
    </div>
  );
}
