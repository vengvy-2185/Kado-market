"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { updateAiPlanField, deleteAiPlan } from "@/lib/actions/admin-plans";
import type { Database } from "@/lib/types/database.types";

type Plan = Database["public"]["Tables"]["ai_plans"]["Row"];

const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm md:py-1";
const labelClass = "mb-1 block text-[10px] uppercase tracking-wide text-white/30 md:hidden";

export function AiPlanRow({ plan }: { plan: Plan }) {
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState(plan);

  function save(field: string, value: string | number | boolean) {
    setLocal((prev) => ({ ...prev, [field]: value }));
    startTransition(() => updateAiPlanField(plan.id, field, value));
  }

  return (
    <div className="grid grid-cols-2 gap-3 border-b border-white/5 py-3 text-sm last:border-0 md:grid-cols-12 md:items-center md:gap-2 md:py-2">
      <div className="col-span-2 md:col-span-4">
        <label className={labelClass}>Name</label>
        <input className={inputClass} defaultValue={local.name} onBlur={(e) => e.target.value !== local.name && save("name", e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className={labelClass}>Price</label>
        <input
          type="number"
          step="0.01"
          className={inputClass}
          defaultValue={local.price}
          onBlur={(e) => Number(e.target.value) !== local.price && save("price", Number(e.target.value))}
        />
      </div>
      <div className="md:col-span-2">
        <label className={labelClass}>Months</label>
        <input
          type="number"
          className={inputClass}
          defaultValue={local.duration_months}
          onBlur={(e) => Number(e.target.value) !== local.duration_months && save("duration_months", Number(e.target.value))}
        />
      </div>
      <div className="md:col-span-2">
        <label className={labelClass}>Message limit</label>
        <input
          type="number"
          className={inputClass}
          defaultValue={local.message_limit}
          onBlur={(e) => Number(e.target.value) !== local.message_limit && save("message_limit", Number(e.target.value))}
        />
      </div>
      <div className="flex items-center md:col-span-1 md:justify-center">
        <label className="flex items-center gap-1.5 text-xs text-white/50 md:text-[0px]">
          <input type="checkbox" defaultChecked={local.is_active} onChange={(e) => save("is_active", e.target.checked)} />
          <span className="md:hidden">Active</span>
        </label>
      </div>
      <div className="flex justify-end md:col-span-1 md:justify-center">
        <button
          onClick={() => startTransition(() => deleteAiPlan(plan.id))}
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
