"use server";

import { revalidatePath } from "next/cache";
import { getMyStoreOrRedirect } from "@/lib/store";
import { chunkText } from "@/lib/ai/chunk";

const TEXT_EXTRACTABLE_TYPES = ["text/plain", "text/csv", "text/markdown", "application/json"];
const TEXT_EXTRACTABLE_EXTENSIONS = [".txt", ".csv", ".md", ".json"];

export async function uploadKnowledgeDocument(formData: FormData) {
  const { supabase, store } = await getMyStoreOrRedirect();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Please choose a file.");

  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  const canExtract = TEXT_EXTRACTABLE_TYPES.includes(file.type) || TEXT_EXTRACTABLE_EXTENSIONS.includes(ext);

  // Store the raw file for the record either way (private bucket, owner-only)
  const path = `${store.id}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("ai-documents").upload(path, file);
  if (uploadError) throw new Error(uploadError.message);
  const { data: urlData } = supabase.storage.from("ai-documents").getPublicUrl(path);

  let extractedText = "";
  if (canExtract) {
    extractedText = await file.text();
  }

  const { data: doc, error: docError } = await supabase
    .from("ai_documents")
    .insert({
      store_id: store.id,
      file_name: file.name,
      file_type: file.type || ext,
      storage_url: urlData.publicUrl,
      status: canExtract ? "processed" : "unsupported",
      char_count: extractedText.length,
    })
    .select()
    .single();

  if (docError || !doc) throw new Error(docError?.message ?? "Failed to save document.");

  if (canExtract && extractedText.trim()) {
    const chunks = chunkText(extractedText);
    if (chunks.length > 0) {
      await supabase.from("ai_document_chunks").insert(
        chunks.map((content, i) => ({
          document_id: doc.id,
          store_id: store.id,
          content,
          chunk_index: i,
        }))
      );
    }
  }

  revalidatePath("/dashboard/ai-assistant");
}

export async function deleteKnowledgeDocument(documentId: string) {
  const { supabase } = await getMyStoreOrRedirect();
  const { error } = await supabase.from("ai_documents").delete().eq("id", documentId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/ai-assistant");
}
