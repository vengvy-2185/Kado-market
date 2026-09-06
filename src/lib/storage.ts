import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a file to a Supabase Storage bucket under the given folder and
 * returns its public URL. Bucket policies (0006_storage_buckets.sql) enforce
 * that the folder prefix matches a store/user the caller actually owns —
 * this helper just builds the path, the database enforces who's allowed.
 */
export async function uploadPublicFile(
  bucket: "avatars" | "store-logos" | "store-covers" | "product-images" | "post-media" | "story-media" | "chat-attachments",
  folder: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
