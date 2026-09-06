"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { cn } from "@/lib/utils";

export function SaveButton({
  productId,
  initialSaved,
  variant = "overlay",
}: {
  productId: string;
  initialSaved: boolean;
  variant?: "overlay" | "inline";
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSaved((s) => !s);
    startTransition(() => {
      toggleFavorite(productId, saved);
    });
  }

  if (variant === "inline") {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors",
          saved ? "border-highlight/40 bg-highlight/10 text-highlight" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
        )}
      >
        <Heart className={cn("h-4 w-4", saved && "fill-highlight")} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={saved ? "Remove from favorites" : "Add to favorites"}
      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform hover:scale-110"
    >
      <Heart className={cn("h-4 w-4", saved ? "fill-highlight text-highlight" : "text-white")} />
    </button>
  );
}
