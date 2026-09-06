"use server";

import { revalidatePath } from "next/cache";
import { getMyStoreOrRedirect } from "@/lib/store";
import { createClient } from "@/lib/supabase/server";
import type { DiscountType } from "@/lib/types/database.types";

export async function createDiscountCode(formData: FormData) {
  const { supabase, store } = await getMyStoreOrRedirect();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const discountType = String(formData.get("discount_type") ?? "percent") as DiscountType;
  const value = Number(formData.get("value") ?? 0);
  const minOrderAmount = Number(formData.get("min_order_amount") ?? 0);
  const usageLimitRaw = String(formData.get("usage_limit") ?? "").trim();
  const usageLimit = usageLimitRaw ? Number(usageLimitRaw) : null;
  const expiresRaw = String(formData.get("expires_at") ?? "").trim();
  const expiresAt = expiresRaw ? new Date(expiresRaw).toISOString() : null;

  if (!code) throw new Error("Please enter a code.");
  if (value <= 0) throw new Error("Discount value must be greater than 0.");
  if (discountType === "percent" && value > 100) throw new Error("Percent discount can't exceed 100.");

  const { error } = await supabase.from("discount_codes").insert({
    store_id: store.id,
    code,
    discount_type: discountType,
    value,
    min_order_amount: minOrderAmount,
    usage_limit: usageLimit,
    expires_at: expiresAt,
  });

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      throw new Error("You already have a code with this name.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/marketing");
}

export async function toggleDiscountCode(codeId: string, isActive: boolean) {
  const { supabase } = await getMyStoreOrRedirect();
  const { error } = await supabase.from("discount_codes").update({ is_active: isActive }).eq("id", codeId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/marketing");
}

export async function deleteDiscountCode(codeId: string) {
  const { supabase } = await getMyStoreOrRedirect();
  const { error } = await supabase.from("discount_codes").delete().eq("id", codeId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/marketing");
}

export async function previewDiscount(storeId: string, code: string, subtotal: number) {
  const supabase = createClient();
  if (!code.trim()) return 0;
  const { data, error } = await supabase.rpc("validate_discount_code", {
    p_store_id: storeId,
    p_code: code.trim(),
    p_subtotal: subtotal,
  });
  if (error) return 0;
  return Number(data ?? 0);
}
