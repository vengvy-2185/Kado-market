"use client";

import { useState } from "react";
import { X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRatingInput } from "./star-rating-input";
import { createReview } from "@/lib/actions/reviews";
import { uploadPublicFile } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

export function ReviewForm({
  orderItemId,
  productId,
  storeId,
  productName,
  onDone,
}: {
  orderItemId: string;
  productId: string;
  storeId: string;
  productName: string;
  onDone?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handlePickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - images.length);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await createClient().auth.getUser();
      if (!user) throw new Error("Please log in.");
      const urls = await Promise.all(files.map((f) => uploadPublicFile("review-images", user.id, f)));
      setImages((prev) => [...prev, ...urls].slice(0, 3));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please choose a star rating.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.set("order_item_id", orderItemId);
    formData.set("product_id", productId);
    formData.set("store_id", storeId);
    formData.set("rating", String(rating));
    formData.set("comment", comment);
    formData.set("images", images.join(","));
    try {
      await createReview(formData);
      setDone(true);
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return <p className="rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success">Thanks for your review!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-sm font-medium">Rate {productName}</p>
      <StarRatingInput value={rating} onChange={setRating} />
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience with this product (optional)"
        rows={2}
      />

      <div className="flex flex-wrap items-center gap-2">
        {images.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
              aria-label="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < 3 && (
          <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/20 text-white/40 hover:border-white/40 hover:text-white/60">
            <ImagePlus className="h-4 w-4" />
            <span className="text-[10px]">{uploading ? "..." : "Add photo"}</span>
            <input type="file" accept="image/*" multiple onChange={handlePickImages} className="hidden" disabled={uploading} />
          </label>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" loading={submitting} variant="outline">
        Submit review
      </Button>
    </form>
  );
}
