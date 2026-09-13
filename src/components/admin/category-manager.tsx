"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, ImagePlus, ChevronRight } from "lucide-react";
import { createCategory, updateCategoryFields, deleteCategory } from "@/lib/actions/admin-plans";
import { uploadPublicFile } from "@/lib/storage";
import { colorForIndex, PRESET_CATEGORY_ICONS } from "@/lib/category-visuals";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

type PanelState =
  | { mode: "add-parent" }
  | { mode: "add-child"; parentId: string }
  | { mode: "edit"; category: Category };

export function CategoryManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const topLevel = useMemo(() => categories.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order), [categories]);
  const childrenByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const c of categories) {
      if (!c.parent_id) continue;
      const list = map.get(c.parent_id) ?? [];
      list.push(c);
      map.set(c.parent_id, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.sort_order - b.sort_order);
    return map;
  }, [categories]);

  const [selectedId, setSelectedId] = useState<string | null>(topLevel[0]?.id ?? null);
  const [panel, setPanel] = useState<PanelState | null>(null);

  const selected = topLevel.find((c) => c.id === selectedId) ?? topLevel[0] ?? null;
  const selectedIndex = selected ? topLevel.findIndex((c) => c.id === selected.id) : -1;
  const children = selected ? childrenByParent.get(selected.id) ?? [] : [];

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Products in it become uncategorized.")) return;
    await deleteCategory(id);
    if (id === selectedId) setSelectedId(topLevel.find((c) => c.id !== id)?.id ?? null);
  }

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      {/* Sidebar: top-level categories */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
        <button
          onClick={() => setPanel({ mode: "add-parent" })}
          className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-gradient px-3 py-2 text-xs font-semibold text-white shadow-glow"
        >
          <Plus className="h-3.5 w-3.5" /> Add Parent Category
        </button>
        <div className="space-y-1">
          {topLevel.map((c, i) => {
            const isActive = c.id === selected?.id;
            const color = colorForIndex(i);
            const subCount = (childrenByParent.get(c.id) ?? []).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
                  isActive ? "bg-primary/15 text-white" : "text-white/60 hover:bg-white/5 hover:text-white/90"
                )}
              >
                <span className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm", color.bg)}>
                  {c.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.icon_url} alt="" className="h-4 w-4 object-contain [filter:brightness(0)_invert(1)]" />
                  ) : (
                    c.icon || "🏷️"
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.name}</span>
                  <span className="block text-[11px] text-white/35">{subCount} subcategories</span>
                </span>
                {isActive && <ChevronRight className="h-4 w-4 flex-shrink-0 text-white/40" />}
              </button>
            );
          })}
          {topLevel.length === 0 && <p className="px-2.5 py-4 text-center text-xs text-white/30">No categories yet — add one above.</p>}
        </div>
      </div>

      {/* Main panel: selected category + its sub-categories */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        {selected ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <span className={cn("flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-xl", colorForIndex(selectedIndex).bg)}>
                  {selected.icon_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.icon_url} alt="" className="h-7 w-7 object-contain [filter:brightness(0)_invert(1)]" />
                  ) : (
                    selected.icon || "🏷️"
                  )}
                </span>
                <div>
                  <p className="text-lg font-bold text-white">{selected.name}</p>
                  <p className="text-xs text-white/40">{children.length} sub-categories</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPanel({ mode: "edit", category: selected })}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => setPanel({ mode: "add-child", parentId: selected.id })}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white shadow-glow"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Child Category
                </button>
              </div>
            </div>

            <p className="mb-3 text-sm font-semibold text-white/70">Child Categories ({selected.name})</p>
            {children.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-white/30">
                No sub-categories yet. Add one to help shoppers narrow down "{selected.name}".
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {children.map((child, i) => (
                  <div key={child.id} className="group relative flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                    <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => setPanel({ mode: "edit", category: child })}
                        className="rounded-full bg-white/10 p-1 text-white/60 hover:text-white"
                        aria-label="Edit"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button onClick={() => handleDelete(child.id)} className="rounded-full bg-danger/80 p-1 text-white" aria-label="Delete">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <span className={cn("flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-xl shadow-md", colorForIndex(selectedIndex + i + 1).bg)}>
                      {child.icon_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={child.icon_url} alt="" className="h-6 w-6 object-contain [filter:brightness(0)_invert(1)]" />
                      ) : (
                        child.icon || "🏷️"
                      )}
                    </span>
                    <div>
                      <p className="truncate text-sm font-semibold text-white">{child.name}</p>
                      <p className="text-[11px] text-white/35">{counts[child.id] ?? 0} products</p>
                      {!child.is_active && <p className="text-[10px] font-medium text-warning">Inactive</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="py-12 text-center text-sm text-white/30">Add a parent category to get started.</p>
        )}
      </div>

      {panel && (
        <CategoryPanel
          panel={panel}
          topLevel={topLevel}
          defaultParentId={selected?.id}
          onClose={() => setPanel(null)}
          onSaved={(newId) => {
            setPanel(null);
            if (panel.mode === "add-child" && newId) setSelectedId(panel.parentId);
          }}
        />
      )}
    </div>
  );
}

function CategoryPanel({
  panel,
  topLevel,
  defaultParentId,
  onClose,
  onSaved,
}: {
  panel: PanelState;
  topLevel: Category[];
  defaultParentId?: string;
  onClose: () => void;
  onSaved: (newId?: string) => void;
}) {
  const isEdit = panel.mode === "edit";
  const editing = isEdit ? panel.category : null;
  const isAddChild = panel.mode === "add-child";

  const [name, setName] = useState(editing?.name ?? "");
  const [parentId, setParentId] = useState<string>(editing?.parent_id ?? (isAddChild ? panel.parentId : "") ?? "");
  const [iconTab, setIconTab] = useState<"choose" | "upload">("choose");
  const [icon, setIcon] = useState(editing?.icon ?? "🏷️");
  const [iconUrl, setIconUrl] = useState<string | null>(editing?.icon_url ?? null);
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = isEdit ? "Edit Category" : isAddChild ? "Add Child Category" : "Add Parent Category";
  const subtitle = isEdit
    ? `Update "${editing?.name}"`
    : isAddChild
      ? `Create a new child category under ${topLevel.find((t) => t.id === panel.parentId)?.name ?? "this category"}`
      : "Create a new top-level category";

  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPublicFile("category-icons", editing?.id ?? crypto.randomUUID(), file);
      setIconUrl(url);
    } catch {
      alert("Failed to upload icon image.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit && editing) {
        await updateCategoryFields(editing.id, {
          name: name.trim(),
          icon: iconUrl ? null : icon,
          icon_url: iconUrl,
          parent_id: parentId || null,
          is_active: isActive,
        });
        onSaved(editing.id);
      } else {
        const formData = new FormData();
        formData.set("name", name.trim());
        if (iconUrl) formData.set("icon_url", iconUrl);
        else formData.set("icon", icon);
        if (parentId) formData.set("parent_id", parentId);
        formData.set("sort_order", "0");
        await createCategory(formData);
        onSaved(parentId || "new");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto border-l border-white/10 bg-surface p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-xs text-white/40">{subtitle}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-white/60">
              {isAddChild ? "Child Category Name" : "Category Name"} <span className="text-danger">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
            />
          </div>

          {!isAddChild && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-white/60">Parent Category</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-primary"
              >
                <option value="">— top level —</option>
                {topLevel
                  .filter((t) => t.id !== editing?.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-white/60">Icon</label>
            <div className="mb-2 flex gap-2">
              <button
                onClick={() => setIconTab("choose")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium",
                  iconTab === "choose" ? "border-primary bg-primary/15 text-white" : "border-white/10 text-white/50 hover:bg-white/5"
                )}
              >
                Choose Icon
              </button>
              <label
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium",
                  iconTab === "upload" ? "border-primary bg-primary/15 text-white" : "border-white/10 text-white/50 hover:bg-white/5"
                )}
              >
                <ImagePlus className="h-3.5 w-3.5" /> Upload Icon
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onClick={() => setIconTab("upload")}
                  onChange={handleIconUpload}
                />
              </label>
            </div>

            {iconTab === "choose" ? (
              <div className="grid grid-cols-6 gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2">
                {PRESET_CATEGORY_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setIcon(emoji);
                      setIconUrl(null);
                    }}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors",
                      !iconUrl && icon === emoji ? "bg-primary/25 ring-1 ring-primary" : "hover:bg-white/10"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/15 p-3">
                {uploading ? (
                  <p className="text-xs text-white/40">Uploading…</p>
                ) : iconUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={iconUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    <button onClick={() => setIconUrl(null)} className="text-xs text-danger hover:underline">
                      Remove
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-white/40">No image uploaded yet — use the button above.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2.5">
            <span className="text-sm font-medium text-white/70">Status</span>
            <button
              onClick={() => setIsActive((v) => !v)}
              className={cn("relative h-6 w-11 rounded-full transition-colors", isActive ? "bg-brand-gradient" : "bg-white/15")}
              aria-label="Toggle active"
            >
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", isActive ? "translate-x-5" : "translate-x-0.5")} />
            </button>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-brand-gradient py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
