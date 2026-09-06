"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePost } from "@/lib/actions/posts";

export function DeletePostButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this post?")) return;
    startTransition(() => {
      deletePost(postId);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="flex-shrink-0 self-start rounded-lg p-1.5 text-white/30 hover:bg-danger/10 hover:text-danger"
      aria-label="Delete post"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
