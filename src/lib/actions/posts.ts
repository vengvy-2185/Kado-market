"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMyStoreOrRedirect } from "@/lib/store";

export async function createPost(formData: FormData) {
  const { supabase, user, store } = await getMyStoreOrRedirect();

  const content = String(formData.get("content") ?? "").trim();
  const productId = String(formData.get("product_id") ?? "") || null;
  const imageUrls = JSON.parse(String(formData.get("images") ?? "[]")) as string[];

  if (!content) throw new Error("Write something for your post.");

  const { data: post, error } = await supabase
    .from("posts")
    .insert({ store_id: store.id, author_id: user.id, content, product_id: productId })
    .select()
    .single();

  if (error || !post) throw new Error(error?.message ?? "Failed to create post.");

  if (imageUrls.length > 0) {
    await supabase.from("post_media").insert(
      imageUrls.map((url, i) => ({ post_id: post.id, url, media_type: "image" as const, sort_order: i }))
    );
  }

  revalidatePath("/dashboard/posts");
  revalidatePath("/");
  redirect("/dashboard/posts");
}

export async function deletePost(postId: string) {
  const { supabase } = await getMyStoreOrRedirect();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/posts");
  revalidatePath("/");
  redirect("/dashboard/posts");
}
