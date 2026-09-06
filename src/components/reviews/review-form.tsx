"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRatingInput } from "./star-rating-input";
import { createReview } from "@/lib/actions/reviews";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" loading={submitting} variant="outline">
        Submit review
      </Button>
    </form>
  );
}
