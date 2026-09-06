"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMyStoreOrRedirect } from "@/lib/store";
import type { StoryMediaType } from "@/lib/types/database.types";

export async function createStory(formData: FormData) {
  const { supabase, store } = await getMyStoreOrRedirect();

  const mediaType = String(formData.get("media_type") ?? "image") as StoryMediaType;
  const mediaUrl = String(formData.get("media_url") ?? "") || null;
  const caption = String(formData.get("caption") ?? "").trim() || null;
  const textContent = String(formData.get("text_content") ?? "").trim() || null;
  const productId = String(formData.get("product_id") ?? "") || null;

  if (mediaType !== "text" && !mediaUrl) throw new Error("Please upload an image or video.");
  if (mediaType === "text" && !textContent) throw new Error("Write something for your text story.");

  const { error } = await supabase.from("stories").insert({
    store_id: store.id,
    media_type: mediaType,
    media_url: mediaUrl,
    caption,
    text_content: textContent,
    product_id: productId,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/stories");
  revalidatePath("/");
  redirect("/dashboard/stories");
}

export async function deleteStory(storyId: string) {
  const { supabase } = await getMyStoreOrRedirect();
  const { error } = await supabase.from("stories").delete().eq("id", storyId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/stories");
  revalidatePath("/");
}
