"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createReview(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const orderItemId = String(formData.get("order_item_id") ?? "");
  const productId = String(formData.get("product_id") ?? "");
  const storeId = String(formData.get("store_id") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim() || null;

  if (!orderItemId || !productId || !storeId) throw new Error("Missing review target.");
  if (rating < 1 || rating > 5) throw new Error("Please choose a star rating.");

  const { error } = await supabase.from("reviews").insert({
    order_item_id: orderItemId,
    product_id: productId,
    store_id: storeId,
    customer_id: user.id,
    rating,
    comment,
  });

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      throw new Error("You've already reviewed this item.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/account/orders");
  revalidatePath("/dashboard/reviews");
}

export async function updateReview(reviewId: string, rating: number, comment: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (rating < 1 || rating > 5) throw new Error("Please choose a star rating.");

  const { error } = await supabase.from("reviews").update({ rating, comment: comment.trim() || null }).eq("id", reviewId);
  if (error) throw new Error(error.message);

  revalidatePath("/account/orders");
}

export async function deleteReview(reviewId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) throw new Error(error.message);

  revalidatePath("/account/orders");
  revalidatePath("/dashboard/reviews");
}

export async function replyToReview(reviewId: string, reply: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = reply.trim();
  if (!trimmed) throw new Error("Reply can't be empty.");

  const { data: review, error: fetchError } = await supabase.from("reviews").select("customer_id, product_id").eq("id", reviewId).single();
  if (fetchError || !review) throw new Error("Review not found.");

  const { error } = await supabase
    .from("reviews")
    .update({ seller_reply: trimmed, seller_replied_at: new Date().toISOString() })
    .eq("id", reviewId);

  if (error) throw new Error(error.message);

  await supabase.rpc("notify_user", {
    p_user_id: review.customer_id,
    p_type: "review_reply",
    p_title: "The seller replied to your review",
    p_message: trimmed.slice(0, 140),
    p_link: `/product/${review.product_id}`,
  });

  revalidatePath("/dashboard/reviews");
}
