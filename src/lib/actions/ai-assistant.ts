"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateStoreAssistantAnswer } from "@/lib/ai/provider";

const FALLBACK_NOT_FOUND_EN =
  "I'm sorry, I don't have that information from this store. Please contact the seller directly.";
const FALLBACK_NOT_FOUND_KM =
  "សូមទោស ខ្ញុំមិនមានព័ត៌មាននេះពីហាងនេះទេ។ សូមទាក់ទងអ្នកលក់ដោយផ្ទាល់។";
const FALLBACK_UNAVAILABLE =
  "The AI assistant is temporarily unavailable. Please try again later or use \"Chat with Seller\" instead.";
const FALLBACK_NO_SUBSCRIPTION =
  "This store hasn't enabled the AI Assistant. Please use \"Chat with Seller\" instead.";
const FALLBACK_LIMIT_REACHED =
  "This store's AI Assistant has reached its message limit for this month. Please use \"Chat with Seller\" instead.";

function containsKhmer(text: string) {
  return /[\u1780-\u17FF]/.test(text);
}

function currentMonthStart() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

async function getOrCreateThread(supabase: ReturnType<typeof createClient>, storeId: string, customerId: string) {
  const { data: existing } = await supabase
    .from("ai_threads")
    .select("id")
    .eq("store_id", storeId)
    .eq("customer_id", customerId)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("ai_threads")
    .insert({ store_id: storeId, customer_id: customerId })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Could not start AI conversation.");
  return created.id;
}

export async function getOrStartAiThread(storeId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const threadId = await getOrCreateThread(supabase, storeId, user.id);
  redirect(`/ai-chat/${threadId}`);
}

export async function askAiAssistant(threadId: string, question: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = question.trim();
  if (!trimmed) return;

  const { data: thread } = await supabase.from("ai_threads").select("*, stores(id, store_name)").eq("id", threadId).single();
  if (!thread) throw new Error("Conversation not found.");
  const store = thread.stores as unknown as { id: string; store_name: string };

  await supabase.from("ai_messages").insert({ thread_id: threadId, role: "user", content: trimmed });

  // 1. Subscription check
  const { data: sub } = await supabase
    .from("ai_subscriptions")
    .select("*")
    .eq("store_id", store.id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .maybeSingle();

  if (!sub) {
    await supabase.from("ai_messages").insert({ thread_id: threadId, role: "assistant", content: FALLBACK_NO_SUBSCRIPTION });
    revalidatePath(`/ai-chat/${threadId}`);
    return;
  }

  // 2. Usage limit check (uses admin client — ai_usage has no client write policy)
  const admin = createAdminClient();
  const month = currentMonthStart();
  const { data: plan } = await supabase.from("ai_plans").select("message_limit").eq("id", sub.plan_id).single();
  const messageLimit = plan?.message_limit ?? 500;

  const { data: usageRow } = await admin.from("ai_usage").select("*").eq("store_id", store.id).eq("month", month).maybeSingle();
  const currentUsage = usageRow?.messages_used ?? 0;

  if (currentUsage >= messageLimit) {
    await supabase.from("ai_messages").insert({ thread_id: threadId, role: "assistant", content: FALLBACK_LIMIT_REACHED });
    revalidatePath(`/ai-chat/${threadId}`);
    return;
  }

  // 3. Retrieve relevant knowledge base chunks (real Postgres full-text search)
  const { data: chunks } = await supabase.rpc("search_store_knowledge", {
    p_store_id: store.id,
    p_query: trimmed,
    p_limit: 5,
  });

  const context = (chunks ?? []).map((c: { content: string }) => c.content).join("\n\n---\n\n");

  let answer: string;
  if (!context) {
    answer = containsKhmer(trimmed) ? FALLBACK_NOT_FOUND_KM : FALLBACK_NOT_FOUND_EN;
  } else {
    let generated: string | null = null;
    try {
      generated = await generateStoreAssistantAnswer({ storeName: store.store_name, context, question: trimmed });
    } catch (err) {
      console.error("[AI Assistant] generateStoreAssistantAnswer threw:", err);
      generated = null; // network/provider error — fall through to the unavailable message below
    }
    answer = generated ?? FALLBACK_UNAVAILABLE;
  }

  await supabase.from("ai_messages").insert({ thread_id: threadId, role: "assistant", content: answer });

  // 4. Track usage (admin client bypasses RLS; this is the only writer to ai_usage)
  if (usageRow) {
    await admin.from("ai_usage").update({ messages_used: currentUsage + 1 }).eq("id", usageRow.id);
  } else {
    await admin.from("ai_usage").insert({ store_id: store.id, month, messages_used: 1 });
  }

  revalidatePath(`/ai-chat/${threadId}`);
}

export async function editAiQuestion(messageId: string, content: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message can't be empty.");

  const { error } = await supabase
    .from("ai_messages")
    .update({ content: trimmed })
    .eq("id", messageId)
    .eq("role", "user");

  if (error) throw new Error(error.message);
  revalidatePath("/ai-chat", "layout");
}

export async function deleteAiQuestion(messageId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("ai_messages").delete().eq("id", messageId).eq("role", "user");
  if (error) throw new Error(error.message);
  revalidatePath("/ai-chat", "layout");
}

export async function markAiThreadRead(threadId: string) {
  const supabase = createClient();
  await supabase.rpc("mark_ai_thread_read", { p_thread_id: threadId });
}

export async function clearAiThread(threadId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("clear_ai_thread", { p_thread_id: threadId });
  if (error) throw new Error(error.message);
  revalidatePath(`/ai-chat/${threadId}`);
}
