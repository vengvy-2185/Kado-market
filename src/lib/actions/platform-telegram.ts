"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, isAdminRole } from "@/lib/require-admin";
import { fetchBotUsername, fetchLatestTelegramChatId, sendTelegramMessage } from "@/lib/telegram";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const role = await getUserRole(supabase, user.id);
  if (!isAdminRole(role)) throw new Error("Not authorized.");
  return supabase;
}

export async function savePlatformTelegramToken(formData: FormData) {
  const supabase = await requireAdmin();
  const botToken = String(formData.get("telegram_bot_token") ?? "").trim();
  if (!botToken) throw new Error("Please enter a bot token.");

  const botUsername = await fetchBotUsername(botToken);
  if (!botUsername) throw new Error("That doesn't look like a valid bot token — double check it and try again.");

  const { error } = await supabase
    .from("platform_settings")
    .update({ telegram_bot_token: botToken, telegram_bot_username: botUsername, telegram_chat_id: null })
    .eq("id", 1);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}

export async function detectPlatformTelegramChat() {
  const supabase = await requireAdmin();
  const { data: settings } = await supabase.from("platform_settings").select("telegram_bot_token").eq("id", 1).single();
  const botToken = settings?.telegram_bot_token;
  if (!botToken) throw new Error("Save your bot token first.");

  const found = await fetchLatestTelegramChatId(botToken);
  if (!found) {
    throw new Error("No message found yet. Open your bot in Telegram and press Start first, then try again.");
  }

  const { error } = await supabase.from("platform_settings").update({ telegram_chat_id: found.chatId }).eq("id", 1);
  if (error) throw new Error(error.message);

  await sendTelegramMessage(
    botToken,
    found.chatId,
    `✅ Connected! You'll now receive a notification here whenever a seller subscribes to a plan or boosts a post.\nភ្ជាប់បានជោគជ័យ! អ្នកនឹងទទួលបានការជូនដំណឹងនៅទីនេះ។`
  );

  revalidatePath("/admin/settings");
}

export async function disconnectPlatformTelegram() {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("platform_settings")
    .update({ telegram_bot_token: null, telegram_bot_username: null, telegram_chat_id: null })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
}
