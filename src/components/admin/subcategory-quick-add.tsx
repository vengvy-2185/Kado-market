"use client";

import { useRef, useState } from "react";
import { Plus, ImagePlus, X } from "lucide-react";
import { createCategory } from "@/lib/actions/admin-plans";
import { uploadPublicFile } from "@/lib/storage";

const inputClass = "w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm md:py-1";

/**
 * Sits under each top-level category row so an admin can add a
 * sub-category (e.g. "Snacks" under "Food") in one place, with an icon,
 * instead of scrolling up to the general "add category" form and picking
 * the parent from a dropdown.
 */
export function SubCategoryQuickAdd({ parentId, parentName }: { parentId: string; parentName: string }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPublicFile("category-icons", crypto.randomUUID(), file);
      setIconUrl(url);
    } catch {
      alert("Failed to upload icon image.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      await createCategory(formData);
      formRef.current?.reset();
      setIconUrl(null);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sub-category.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="ml-4 flex items-center gap-1 py-1.5 text-xs text-white/40 hover:text-white/70 md:ml-6"
      >
        <Plus className="h-3 w-3" /> Add sub-category under {parentName}
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="ml-4 mb-2 flex flex-wrap items-end gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2 md:ml-6"
    >
      <input type="hidden" name="parent_id" value={parentId} />
      <input type="hidden" name="icon_url" value={iconUrl ?? ""} />
      <div>
        {iconUrl ? (
          <div className="relative h-8 w-8">
            <img src={iconUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
            <button type="button" onClick={() => setIconUrl(null)} className="absolute -right-1 -top-1 rounded-full bg-danger p-0.5" aria-label="Remove icon">
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <input name="icon" placeholder="🏷️" className={`${inputClass} w-14 text-center`} />
            <label className="flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/20 text-white/40 hover:border-white/40 hover:text-white/60">
              <ImagePlus className="h-3.5 w-3.5" />
              <input type="file" accept="image/*" onChange={handleIconUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        )}
      </div>
      <input name="name" placeholder="Sub-category name" required className={`${inputClass} w-40`} />
      <input name="sort_order" type="number" placeholder="Order" defaultValue={0} className={`${inputClass} w-16`} />
      <button type="submit" disabled={submitting} className="rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
        {submitting ? "Adding…" : "Add"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="px-2 py-1.5 text-xs text-white/40 hover:text-white/70">
        Cancel
      </button>
      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </form>
  );
}
