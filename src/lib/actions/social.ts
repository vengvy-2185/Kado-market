"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function toggleLike(postId: string, currentlyLiked: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (currentlyLiked) {
    await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id);
  } else {
    await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
  }

  revalidatePath("/", "layout");
}

export async function addComment(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const postId = String(formData.get("post_id"));
  const content = String(formData.get("content") ?? "").trim();
  const parentId = String(formData.get("parent_id") ?? "") || null;
  if (!content) throw new Error("Comment can't be empty.");

  const { error } = await supabase.from("comments").insert({ post_id: postId, user_id: user.id, content, parent_id: parentId });
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

export async function deleteComment(commentId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("comments").delete().eq("id", commentId);
  revalidatePath("/", "layout");
}
