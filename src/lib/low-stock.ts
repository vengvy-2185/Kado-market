import { createAdminClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";

/**
 * Call this after any stock-reducing event (order placed). Uses the admin
 * client because the caller is often a customer's session, which has no
 * RLS access to update products.low_stock_alerted or read the seller's
 * store_settings — this is a system-level side effect, not a
 * customer-facing action.
 */
export async function checkAndNotifyLowStock(productId: string) {
  try {
    const admin = createAdminClient();
    const { data: product } = await admin
      .from("products")
      .select("id, name, stock, low_stock_threshold, low_stock_alerted, store_id")
      .eq("id", productId)
      .single();
    if (!product) return;

    if (product.stock <= product.low_stock_threshold) {
      if (!product.low_stock_alerted) {
        const { data: settingsRow } = await admin.from("store_settings").select("settings").eq("store_id", product.store_id).maybeSingle();
        const tg = settingsRow?.settings as Record<string, unknown> | undefined;
        const botToken = tg?.telegram_bot_token as string | undefined;
        const chatId = tg?.telegram_chat_id as string | undefined;
        if (botToken && chatId) {
          await sendTelegramMessage(
            botToken,
            chatId,
            `⚠️ <b>Low stock alert</b>\n${product.name} has only ${product.stock} left (threshold: ${product.low_stock_threshold}).`
          );
        }
        await admin.from("products").update({ low_stock_alerted: true }).eq("id", productId);
      }
    } else if (product.low_stock_alerted) {
      // restocked above the threshold — reset so a future drop alerts again
      await admin.from("products").update({ low_stock_alerted: false }).eq("id", productId);
    }
  } catch {
    // best-effort — never let this break checkout
  }
}
