"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { replyToReview } from "@/lib/actions/reviews";

export function ReviewReplyForm({ reviewId, existingReply }: { reviewId: string; existingReply: string | null }) {
  const [reply, setReply] = useState(existingReply ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSaved(false);
    try {
      await replyToReview(reviewId, reply);
      setSaved(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
      <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={1} placeholder="Reply to this review..." />
      <Button type="submit" loading={submitting} variant="outline">
        {existingReply ? "Update" : "Reply"}
      </Button>
      {saved && <span className="self-center text-xs text-success">Saved</span>}
    </form>
  );
}
