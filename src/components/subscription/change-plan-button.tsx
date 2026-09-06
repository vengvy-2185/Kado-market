"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { changeStorePlan } from "@/lib/actions/subscription";
import type { BillingCycle } from "@/lib/types/database.types";

export function ChangePlanButton({ planId, label }: { planId: string; label: string }) {
  const [isPending, startTransition] = useTransition();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-1 rounded-full border border-white/10 bg-white/5 p-0.5 text-[11px]">
        {(["monthly", "yearly"] as BillingCycle[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setBillingCycle(c)}
            className={`rounded-full px-2 py-1 ${billingCycle === c ? "bg-brand-gradient text-white" : "text-white/50"}`}
          >
            {c === "monthly" ? "Monthly" : "Yearly"}
          </button>
        ))}
      </div>
      <Button
        variant="outline"
        className="w-full"
        loading={isPending}
        onClick={() => startTransition(() => changeStorePlan(planId, billingCycle))}
      >
        {label}
      </Button>
    </div>
  );
}
