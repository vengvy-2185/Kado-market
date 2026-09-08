"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { updateSubscriptionPlanField, deleteSubscriptionPlan } from "@/lib/actions/admin-plans";
import type { Database } from "@/lib/types/database.types";

type Plan = Database["public"]["Tables"]["subscription_plans"]["Row"];

const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm md:py-1";
const labelClass = "mb-1 block text-[10px] uppercase tracking-wide text-white/30 md:hidden";

export function SubscriptionPlanRow({ plan }: { plan: Plan }) {
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState(plan);

  function save(field: string, value: string | number | boolean) {
    setLocal((prev) => ({ ...prev, [field]: value }));
    startTransition(() => updateSubscriptionPlanField(plan.id, field, value));
  }

  return (
    <div className="grid grid-cols-2 gap-3 border-b border-white/5 py-3 text-sm last:border-0 md:grid-cols-12 md:items-center md:gap-2 md:py-2">
      <div className="col-span-2 md:col-span-3">
        <label className={labelClass}>Name</label>
        <input className={inputClass} defaultValue={local.name} onBlur={(e) => e.target.value !== local.name && save("name", e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>$/month</label>
        <input
          type="number"
          step="0.01"
          className={inputClass}
          defaultValue={local.price_monthly}
          onBlur={(e) => Number(e.target.value) !== local.price_monthly && save("price_monthly", Number(e.target.value))}
        />
      </div>
      <div className="md:col-span-2">
        <label className={labelClass}>$/year</label>
        <input
          type="number"
          step="0.01"
          className={inputClass}
          defaultValue={local.price_yearly}
          onBlur={(e) => Number(e.target.value) !== local.price_yearly && save("price_yearly", Number(e.target.value))}
        />
      </div>
      <div className="md:col-span-1">
        <label className={labelClass}>Product limit</label>
        <input
          type="number"
          className={inputClass}
          defaultValue={local.product_limit ?? ""}
          placeholder="∞"
          onBlur={(e) => save("product_limit", e.target.value ? Number(e.target.value) : null)}
        />
      </div>
      <div className="flex items-center gap-2 md:col-span-1 md:justify-center">
        <label className="flex items-center gap-1.5 text-xs text-white/50 md:text-[0px]">
          <input type="checkbox" defaultChecked={local.is_active} onChange={(e) => save("is_active", e.target.checked)} />
          <span className="md:hidden">Active</span>
        </label>
      </div>
      <div className="col-span-2 flex flex-wrap gap-x-4 gap-y-1 md:col-span-2 md:justify-center md:gap-1">
        {(["ai_enabled", "analytics_enabled", "stories_enabled", "boost_enabled"] as const).map((f) => (
          <label key={f} title={f} className="flex items-center gap-1.5 text-xs text-white/50 md:text-[0px]">
            <input type="checkbox" defaultChecked={local[f]} onChange={(e) => save(f, e.target.checked)} />
            <span className="md:hidden">{f.replace("_enabled", "")}</span>
          </label>
        ))}
      </div>
      <div className="col-span-2 flex justify-end md:col-span-1 md:justify-center">
        <button
          onClick={() => startTransition(() => deleteSubscriptionPlan(plan.id))}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1 text-white/40 hover:text-danger md:border-0 md:p-0"
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-xs md:hidden">Delete</span>
        </button>
      </div>
    </div>
  );
}
