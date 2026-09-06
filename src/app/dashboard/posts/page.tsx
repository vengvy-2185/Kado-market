import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { getMyStoreOrRedirect } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeletePostButton } from "@/components/posts/delete-post-button";

export default async function SellerPostsPage() {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, content, created_at, post_media(url, sort_order), likes(count), comments(count)")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Link href="/dashboard/posts/new">
          <Button>+ New post</Button>
        </Link>
      </div>

      {!posts || posts.length === 0 ? (
        <Card>
          <p className="text-white/60">No posts yet — share an update or new arrival with your followers.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const media = (post.post_media as { url: string; sort_order: number }[] | null) ?? [];
            const thumb = [...media].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
            const likeCount = (post.likes as unknown as { count: number }[] | null)?.[0]?.count ?? 0;
            const commentCount = (post.comments as unknown as { count: number }[] | null)?.[0]?.count ?? 0;
            return (
              <Card key={post.id} className="flex items-center gap-3">
                <Link href={`/dashboard/posts/${post.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  {thumb && (
                    <Image src={thumb} alt="" width={64} height={64} className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm">{post.content}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> {commentCount}
                      </span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
                <DeletePostButton postId={post.id} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
