"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { updateBoostPlanField, deleteBoostPlan } from "@/lib/actions/admin-plans";
import type { Database } from "@/lib/types/database.types";

type Plan = Database["public"]["Tables"]["boost_plans"]["Row"];

export function BoostPlanRow({ plan }: { plan: Plan }) {
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState(plan);

  function save(field: string, value: string | number | boolean) {
    setLocal((prev) => ({ ...prev, [field]: value }));
    startTransition(() => updateBoostPlanField(plan.id, field, value));
  }

  return (
    <div className="grid grid-cols-12 items-center gap-2 border-b border-white/5 py-2 text-sm last:border-0">
      <input
        type="number"
        className="col-span-4 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        defaultValue={local.duration_days}
        onBlur={(e) => Number(e.target.value) !== local.duration_days && save("duration_days", Number(e.target.value))}
      />
      <input
        type="number"
        step="0.01"
        className="col-span-4 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        defaultValue={local.price}
        onBlur={(e) => Number(e.target.value) !== local.price && save("price", Number(e.target.value))}
      />
      <label className="col-span-3 flex items-center gap-2">
        <input type="checkbox" defaultChecked={local.is_active} onChange={(e) => save("is_active", e.target.checked)} />
        <span className="text-xs text-white/50">Active</span>
      </label>
      <button
        onClick={() => startTransition(() => deleteBoostPlan(plan.id))}
        disabled={isPending}
        className="col-span-1 flex justify-center text-white/30 hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
