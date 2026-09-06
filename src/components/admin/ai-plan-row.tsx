"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { updateAiPlanField, deleteAiPlan } from "@/lib/actions/admin-plans";
import type { Database } from "@/lib/types/database.types";

type Plan = Database["public"]["Tables"]["ai_plans"]["Row"];

export function AiPlanRow({ plan }: { plan: Plan }) {
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState(plan);

  function save(field: string, value: string | number | boolean) {
    setLocal((prev) => ({ ...prev, [field]: value }));
    startTransition(() => updateAiPlanField(plan.id, field, value));
  }

  return (
    <div className="grid grid-cols-12 items-center gap-2 border-b border-white/5 py-2 text-sm last:border-0">
      <input
        className="col-span-4 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        defaultValue={local.name}
        onBlur={(e) => e.target.value !== local.name && save("name", e.target.value)}
      />
      <input
        type="number"
        step="0.01"
        className="col-span-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        defaultValue={local.price}
        onBlur={(e) => Number(e.target.value) !== local.price && save("price", Number(e.target.value))}
      />
      <input
        type="number"
        className="col-span-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        defaultValue={local.duration_months}
        onBlur={(e) => Number(e.target.value) !== local.duration_months && save("duration_months", Number(e.target.value))}
      />
      <input
        type="number"
        className="col-span-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        defaultValue={local.message_limit}
        onBlur={(e) => Number(e.target.value) !== local.message_limit && save("message_limit", Number(e.target.value))}
      />
      <label className="col-span-1 flex justify-center">
        <input type="checkbox" defaultChecked={local.is_active} onChange={(e) => save("is_active", e.target.checked)} />
      </label>
      <button
        onClick={() => startTransition(() => deleteAiPlan(plan.id))}
        disabled={isPending}
        className="col-span-1 flex justify-center text-white/30 hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
