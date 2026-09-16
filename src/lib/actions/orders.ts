"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types/database.types";
import { sendTelegramMessage } from "@/lib/telegram";
import { checkAndNotifyLowStock } from "@/lib/low-stock";
import { generateKhqr, khqrMd5 } from "@/lib/khqr";
import { checkBakongTransactionByMd5 } from "@/lib/bakong-api";

function randomOrderNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `ORD-${code}`;
}

export async function placeOrder(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const productId = String(formData.get("product_id"));
  const variantId = String(formData.get("variant_id") ?? "") || null;
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1));
  const customerNote = String(formData.get("customer_note") ?? "").trim() || null;

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const addressLine = String(formData.get("address_line") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim() || null;
  const province = String(formData.get("province") ?? "").trim() || null;
  const country = String(formData.get("country") ?? "Cambodia").trim();
  const saveAddress = formData.get("save_address") === "on";

  if (!fullName || !phone || !addressLine) {
    throw new Error("Please fill in the full shipping address.");
  }

  // Load the product fresh (server-side) — never trust price/stock from the client
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, store_id, name, price, stock, status, product_images(url, sort_order)")
    .eq("id", productId)
    .single();

  if (productError || !product) throw new Error("Product not found.");
  if (product.status !== "active") throw new Error("This product is no longer available.");

  let unitPrice = product.price;
  let availableStock = product.stock;
  let variantLabel = "";

  if (variantId) {
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("*")
      .eq("id", variantId)
      .single();
    if (variantError || !variant) throw new Error("Selected variant not found.");
    unitPrice = variant.price ?? product.price;
    availableStock = variant.stock;
    variantLabel = ` (${variant.variant_name})`;
  }

  if (availableStock < quantity) {
    throw new Error("Not enough stock available.");
  }

  const subtotal = Math.round(unitPrice * quantity * 100) / 100;
  const shippingFee = 0; // flat/free for demo mode — real shipping rules are a later phase

  const discountCodeInput = String(formData.get("discount_code") ?? "").trim();
  let discountAmount = 0;
  if (discountCodeInput) {
    const { data: discountResult } = await supabase.rpc("validate_discount_code", {
      p_store_id: product.store_id,
      p_code: discountCodeInput,
      p_subtotal: subtotal,
    });
    discountAmount = Number(discountResult ?? 0);
  }
  const total = Math.max(0, subtotal + shippingFee - discountAmount);

  const images = (product.product_images as { url: string; sort_order: number }[] | null) ?? [];
  const thumbnail = [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;

  // If the store has KHQR configured, generate the exact QR the customer
  // will see and persist it + its MD5 now — the QR embeds a timestamp, so
  // it's different every time it's generated, and Bakong's transaction
  // lookup is keyed on the specific hash that was actually scanned.
  let khqrString: string | null = null;
  let khqrMd5Hash: string | null = null;
  const { data: storeForKhqr } = await supabase
    .from("stores")
    .select("store_name, city, bakong_account_id, bakong_phone")
    .eq("id", product.store_id)
    .single();
  if (storeForKhqr?.bakong_account_id && storeForKhqr?.bakong_phone) {
    khqrString = generateKhqr({
      bakongAccountId: storeForKhqr.bakong_account_id,
      accountInformation: storeForKhqr.bakong_phone,
      merchantName: storeForKhqr.store_name,
      merchantCity: storeForKhqr.city ?? "Phnom Penh",
      amount: total,
      currency: "USD",
    });
    khqrMd5Hash = khqrMd5(khqrString);
  }

  // unique order_number
  let orderNumber = randomOrderNumber();
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase.from("orders").select("id").eq("order_number", orderNumber).maybeSingle();
    if (!existing) break;
    orderNumber = randomOrderNumber();
  }

  // Only go straight to "paid" when there's genuinely no way to verify a
  // real payment (store hasn't configured Bakong) -- a clear fallback,
  // not the normal path. Whenever a real KHQR exists, the order starts
  // pending and only becomes paid once verifyBakongPayment confirms an
  // actual transaction against NBC's API — no more instant "paid" on
  // checkout regardless of whether anything was actually scanned.
  const isPending = Boolean(khqrMd5Hash);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: user.id,
      store_id: product.store_id,
      status: isPending ? "pending" : "paid",
      payment_status: isPending ? "pending" : "success",
      payment_method: isPending ? "bakong" : "demo",
      subtotal,
      shipping_fee: shippingFee,
      total,
      discount_code: discountAmount > 0 ? discountCodeInput.toUpperCase() : null,
      discount_amount: discountAmount,
      shipping_address: { full_name: fullName, phone, address_line: addressLine, city, province, country },
      customer_note: customerNote,
      paid_at: isPending ? null : new Date().toISOString(),
      khqr_string: khqrString,
      khqr_md5: khqrMd5Hash,
    })
    .select()
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? "Failed to create order.");

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    store_id: product.store_id,
    product_id: product.id,
    variant_id: variantId,
    product_name: product.name + variantLabel,
    product_image: thumbnail,
    unit_price: unitPrice,
    quantity,
    subtotal,
  });

  if (itemError) throw new Error(itemError.message);

  if (discountAmount > 0) {
    await supabase.rpc("redeem_discount_code", { p_store_id: product.store_id, p_code: discountCodeInput });
  }

  await checkAndNotifyLowStock(product.id);

  // best-effort Telegram notification — never blocks or fails the order
  const { data: sellerSettings } = await supabase.from("store_settings").select("settings").eq("store_id", product.store_id).maybeSingle();
  const tgSettings = sellerSettings?.settings as Record<string, unknown> | undefined;
  const botToken = tgSettings?.telegram_bot_token as string | undefined;
  const chatId = tgSettings?.telegram_chat_id as string | undefined;
  if (botToken && chatId) {
    const discountLine = discountAmount > 0 ? `\n🏷️ Discount code used: <b>${discountCodeInput.toUpperCase()}</b> (-$${discountAmount.toFixed(2)})` : "";
    const paymentLine = isPending ? "\n⏳ Awaiting KHQR payment" : "\n✅ Demo payment (no real KHQR configured)";
    await sendTelegramMessage(
      botToken,
      chatId,
      `🛎️ <b>New order ${orderNumber}</b>\n${product.name}${variantLabel} × ${quantity}\nTotal: $${total.toFixed(2)}\nBuyer: ${fullName}${discountLine}${paymentLine}`
    );
  }

  // Stock is reserved automatically by the reserve_stock_on_order_item()
  // trigger (see migration 0009) — it inserts into inventory_transactions
  // as a SECURITY DEFINER function, since a customer isn't allowed to write
  // to that table directly (only the owning seller/admin can, per RLS).

  if (saveAddress) {
    await supabase.from("addresses").insert({
      user_id: user.id,
      full_name: fullName,
      phone,
      address_line: addressLine,
      city,
      province,
      country,
    });
  }

  revalidatePath("/account/orders");
  revalidatePath("/dashboard/orders");
  redirect(`/orders/${order.id}`);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order, error } = await supabase.from("orders").update({ status }).eq("id", orderId).select("customer_id, order_number").single();
  if (error) throw new Error(error.message);

  if (order) {
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    await supabase.rpc("notify_user", {
      p_user_id: order.customer_id,
      p_type: "order_status",
      p_title: `Order ${order.order_number}: ${statusLabel}`,
      p_message: `Your order status is now "${statusLabel}".`,
      p_link: `/orders/${orderId}`,
    });
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
  revalidatePath("/account/orders");
}

export async function cancelOrderAsBuyer(orderId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase.from("orders").select("id, customer_id, status, order_number, store_id").eq("id", orderId).single();
  if (!order) throw new Error("Order not found.");
  if (order.customer_id !== user.id) throw new Error("Not authorized.");
  // Buyers can back out of an order that hasn't been paid for yet -- once
  // it's paid, cancelling unilaterally would need to involve the seller
  // (a refund, stock already reserved/sold, etc.), so that stays a
  // seller-side status change instead.
  if (order.status !== "pending") {
    throw new Error("Only orders still awaiting payment can be cancelled this way.");
  }

  // No RLS policy lets a customer update orders.status directly (only the
  // seller/admin policy exists) -- the authorization checks above already
  // confirm this is the order's own buyer and it's still unpaid, so using
  // the admin client here for just this one field is safe.
  const admin = createAdminClient();
  const { error } = await admin.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  if (error) throw new Error(error.message);
  // No manual order_status_history insert needed -- a DB trigger already
  // logs every status change automatically.

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath("/dashboard/orders");
}

const DAILY_QUOTA_SAFETY_LIMIT = 90; // stay under NBC's hard 100/day cap with a buffer
const PER_ORDER_COOLDOWN_MS = 60_000; // don't let one order's repeated clicks burn the shared quota

export async function verifyBakongPayment(orderId: string): Promise<
  | { status: "success"; amount: number; currency: string; fromAccountId: string; hash: string }
  | { status: "not_found" | "failed" | "error" | "not_configured" | "rate_limited"; message: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, customer_id, store_id, total, khqr_md5, bakong_last_checked_at, stores(seller_id)")
    .eq("id", orderId)
    .single();

  if (!order) return { status: "error", message: "Order not found." };

  const store = order.stores as unknown as { seller_id: string } | null;
  const isAllowed = order.customer_id === user.id || store?.seller_id === user.id;
  if (!isAllowed) return { status: "error", message: "Not authorized." };

  if (!order.khqr_md5) {
    return { status: "not_configured", message: "This order doesn't have a KHQR code to verify." };
  }

  // Per-order cooldown — stops one person's repeated clicks alone from
  // eating meaningfully into the shared daily quota.
  if (order.bakong_last_checked_at) {
    const elapsed = Date.now() - new Date(order.bakong_last_checked_at).getTime();
    if (elapsed < PER_ORDER_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((PER_ORDER_COOLDOWN_MS - elapsed) / 1000);
      return { status: "rate_limited", message: `Please wait ${waitSeconds}s before checking again.` };
    }
  }

  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("platform_settings")
    .select("bakong_developer_token, bakong_use_sandbox")
    .eq("id", 1)
    .single();

  if (!settings?.bakong_developer_token) {
    return { status: "not_configured", message: "Bakong verification isn't set up yet (admin needs to add a developer token)." };
  }

  // Platform-wide daily quota — NBC allows only 100 requests/day total for
  // the whole integration, shared across every store and order.
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { count: callsToday } = await admin
    .from("bakong_api_calls")
    .select("*", { count: "exact", head: true })
    .gte("called_at", since.toISOString());

  if ((callsToday ?? 0) >= DAILY_QUOTA_SAFETY_LIMIT) {
    return {
      status: "rate_limited",
      message: "Today's Bakong verification quota is used up — please check your banking app directly, or try again tomorrow.",
    };
  }

  await supabase.from("orders").update({ bakong_last_checked_at: new Date().toISOString() }).eq("id", orderId);
  await admin.from("bakong_api_calls").insert({ order_id: orderId });

  const result = await checkBakongTransactionByMd5({
    md5: order.khqr_md5,
    token: settings.bakong_developer_token,
    useSandbox: settings.bakong_use_sandbox,
  });

  if (result.status === "success") {
    await supabase
      .from("orders")
      .update({
        bakong_verified_at: new Date().toISOString(),
        status: "paid",
        payment_status: "success",
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    // Seller gets a distinct "payment received" ping — the "new order"
    // message they got at checkout time only said a KHQR was waiting to
    // be scanned, not that money had actually arrived.
    const { data: sellerSettings } = await supabase
      .from("store_settings")
      .select("settings")
      .eq("store_id", order.store_id)
      .maybeSingle();
    const tgSettings = sellerSettings?.settings as Record<string, unknown> | undefined;
    const botToken = tgSettings?.telegram_bot_token as string | undefined;
    const chatId = tgSettings?.telegram_chat_id as string | undefined;
    if (botToken && chatId) {
      await sendTelegramMessage(
        botToken,
        chatId,
        `✅ <b>Payment received for order ${order.order_number}</b>\n$${result.amount.toFixed(2)} ${result.currency} confirmed via Bakong.`
      );
    }

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/dashboard/orders");
    return { status: "success", amount: result.amount, currency: result.currency, fromAccountId: result.fromAccountId, hash: result.hash };
  }

  return { status: result.status, message: result.message };
}
