"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { uploadKnowledgeDocument } from "@/lib/actions/ai-documents";

export function UploadDocumentForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      await uploadKnowledgeDocument(formData);
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-wrap items-center gap-3">
      <input
        type="file"
        name="file"
        required
        accept=".txt,.csv,.md,.json,.pdf,.doc,.docx"
        className="text-sm text-white/70"
      />
      <Button type="submit" loading={submitting}>
        Upload
      </Button>
      {error && <p className="w-full text-sm text-danger">{error}</p>}
    </form>
  );
}
