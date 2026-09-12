"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { uploadPublicFile } from "@/lib/storage";
import { saveAllCategoryIcon } from "@/lib/actions/admin-plans";

export function AllCategoryIconForm({ initialIconUrl }: { initialIconUrl: string | null }) {
  const [iconUrl, setIconUrl] = useState(initialIconUrl);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPublicFile("category-icons", "all-category", file);
      setIconUrl(url);
      await saveAllCategoryIcon(url);
    } catch {
      alert("Failed to upload icon image.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemove() {
    setIconUrl(null);
    await saveAllCategoryIcon(null);
  }

  return (
    <Card className="mb-4">
      <h2 className="mb-1 text-sm font-semibold text-white/70">"All" tab icon</h2>
      <p className="mb-3 text-xs text-white/40">
        The "All" tab isn&apos;t a real category, so it needs its own icon here. Uploading an
        image replaces the default 🏷️ emoji; it&apos;s auto-recolored white to match the other
        category circles.
      </p>
      <div className="flex items-center gap-3">
        {iconUrl ? (
          <div className="relative h-12 w-12">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-brand-gradient p-2.5">
              <Image src={iconUrl} alt="" width={28} height={28} className="object-contain [filter:brightness(0)_invert(1)]" />
            </div>
            <button onClick={handleRemove} className="absolute -right-1 -top-1 rounded-full bg-danger p-0.5" aria-label="Remove icon">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-dashed border-white/20 text-white/40 hover:border-white/40 hover:text-white/60">
            <ImagePlus className="h-4 w-4" />
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        )}
        <p className="text-xs text-white/40">{uploading ? "Uploading..." : iconUrl ? "Custom icon set" : "Using default emoji"}</p>
      </div>
    </Card>
  );
}
