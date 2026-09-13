"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Trash2, ImagePlus, X } from "lucide-react";
import { updateCategoryField, deleteCategory } from "@/lib/actions/admin-plans";
import { uploadPublicFile } from "@/lib/storage";
import type { Database } from "@/lib/types/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm md:py-1";
const labelClass = "mb-1 block text-[10px] uppercase tracking-wide text-white/30 md:hidden";

export function CategoryRow({
  category,
  topLevelCategories = [],
  isSubcategory = false,
}: {
  category: Category;
  topLevelCategories?: { id: string; name: string }[];
  isSubcategory?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState(category);
  const [uploading, setUploading] = useState(false);

  function save(field: string, value: string | number | boolean | null) {
    setLocal((prev) => ({ ...prev, [field]: value }));
    startTransition(() => updateCategoryField(category.id, field, value));
  }

  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPublicFile("category-icons", category.id, file);
      save("icon_url", url);
    } catch {
      alert("Failed to upload icon image.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div
      className={`grid grid-cols-2 gap-3 border-b border-white/5 py-3 text-sm last:border-0 md:grid-cols-[repeat(14,minmax(0,1fr))] md:items-center md:gap-2 md:py-2 ${
        isSubcategory ? "md:pl-4 bg-white/[0.015]" : ""
      }`}
    >
      <div className="md:col-span-2">
        <label className={labelClass}>Icon</label>
        {local.icon_url ? (
          <div className="relative mx-auto h-9 w-9">
            <Image src={local.icon_url} alt="" fill className="rounded-full object-cover" />
            <button
              onClick={() => save("icon_url", null)}
              className="absolute -right-1 -top-1 rounded-full bg-danger p-0.5"
              aria-label="Remove icon image"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <input
              className={`${inputClass} text-center`}
              defaultValue={local.icon ?? ""}
              placeholder="🏷️"
              onBlur={(e) => e.target.value !== local.icon && save("icon", e.target.value)}
            />
            <label className="flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/20 text-white/40 hover:border-white/40 hover:text-white/60">
              <ImagePlus className="h-3.5 w-3.5" />
              <input type="file" accept="image/*" onChange={handleIconUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        )}
      </div>
      <div className="col-span-2 md:col-span-3">
        <label className={labelClass}>Name</label>
        <input
          className={inputClass}
          defaultValue={local.name}
          onBlur={(e) => e.target.value !== local.name && save("name", e.target.value)}
        />
      </div>
      <div className="col-span-2 md:col-span-3">
        <label className={labelClass}>Parent (sub-category of)</label>
        <select
          className={inputClass}
          value={local.parent_id ?? ""}
          onChange={(e) => save("parent_id", e.target.value || null)}
        >
          <option value="">— top level —</option>
          {topLevelCategories
            .filter((c) => c.id !== category.id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
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
      <div className="col-span-2 flex items-center justify-between md:col-span-1 md:justify-center">
        <label className="flex items-center gap-1.5 text-xs text-white/50">
          <input type="checkbox" defaultChecked={local.is_active} onChange={(e) => save("is_active", e.target.checked)} />
          Active
        </label>
      </div>
      <div className="col-span-2 flex items-center justify-end md:col-span-1 md:justify-center">
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
