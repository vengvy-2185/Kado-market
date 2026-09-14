"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { CheckCircle2, Loader2, Clock } from "lucide-react";
import { verifyBoostPayment } from "@/lib/actions/boost";

export function BoostVerifyButton({ campaignId, onVerified }: { campaignId: string; onVerified: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [, forceTick] = useState(0);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!cooldownUntil) return;
    const interval = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const secondsLeft = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)) : 0;
  const onCooldown = secondsLeft > 0;

  function handleCheck(silent = false) {
    if (!silent) setResult(null);
    startTransition(async () => {
      const res = await verifyBoostPayment(campaignId);
      if (res.status === "success") {
        verifiedRef.current = true;
        onVerified();
      } else if (silent) {
        // stay quiet during background polling
      } else if (res.status === "not_found") {
        setResult("Not paid yet — scan the QR above, then check again.");
        setCooldownUntil(Date.now() + 60_000);
      } else if (res.status === "rate_limited") {
        setResult(res.message);
        setCooldownUntil(Date.now() + 60_000);
      } else {
        setResult(res.message);
      }
    });
  }

  // Same idea as order verification: quietly re-check in the background
  // so the boost activates itself the moment the scan clears, instead of
  // requiring the seller to keep clicking (or, worse, letting them just
  // click a button that activates it without ever paying).
  useEffect(() => {
    const interval = setInterval(() => {
      if (!verifiedRef.current) handleCheck(true);
    }, 20_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={() => handleCheck(false)}
        disabled={isPending || onCooldown}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : onCooldown ? (
          <Clock className="h-3.5 w-3.5" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" />
        )}
        {isPending ? "Checking with Bakong..." : onCooldown ? `Wait ${secondsLeft}s` : "Check Payment Status"}
      </button>
      <p className="text-center text-[11px] text-white/30">Auto-checking in the background — no need to keep clicking.</p>
      {result && <p className="text-center text-xs text-white/50">{result}</p>}
    </div>
  );
}
