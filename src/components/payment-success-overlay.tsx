"use client";

import { CheckCircle2, User, DollarSign, CreditCard, Hash, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function PaymentSuccessOverlay({
  merchantName,
  fromName,
  amount,
  currency,
  transactionId,
  onClose,
  closeLabel = "Close",
}: {
  merchantName: string;
  fromName: string;
  amount: number;
  currency: string;
  transactionId: string;
  onClose: () => void;
  closeLabel?: string;
}) {
  const rows = [
    { icon: User, label: "From", value: fromName },
    { icon: DollarSign, label: "Amount", value: `$${amount.toFixed(2)} ${currency}` },
    { icon: CreditCard, label: "Payment Method", value: "Bakong API" },
    { icon: Hash, label: "Transaction ID", value: transactionId },
    { icon: Clock, label: "Date & Time", value: new Date().toLocaleString() },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-surface p-6 text-center shadow-2xl">
        <button onClick={onClose} className="absolute right-3 top-3 rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white" aria-label="Close">
          <X className="h-4 w-4" />
        </button>

        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
          {/* confetti flecks */}
          {[
            "left-0 top-2 h-2.5 w-2.5 rotate-12 bg-pink-400",
            "right-0 top-4 h-2 w-2 -rotate-12 bg-sky-400",
            "left-1 bottom-0 h-2 w-2 rotate-45 bg-violet-400",
            "right-2 bottom-1 h-2.5 w-1.5 -rotate-6 bg-fuchsia-400",
          ].map((cls, i) => (
            <span key={i} className={cn("absolute rounded-sm", cls)} />
          ))}
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
            <CheckCircle2 className="h-9 w-9 text-success" />
          </span>
        </div>

        <h2 className="mb-1 text-2xl font-extrabold">
          Payment <span className="text-primary">Successful!</span>
        </h2>
        <p className="mb-5 text-sm text-white/50">Your payment has been received. Thank you for your support!</p>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left">
          <p className="mb-3 border-b border-white/10 pb-3 text-sm font-semibold text-white">{merchantName}</p>
          <div className="space-y-2.5">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-white/40">
                  <row.icon className="h-3.5 w-3.5" /> {row.label}
                </span>
                <span className="font-medium text-white">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-brand-gradient py-3 text-sm font-semibold text-white shadow-glow"
        >
          {closeLabel}
        </button>
      </div>
    </div>
  );
}
