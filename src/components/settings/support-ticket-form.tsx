"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSupportTicket } from "@/lib/actions/support";

export function SupportTicketForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      await createSupportTicket(formData);
      setSent(true);
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required placeholder="e.g. My store isn't showing up" />
      </div>
      <div>
        <Label htmlFor="message">Describe the problem</Label>
        <Textarea id="message" name="message" rows={4} required />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {sent && <p className="text-sm text-success">Sent! We'll reply here once an admin responds.</p>}
      <Button type="submit" loading={submitting}>
        Submit to admin
      </Button>
    </form>
  );
}
