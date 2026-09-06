"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types/database.types";
import { sendTelegramMessage } from "@/lib/telegram";
import { checkAndNotifyLowStock } from "@/lib/low-stock";

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

  // unique order_number
  let orderNumber = randomOrderNumber();
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase.from("orders").select("id").eq("order_number", orderNumber).maybeSingle();
    if (!existing) break;
    orderNumber = randomOrderNumber();
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: user.id,
      store_id: product.store_id,
      status: "paid", // DEMO PAYMENT MODE — see spec section 31, marked clearly, no real provider wired up
      payment_status: "success",
      payment_method: "demo",
      subtotal,
      shipping_fee: shippingFee,
      total,
      discount_code: discountAmount > 0 ? discountCodeInput.toUpperCase() : null,
      discount_amount: discountAmount,
      shipping_address: { full_name: fullName, phone, address_line: addressLine, city, province, country },
      customer_note: customerNote,
      paid_at: new Date().toISOString(),
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
    await sendTelegramMessage(
      botToken,
      chatId,
      `🛎️ <b>New order ${orderNumber}</b>\n${product.name}${variantLabel} × ${quantity}\nTotal: $${total.toFixed(2)}\nBuyer: ${fullName}${discountLine}`
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
