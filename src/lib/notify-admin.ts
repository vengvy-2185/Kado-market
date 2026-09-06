import { createAdminClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function notifyPlatformAdmin(message: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("platform_settings")
      .select("telegram_bot_token, telegram_chat_id")
      .eq("id", 1)
      .single();

    if (data?.telegram_bot_token && data?.telegram_chat_id) {
      await sendTelegramMessage(data.telegram_bot_token, data.telegram_chat_id, message);
    }
  } catch {
    // best-effort — never let a notification failure break the purchase flow
  }
}
