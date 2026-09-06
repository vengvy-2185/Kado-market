"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { uploadPublicFile } from "@/lib/storage";import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { createPost } from "@/lib/actions/posts";

type Product = { id: string; name: string };

export function NewPostForm({ storeId, products }: { storeId: string; products: Product[] }) {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadPublicFile("post-media", `${storeId}`, file);
        setImages((imgs) => [...imgs, url]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    formData.set("images", JSON.stringify(images));
    try {
      await createPost(formData);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Card className="space-y-4">
        <Textarea name="content" rows={4} required placeholder="What's new at your store?" />

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

        <div>
          <input type="file" accept="image/*" multiple onChange={handleImagePick} className="text-sm text-white/70" />
          {uploading && <p className="mt-1 text-xs text-white/40">Uploading...</p>}
          {images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={url} className="relative">
                  <Image src={url} alt="" width={72} height={72} className="h-18 w-18 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((imgs) => imgs.filter((_, idx) => idx !== i))}
                    className="absolute -right-2 -top-2 rounded-full bg-danger p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" loading={submitting || uploading} className="w-full">
        Publish post
      </Button>
    </form>
  );
}
