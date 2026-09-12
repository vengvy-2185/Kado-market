"use client";

import { useState, useTransition } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { followStore, unfollowStore } from "@/lib/actions/store-followers";
import { cn } from "@/lib/utils";

export function FollowButton({
  storeId,
  storeSlug,
  isLoggedIn,
  initialFollowing,
}: {
  storeId: string;
  storeSlug: string;
  isLoggedIn: boolean;
  initialFollowing: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);

  function toggle() {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    const next = !following;
    setFollowing(next); // optimistic — this is a low-stakes action
    startTransition(async () => {
      try {
        if (next) await followStore(storeId, storeSlug);
        else await unfollowStore(storeId, storeSlug);
      } catch {
        setFollowing(!next); // revert on failure
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:opacity-60",
        following
          ? "border border-white/15 bg-white/5 text-white/70 hover:bg-danger/10 hover:text-danger"
          : "bg-brand-gradient text-white hover:brightness-110 hover:shadow-[0_0_16px_rgba(168,85,247,0.5)]"
      )}
    >
      {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      {following ? "Following" : "Follow"}
    </button>
  );
}
