"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { updateBoostPlanField, deleteBoostPlan } from "@/lib/actions/admin-plans";
import type { Database } from "@/lib/types/database.types";

type Plan = Database["public"]["Tables"]["boost_plans"]["Row"];

const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm md:py-1";
const labelClass = "mb-1 block text-[10px] uppercase tracking-wide text-white/30 md:hidden";

export function BoostPlanRow({ plan }: { plan: Plan }) {
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState(plan);

  function save(field: string, value: string | number | boolean) {
    setLocal((prev) => ({ ...prev, [field]: value }));
    startTransition(() => updateBoostPlanField(plan.id, field, value));
  }

  return (
    <div className="grid grid-cols-2 gap-3 border-b border-white/5 py-3 text-sm last:border-0 md:grid-cols-12 md:items-center md:gap-2 md:py-2">
      <div className="md:col-span-4">
        <label className={labelClass}>Duration (days)</label>
        <input
          type="number"
          className={inputClass}
          defaultValue={local.duration_days}
          onBlur={(e) => Number(e.target.value) !== local.duration_days && save("duration_days", Number(e.target.value))}
        />
      </div>
      <div className="md:col-span-4">
        <label className={labelClass}>Price</label>
        <input
          type="number"
          step="0.01"
          className={inputClass}
          defaultValue={local.price}
          onBlur={(e) => Number(e.target.value) !== local.price && save("price", Number(e.target.value))}
        />
      </div>
      <div className="col-span-2 flex items-center justify-between md:col-span-3 md:justify-center">
        <label className="flex items-center gap-1.5 text-xs text-white/50">
          <input type="checkbox" defaultChecked={local.is_active} onChange={(e) => save("is_active", e.target.checked)} />
          Active
        </label>
        <button
          onClick={() => startTransition(() => deleteBoostPlan(plan.id))}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1 text-white/40 hover:text-danger md:col-span-1 md:border-0 md:p-0"
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-xs md:hidden">Delete</span>
        </button>
      </div>
    </div>
  );
}
