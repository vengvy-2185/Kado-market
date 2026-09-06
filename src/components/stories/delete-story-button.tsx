"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteStory } from "@/lib/actions/stories";

export function DeleteStoryButton({ storyId }: { storyId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm("Delete this story?")) return;
        startTransition(() => deleteStory(storyId));
      }}
      disabled={isPending}
      className="flex-shrink-0 rounded-lg p-1.5 text-white/30 hover:bg-danger/10 hover:text-danger"
      aria-label="Delete story"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
