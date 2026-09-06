import Link from "next/link";
import Image from "next/image";
import { Clapperboard } from "lucide-react";
import { getMyStoreOrRedirect } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteStoryButton } from "@/components/stories/delete-story-button";

export default async function SellerStoriesPage() {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { data: stories } = await supabase
    .from("stories")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  const now = Date.now();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stories</h1>
        <Link href="/dashboard/stories/new">
          <Button>+ New story</Button>
        </Link>
      </div>

      {!stories || stories.length === 0 ? (
        <Card>
          <p className="text-white/60">No stories yet — share something that disappears in 24 hours.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {stories.map((s) => {
            const expired = new Date(s.expires_at).getTime() < now;
            return (
              <Card key={s.id} className="flex items-center gap-3">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/5">
                  {s.media_type === "image" && s.media_url ? (
                    <Image src={s.media_url} alt="" width={56} height={56} className="h-14 w-14 object-cover" />
                  ) : s.media_type === "video" && s.media_url ? (
                    <video src={s.media_url} className="h-14 w-14 object-cover" muted />
                  ) : (
                    <Clapperboard className="h-5 w-5 text-white/30" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm">{s.caption || s.text_content || "Story"}</p>
                  <p className="text-xs text-white/40">
                    {expired ? "Expired" : `Expires ${new Date(s.expires_at).toLocaleString()}`}
                  </p>
                </div>
                <DeleteStoryButton storyId={s.id} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
