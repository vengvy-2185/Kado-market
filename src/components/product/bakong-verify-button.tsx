"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { CheckCircle2, Loader2, ShieldCheck, Clock } from "lucide-react";
import { verifyBakongPayment } from "@/lib/actions/orders";
import { PaymentSuccessOverlay } from "@/components/payment-success-overlay";

export function BakongVerifyButton({ orderId, verifiedAt, merchantName }: { orderId: string; verifiedAt: string | null; merchantName: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(Boolean(verifiedAt));
  const [celebrate, setCelebrate] = useState<{ amount: number; currency: string; fromAccountId: string; hash: string } | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [, forceTick] = useState(0);
  const isSuccessRef = useRef(isSuccess);
  isSuccessRef.current = isSuccess;

  // Re-render every second while a cooldown is active so the countdown
  // text stays accurate without the person needing to click anything.
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
      const res = await verifyBakongPayment(orderId);
      if (res.status === "success") {
        setIsSuccess(true);
        setCelebrate({ amount: res.amount, currency: res.currency, fromAccountId: res.fromAccountId, hash: res.hash });
      } else if (silent) {
        // Auto-poll failures ("not paid yet", rate-limited) stay silent —
        // only a real success or a person-initiated click should say
        // anything, otherwise this would nag every 20 seconds.
      } else if (res.status === "not_found") {
        setResult("Not paid yet — scan the QR above, then check again.");
        setCooldownUntil(Date.now() + 60_000); // matches the server's per-order cooldown
      } else if (res.status === "rate_limited") {
        setResult(res.message);
        setCooldownUntil(Date.now() + 60_000);
      } else {
        setResult(res.message);
      }
    });
  }

  // Nobody should have to sit there clicking a button to find out if
  // their own payment went through: while unverified, quietly re-check
  // with the real Bakong API in the background so the page flips itself
  // to "verified" the moment the scan actually clears, with no click and
  // no self-reported "I've paid" the person could click before they
  // actually have.
  useEffect(() => {
    if (isSuccess) return;
    const interval = setInterval(() => {
      if (!isSuccessRef.current) handleCheck(true);
    }, 20_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, orderId]);

  if (isSuccess) {
    return (
      <>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
          <ShieldCheck className="h-3.5 w-3.5" /> Payment verified via Bakong{verifiedAt ? ` on ${new Date(verifiedAt).toLocaleDateString()}` : ""}
        </p>
        {celebrate && (
          <PaymentSuccessOverlay
            merchantName={merchantName}
            fromName={celebrate.fromAccountId}
            amount={celebrate.amount}
            currency={celebrate.currency}
            transactionId={celebrate.hash}
            onClose={() => setCelebrate(null)}
            closeLabel="Back to Order"
          />
        )}
      </>
    );
  }

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
