"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { checkAndNotifyLowStock } from "@/lib/low-stock";
import { generateKhqr, khqrMd5 } from "@/lib/khqr";

function randomOrderNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `ORD-${code}`;
}

export async function addToCart(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const productId = String(formData.get("product_id"));
  const variantId = String(formData.get("variant_id") ?? "") || null;
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1));

  // NULL variant_id can't rely on the DB unique constraint (NULL != NULL in
  // Postgres uniqueness), so check for an existing row explicitly first.
  let existingQuery = supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", productId);
  existingQuery = variantId ? existingQuery.eq("variant_id", variantId) : existingQuery.is("variant_id", null);
  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    await supabase.from("cart_items").update({ quantity: existing.quantity + quantity }).eq("id", existing.id);
  } else {
    await supabase.from("cart_items").insert({ user_id: user.id, product_id: productId, variant_id: variantId, quantity });
  }

  revalidatePath("/cart");
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (quantity <= 0) {
    await supabase.from("cart_items").delete().eq("id", cartItemId).eq("user_id", user.id);
  } else {
    await supabase.from("cart_items").update({ quantity }).eq("id", cartItemId).eq("user_id", user.id);
  }
  revalidatePath("/cart");
}

export async function removeCartItem(cartItemId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("cart_items").delete().eq("id", cartItemId).eq("user_id", user.id);
  revalidatePath("/cart");
}

export async function checkoutCartForStore(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const storeId = String(formData.get("store_id"));
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const addressLine = String(formData.get("address_line") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim() || null;
  const province = String(formData.get("province") ?? "").trim() || null;
  const country = String(formData.get("country") ?? "Cambodia").trim();

  if (!fullName || !phone || !addressLine) throw new Error("Please fill in the full shipping address.");

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("id, quantity, product_id, variant_id, products(id, store_id, name, price, stock, status, product_images(url, sort_order)), product_variants(id, variant_name, price, stock)")
    .eq("user_id", user.id);

  const storeItems = (cartItems ?? []).filter((ci) => {
    const product = ci.products as unknown as { store_id: string } | null;
    return product?.store_id === storeId;
  });

  if (storeItems.length === 0) throw new Error("No items from this store in your cart.");

  let subtotal = 0;
  const orderItemRows: {
    product_id: string;
    variant_id: string | null;
    product_name: string;
    product_image: string | null;
    unit_price: number;
    quantity: number;
    subtotal: number;
  }[] = [];

  for (const ci of storeItems) {
    const product = ci.products as unknown as {
      id: string;
      name: string;
      price: number;
      stock: number;
      status: string;
      product_images: { url: string; sort_order: number }[] | null;
    };
    const variant = ci.product_variants as unknown as { variant_name: string; price: number | null; stock: number } | null;

    if (product.status !== "active") throw new Error(`${product.name} is no longer available.`);
    const availableStock = variant ? variant.stock : product.stock;
    if (availableStock < ci.quantity) throw new Error(`Not enough stock for ${product.name}.`);

    const unitPrice = variant?.price ?? product.price;
    const lineSubtotal = Math.round(unitPrice * ci.quantity * 100) / 100;
    subtotal += lineSubtotal;

    const images = product.product_images ?? [];
    const thumbnail = [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;

    orderItemRows.push({
      product_id: product.id,
      variant_id: ci.variant_id,
      product_name: product.name + (variant ? ` (${variant.variant_name})` : ""),
      product_image: thumbnail,
      unit_price: unitPrice,
      quantity: ci.quantity,
      subtotal: lineSubtotal,
    });
  }

  const shippingFee = 0;
  const total = subtotal + shippingFee;

  // Same real-payment-required rule as the single-product checkout: only
  // an unconfigured store (no Bakong account on file) falls back to an
  // instant demo order.
  let khqrString: string | null = null;
  let khqrMd5Hash: string | null = null;
  const { data: storeForKhqr } = await supabase.from("stores").select("store_name, city, bakong_account_id, bakong_phone").eq("id", storeId).single();
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
  const isPending = Boolean(khqrMd5Hash);

  let orderNumber = randomOrderNumber();
  for (let i = 0; i < 5; i++) {
    const { data: dupe } = await supabase.from("orders").select("id").eq("order_number", orderNumber).maybeSingle();
    if (!dupe) break;
    orderNumber = randomOrderNumber();
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: user.id,
      store_id: storeId,
      status: isPending ? "pending" : "paid",
      payment_status: isPending ? "pending" : "success",
      payment_method: isPending ? "bakong" : "demo",
      subtotal,
      shipping_fee: shippingFee,
      total,
      shipping_address: { full_name: fullName, phone, address_line: addressLine, city, province, country },
      paid_at: isPending ? null : new Date().toISOString(),
      khqr_string: khqrString,
      khqr_md5: khqrMd5Hash,
    })
    .select()
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? "Failed to create order.");

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemRows.map((row) => ({ ...row, order_id: order.id, store_id: storeId })));

  if (itemsError) throw new Error(itemsError.message);

  await Promise.all(orderItemRows.map((row) => checkAndNotifyLowStock(row.product_id)));

  // stock is reserved automatically by the reserve_stock_on_order_item() trigger

  const { data: sellerSettings } = await supabase.from("store_settings").select("settings").eq("store_id", storeId).maybeSingle();
  const tgSettings = sellerSettings?.settings as Record<string, unknown> | undefined;
  const botToken = tgSettings?.telegram_bot_token as string | undefined;
  const chatId = tgSettings?.telegram_chat_id as string | undefined;
  if (botToken && chatId) {
    const paymentLine = isPending ? "\n⏳ Awaiting KHQR payment" : "\n✅ Demo payment (no real KHQR configured)";
    await sendTelegramMessage(botToken, chatId, `🛎️ <b>New order ${orderNumber}</b>\n${orderItemRows.length} item(s)\nTotal: $${total.toFixed(2)}\nBuyer: ${fullName}${paymentLine}`);
  }

  await supabase
    .from("cart_items")
    .delete()
    .in("id", storeItems.map((ci) => ci.id));

  revalidatePath("/cart");
  revalidatePath("/account/orders");
  redirect(`/orders/${order.id}`);
}
