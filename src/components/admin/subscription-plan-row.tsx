"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { updateSubscriptionPlanField, deleteSubscriptionPlan } from "@/lib/actions/admin-plans";
import type { Database } from "@/lib/types/database.types";

type Plan = Database["public"]["Tables"]["subscription_plans"]["Row"];

export function SubscriptionPlanRow({ plan }: { plan: Plan }) {
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState(plan);

  function save(field: string, value: string | number | boolean) {
    setLocal((prev) => ({ ...prev, [field]: value }));
    startTransition(() => updateSubscriptionPlanField(plan.id, field, value));
  }

  return (
    <div className="grid grid-cols-12 items-center gap-2 border-b border-white/5 py-2 text-sm last:border-0">
      <input
        className="col-span-3 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        defaultValue={local.name}
        onBlur={(e) => e.target.value !== local.name && save("name", e.target.value)}
      />
      <input
        type="number"
        step="0.01"
        className="col-span-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        defaultValue={local.price_monthly}
        onBlur={(e) => Number(e.target.value) !== local.price_monthly && save("price_monthly", Number(e.target.value))}
      />
      <input
        type="number"
        step="0.01"
        className="col-span-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        defaultValue={local.price_yearly}
        onBlur={(e) => Number(e.target.value) !== local.price_yearly && save("price_yearly", Number(e.target.value))}
      />
      <input
        type="number"
        className="col-span-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        defaultValue={local.product_limit ?? ""}
        placeholder="∞"
        onBlur={(e) => save("product_limit", e.target.value ? Number(e.target.value) : null)}
      />
      <label className="col-span-1 flex justify-center">
        <input type="checkbox" defaultChecked={local.is_active} onChange={(e) => save("is_active", e.target.checked)} />
      </label>
      <div className="col-span-2 flex justify-center gap-1">
        {(["ai_enabled", "analytics_enabled", "stories_enabled", "boost_enabled"] as const).map((f) => (
          <label key={f} title={f} className="flex items-center">
            <input type="checkbox" defaultChecked={local[f]} onChange={(e) => save(f, e.target.checked)} />
          </label>
        ))}
      </div>
      <button
        onClick={() => startTransition(() => deleteSubscriptionPlan(plan.id))}
        disabled={isPending}
        className="col-span-1 flex justify-center text-white/30 hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
