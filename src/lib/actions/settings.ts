"use server";

import { revalidatePath } from "next/cache";
import { getMyStoreOrRedirect } from "@/lib/store";
import { fetchLatestTelegramChatId, fetchBotUsername, sendTelegramMessage } from "@/lib/telegram";

async function getSettingsRow(supabase: Awaited<ReturnType<typeof getMyStoreOrRedirect>>["supabase"], storeId: string) {
  const { data } = await supabase.from("store_settings").select("*").eq("store_id", storeId).maybeSingle();
  return data;
}

export async function saveTelegramToken(formData: FormData) {
  const { supabase, store } = await getMyStoreOrRedirect();
  const botToken = String(formData.get("telegram_bot_token") ?? "").trim();
  if (!botToken) throw new Error("Please enter your bot token.");

  const botUsername = await fetchBotUsername(botToken);
  if (!botUsername) throw new Error("That doesn't look like a valid bot token — double check it and try again.");

  const existing = await getSettingsRow(supabase, store.id);
  const settings = {
    ...(existing?.settings as Record<string, unknown> | undefined),
    telegram_bot_token: botToken,
    telegram_bot_username: botUsername,
  };
  delete settings.telegram_chat_id; // a new token means we need to re-detect the chat

  const { error } = await supabase.from("store_settings").upsert({ store_id: store.id, settings }, { onConflict: "store_id" });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings");
}

export async function detectTelegramChat() {
  const { supabase, store } = await getMyStoreOrRedirect();
  const existing = await getSettingsRow(supabase, store.id);
  const settings = { ...(existing?.settings as Record<string, unknown> | undefined) };
  const botToken = settings.telegram_bot_token as string | undefined;

  if (!botToken) throw new Error("Save your bot token first.");

  const found = await fetchLatestTelegramChatId(botToken);
  if (!found) {
    throw new Error(
      "No message found yet. Open your bot in Telegram and press Start (or send any message) first, then try again."
    );
  }

  settings.telegram_chat_id = found.chatId;
  const { error } = await supabase.from("store_settings").upsert({ store_id: store.id, settings }, { onConflict: "store_id" });
  if (error) throw new Error(error.message);

  await sendTelegramMessage(
    botToken,
    found.chatId,
    `✅ Connected successfully! You'll now receive order notifications here.\nភ្ជាប់បានជោគជ័យ! អ្នកនឹងទទួលបានការជូនដំណឹងបញ្ជាទិញនៅទីនេះ។`
  );

  revalidatePath("/dashboard/settings");
}

export async function disconnectTelegram() {
  const { supabase, store } = await getMyStoreOrRedirect();
  const existing = await getSettingsRow(supabase, store.id);
  const settings = { ...(existing?.settings as Record<string, unknown> | undefined) };
  delete settings.telegram_chat_id;
  delete settings.telegram_bot_token;

  const { error } = await supabase.from("store_settings").upsert({ store_id: store.id, settings }, { onConflict: "store_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings");
}

export async function saveKhqrInfo(formData: FormData) {
  const { supabase, store } = await getMyStoreOrRedirect();

  const bakongAccountId = String(formData.get("bakong_account_id") ?? "").trim() || null;
  const bakongPhone = String(formData.get("bakong_phone") ?? "").trim() || null;

  const { error } = await supabase.from("stores").update({ bakong_account_id: bakongAccountId, bakong_phone: bakongPhone }).eq("id", store.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings");
}
