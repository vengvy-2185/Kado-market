"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleLike } from "@/lib/actions/social";
import { cn } from "@/lib/utils";

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((c) => (wasLiked ? c - 1 : c + 1));
    startTransition(() => {
      toggleLike(postId, wasLiked);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition-colors",
        liked ? "text-highlight" : "text-white/50 hover:text-white"
      )}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-highlight")} />
      {count}
    </button>
  );
}
