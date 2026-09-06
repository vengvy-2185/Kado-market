"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadPublicFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { createStory } from "@/lib/actions/stories";
import type { StoryMediaType } from "@/lib/types/database.types";

type Product = { id: string; name: string };

export function NewStoryForm({ storeId, products }: { storeId: string; products: Product[] }) {
  const [mediaType, setMediaType] = useState<StoryMediaType>("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadPublicFile("story-media", storeId, file);
      setMediaUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    formData.set("media_type", mediaType);
    formData.set("media_url", mediaUrl);
    try {
      await createStory(formData);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Card className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">Story type</label>
          <Select value={mediaType} onChange={(e) => setMediaType(e.target.value as StoryMediaType)}>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="text">Text only</option>
          </Select>
        </div>

        {mediaType === "text" ? (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Text</label>
            <Textarea name="text_content" rows={4} required placeholder="Share something with your followers..." />
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept={mediaType === "video" ? "video/*" : "image/*"}
              onChange={handleFilePick}
              className="text-sm text-white/70"
            />
            {uploading && <p className="mt-1 text-xs text-white/40">Uploading...</p>}
            {mediaUrl && mediaType === "image" && (
              <Image src={mediaUrl} alt="" width={120} height={120} className="mt-3 h-32 w-24 rounded-xl object-cover" />
            )}
            {mediaUrl && mediaType === "video" && (
              <video src={mediaUrl} className="mt-3 h-32 w-24 rounded-xl object-cover" muted />
            )}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">Caption (optional)</label>
          <Textarea name="caption" rows={2} />
        </div>

        {products.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Link a product (optional)</label>
            <Select name="product_id" defaultValue="">
              <option value="">None</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <p className="text-xs text-white/40">Stories disappear automatically after 24 hours.</p>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" loading={submitting || uploading} className="w-full">
        Post story
      </Button>
    </form>
  );
}
