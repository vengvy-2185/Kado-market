/**
 * Minimal Telegram Bot API wrapper. Each STORE provides its own bot token
 * (created for free via @BotFather — no approval needed), stored on that
 * store's own settings row. sendTelegramMessage never throws so it can be
 * called best-effort from order flows without risking checkout.
 */

export async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<boolean> {
  if (!botToken || !chatId) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Polls Telegram's getUpdates (no webhook / public URL needed) to find the
 * most recent chat that messaged this bot, so we can auto-detect the
 * seller's chat_id right after they press Start on their own bot.
 */
export async function fetchLatestTelegramChatId(botToken: string): Promise<{ chatId: string; firstName: string } | null> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=5`);
    if (!response.ok) return null;
    const data = await response.json();
    const updates = data?.result as { message?: { chat?: { id: number; first_name?: string } } }[] | undefined;
    if (!updates || updates.length === 0) return null;

    const last = updates[updates.length - 1];
    const chat = last?.message?.chat;
    if (!chat) return null;

    return { chatId: String(chat.id), firstName: chat.first_name ?? "there" };
  } catch {
    return null;
  }
}

export async function fetchBotUsername(botToken: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[Telegram] getMe failed: ${response.status} ${response.statusText} — ${body}`);
      return null;
    }
    const data = await response.json();
    if (!data?.ok) {
      console.error(`[Telegram] getMe returned ok:false —`, data);
      return null;
    }
    return data?.result?.username ?? null;
  } catch (err) {
    console.error("[Telegram] getMe threw (likely a network issue reaching api.telegram.org):", err);
    return null;
  }
}
