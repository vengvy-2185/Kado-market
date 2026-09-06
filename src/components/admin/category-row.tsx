"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { updateCategoryField, deleteCategory } from "@/lib/actions/admin-plans";
import type { Database } from "@/lib/types/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export function CategoryRow({ category }: { category: Category }) {
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState(category);

  function save(field: string, value: string | number | boolean) {
    setLocal((prev) => ({ ...prev, [field]: value }));
    startTransition(() => updateCategoryField(category.id, field, value));
  }

  return (
    <div className="grid grid-cols-12 items-center gap-2 border-b border-white/5 py-2 text-sm last:border-0">
      <input
        className="col-span-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center"
        defaultValue={local.icon ?? ""}
        placeholder="🏷️"
        onBlur={(e) => e.target.value !== local.icon && save("icon", e.target.value)}
      />
      <input
        className="col-span-4 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        defaultValue={local.name}
        onBlur={(e) => e.target.value !== local.name && save("name", e.target.value)}
      />
      <span className="col-span-2 truncate text-xs text-white/30">/{local.slug}</span>
      <input
        type="number"
        className="col-span-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        defaultValue={local.sort_order}
        onBlur={(e) => Number(e.target.value) !== local.sort_order && save("sort_order", Number(e.target.value))}
      />
      <label className="col-span-1 flex justify-center">
        <input type="checkbox" defaultChecked={local.is_active} onChange={(e) => save("is_active", e.target.checked)} />
      </label>
      <button
        onClick={() => startTransition(() => deleteCategory(category.id))}
        disabled={isPending}
        className="col-span-1 flex justify-center text-white/30 hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
