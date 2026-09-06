"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Finds the existing conversation between the current customer and a store,
 * or creates one, then redirects to it. Sellers open conversations from
 * their /chat inbox instead — they never "start" one via this action.
 */
export async function startConversation(storeId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/store`);

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("customer_id", user.id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (existing) redirect(`/chat/${existing.id}`);

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ customer_id: user.id, store_id: storeId })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Could not start conversation.");

  redirect(`/chat/${created.id}`);
}

export async function sendMessage(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const conversationId = String(formData.get("conversation_id"));
  const content = String(formData.get("content") ?? "").trim();
  const replyToId = String(formData.get("reply_to_id") ?? "") || null;
  const attachmentUrl = String(formData.get("attachment_url") ?? "") || null;
  const locationLatRaw = formData.get("location_lat");
  const locationLngRaw = formData.get("location_lng");
  const locationLat = locationLatRaw ? Number(locationLatRaw) : null;
  const locationLng = locationLngRaw ? Number(locationLngRaw) : null;
  if (!content && !attachmentUrl && locationLat === null) return;

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content || null,
    reply_to_id: replyToId,
    attachment_url: attachmentUrl,
    location_lat: locationLat,
    location_lng: locationLng,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/chat/${conversationId}`);
  revalidatePath("/chat");
}

export async function editMessage(messageId: string, content: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message can't be empty.");

  const { error } = await supabase
    .from("messages")
    .update({ content: trimmed, edited_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("sender_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/chat", "layout");
}

export async function deleteMessage(messageId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("messages").delete().eq("id", messageId).eq("sender_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/chat", "layout");
}
