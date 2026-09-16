"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { cancelOrderAsBuyer } from "@/lib/actions/orders";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      try {
        await cancelOrderAsBuyer(orderId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't cancel this order.");
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 p-3 text-center">
        <p className="text-xs text-white/70">Cancel this order? You can always place a new one later.</p>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "Cancelling..." : "Yes, cancel it"}
          </button>
          <button onClick={() => setConfirming(false)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5">
            Never mind
          </button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-white/50 hover:border-danger/30 hover:text-danger"
    >
      <XCircle className="h-3.5 w-3.5" />
      Cancel order
    </button>
  );
}
