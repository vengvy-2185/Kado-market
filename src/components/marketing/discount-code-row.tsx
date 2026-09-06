"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toggleDiscountCode, deleteDiscountCode } from "@/lib/actions/marketing";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database.types";

type DiscountCode = Database["public"]["Tables"]["discount_codes"]["Row"];

export function DiscountCodeRow({ code }: { code: DiscountCode }) {
  const [isPending, startTransition] = useTransition();

  const expired = code.expires_at ? new Date(code.expires_at) < new Date() : false;
  const usedUp = code.usage_limit !== null && code.used_count >= code.usage_limit;
  const effectivelyActive = code.is_active && !expired && !usedUp;

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="min-w-0">
        <p className="font-mono text-sm font-semibold">{code.code}</p>
        <p className="text-xs text-white/40">
          {code.discount_type === "percent" ? `${code.value}% off` : `$${code.value} off`}
          {code.min_order_amount > 0 && ` · min $${code.min_order_amount}`}
          {" · "}
          {code.used_count}
          {code.usage_limit ? `/${code.usage_limit}` : ""} used
          {code.expires_at && ` · expires ${new Date(code.expires_at).toLocaleDateString()}`}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            effectivelyActive ? "bg-success/15 text-success" : "bg-white/10 text-white/40"
          )}
        >
          {expired ? "Expired" : usedUp ? "Used up" : code.is_active ? "Active" : "Disabled"}
        </span>
        <button
          onClick={() => startTransition(() => toggleDiscountCode(code.id, !code.is_active))}
          disabled={isPending}
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
        >
          {code.is_active ? "Disable" : "Enable"}
        </button>
        <button
          onClick={() => startTransition(() => deleteDiscountCode(code.id))}
          disabled={isPending}
          className="rounded-lg p-1.5 text-white/30 hover:bg-danger/10 hover:text-danger"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
