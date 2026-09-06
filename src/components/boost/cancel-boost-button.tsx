"use client";

import { useTransition } from "react";
import { cancelBoostCampaign } from "@/lib/actions/boost";

export function CancelBoostButton({ campaignId }: { campaignId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => cancelBoostCampaign(campaignId))}
      disabled={isPending}
      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-danger/10 hover:text-danger"
    >
      Cancel
    </button>
  );
}
