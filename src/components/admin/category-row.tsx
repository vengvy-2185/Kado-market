"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { updateCategoryField, deleteCategory } from "@/lib/actions/admin-plans";
import type { Database } from "@/lib/types/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm md:py-1";
const labelClass = "mb-1 block text-[10px] uppercase tracking-wide text-white/30 md:hidden";

export function CategoryRow({ category }: { category: Category }) {
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState(category);

  function save(field: string, value: string | number | boolean) {
    setLocal((prev) => ({ ...prev, [field]: value }));
    startTransition(() => updateCategoryField(category.id, field, value));
  }

  return (
    <div className="grid grid-cols-2 gap-3 border-b border-white/5 py-3 text-sm last:border-0 md:grid-cols-12 md:items-center md:gap-2 md:py-2">
      <div className="md:col-span-2">
        <label className={labelClass}>Icon</label>
        <input
          className={`${inputClass} text-center`}
          defaultValue={local.icon ?? ""}
          placeholder="🏷️"
          onBlur={(e) => e.target.value !== local.icon && save("icon", e.target.value)}
        />
      </div>
      <div className="col-span-2 md:col-span-4">
        <label className={labelClass}>Name</label>
        <input className={inputClass} defaultValue={local.name} onBlur={(e) => e.target.value !== local.name && save("name", e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className={labelClass}>Slug</label>
        <p className="truncate rounded-lg bg-white/[0.03] px-2 py-1.5 text-xs text-white/30 md:bg-transparent md:px-0 md:py-0">/{local.slug}</p>
      </div>
      <div className="md:col-span-2">
        <label className={labelClass}>Sort order</label>
        <input
          type="number"
          className={inputClass}
          defaultValue={local.sort_order}
          onBlur={(e) => Number(e.target.value) !== local.sort_order && save("sort_order", Number(e.target.value))}
        />
      </div>
      <div className="col-span-2 flex items-center justify-between md:col-span-2 md:justify-center">
        <label className="flex items-center gap-1.5 text-xs text-white/50">
          <input type="checkbox" defaultChecked={local.is_active} onChange={(e) => save("is_active", e.target.checked)} />
          Active
        </label>
        <button
          onClick={() => startTransition(() => deleteCategory(category.id))}
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
