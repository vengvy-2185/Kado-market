"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { replyToTicket } from "@/lib/actions/support";
import type { SupportTicketStatus } from "@/lib/types/database.types";

export function TicketReplyForm({ ticketId, currentReply, currentStatus }: { ticketId: string; currentReply: string | null; currentStatus: SupportTicketStatus }) {
  const [reply, setReply] = useState(currentReply ?? "");
  const [status, setStatus] = useState<SupportTicketStatus>(currentStatus);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSaved(false);
    try {
      await replyToTicket(ticketId, reply, status);
      setSaved(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 border-t border-white/10 pt-3">
      <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Write a reply to the seller..." />
      <div className="flex items-center gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value as SupportTicketStatus)} className="w-auto">
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
        </Select>
        <Button type="submit" loading={submitting} variant="outline">
          Save
        </Button>
        {saved && <span className="text-xs text-success">Saved.</span>}
      </div>
    </form>
  );
}
