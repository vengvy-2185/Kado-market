"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { verifyBakongPayment } from "@/lib/actions/orders";

export function BakongVerifyButton({ orderId, verifiedAt }: { orderId: string; verifiedAt: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(Boolean(verifiedAt));

  function handleCheck() {
    setResult(null);
    startTransition(async () => {
      const res = await verifyBakongPayment(orderId);
      if (res.status === "success") {
        setIsSuccess(true);
        setResult(`Confirmed: $${res.amount.toFixed(2)} ${res.currency} received from ${res.fromAccountId}.`);
      } else if (res.status === "not_found") {
        setResult("Not paid yet — scan the QR above, then check again.");
      } else {
        setResult(res.message);
      }
    });
  }

  if (isSuccess) {
    return (
      <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
        <ShieldCheck className="h-3.5 w-3.5" /> Payment verified via Bakong{verifiedAt ? ` on ${new Date(verifiedAt).toLocaleDateString()}` : ""}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={handleCheck}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        {isPending ? "Checking with Bakong..." : "Check Payment Status"}
      </button>
      {result && <p className="text-center text-xs text-white/50">{result}</p>}
    </div>
  );
}
