import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";

// Telegram sends updates here once the webhook URL is registered with
// @BotFather / the setWebhook API call (see README for setup steps).
export async function POST(request: Request) {
  const update = await request.json().catch(() => null);
  const message = update?.message;
  const chatId: number | undefined = message?.chat?.id;
  const text: string | undefined = message?.text;

  if (!chatId || !text?.startsWith("/start ")) {
    return NextResponse.json({ ok: true });
  }

  const code = text.replace("/start ", "").trim();
  const admin = createAdminClient();

  const { data: settingsRow } = await admin
    .from("store_settings")
    .select("id, store_id, settings")
    .eq("settings->>telegram_link_code", code)
    .maybeSingle();

  if (!settingsRow) {
    await sendTelegramMessage(String(chatId), "This link code is invalid or has expired. Please generate a new one from your KADO MARKET dashboard.");
    return NextResponse.json({ ok: true });
  }

  const settings = { ...(settingsRow.settings as Record<string, unknown>) };
  delete settings.telegram_link_code;
  settings.telegram_chat_id = String(chatId);

  await admin.from("store_settings").update({ settings }).eq("id", settingsRow.id);

  await sendTelegramMessage(String(chatId), "✅ Connected! You'll now receive order notifications here from your KADO MARKET store.");

  return NextResponse.json({ ok: true });
}
