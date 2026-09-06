"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteKnowledgeDocument } from "@/lib/actions/ai-documents";

export function DeleteDocumentButton({ documentId }: { documentId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => deleteKnowledgeDocument(documentId))}
      disabled={isPending}
      className="flex-shrink-0 rounded-lg p-1.5 text-white/30 hover:bg-danger/10 hover:text-danger"
      aria-label="Delete document"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
