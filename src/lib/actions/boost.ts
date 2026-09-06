"use server";

import { revalidatePath } from "next/cache";
import { getMyStoreOrRedirect } from "@/lib/store";
import { notifyPlatformAdmin } from "@/lib/notify-admin";
import type { BoostTargetType } from "@/lib/types/database.types";

export async function createBoostCampaign(formData: FormData) {
  const { supabase, store } = await getMyStoreOrRedirect();

  const targetType = String(formData.get("target_type")) as BoostTargetType;
  const targetId = String(formData.get("target_id") ?? "");
  const planId = String(formData.get("plan_id") ?? "");

  if (!targetId) throw new Error("Please choose something to boost.");
  if (!planId) throw new Error("Please choose a boost duration.");

  const { data: plan, error: planError } = await supabase.from("boost_plans").select("*").eq("id", planId).single();
  if (planError || !plan) throw new Error("Plan not found.");

  // Verify the target actually belongs to this seller's store before charging "money" for it
  if (targetType === "post") {
    const { data: post } = await supabase.from("posts").select("id").eq("id", targetId).eq("store_id", store.id).maybeSingle();
    if (!post) throw new Error("Post not found.");
  } else {
    const { data: product } = await supabase.from("products").select("id").eq("id", targetId).eq("store_id", store.id).maybeSingle();
    if (!product) throw new Error("Product not found.");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

  const { error } = await supabase.from("boost_campaigns").insert({
    store_id: store.id,
    target_type: targetType,
    post_id: targetType === "post" ? targetId : null,
    product_id: targetType === "product" ? targetId : null,
    plan_id: plan.id,
    status: "active",
    payment_method: "demo",
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw new Error(error.message);

  await notifyPlatformAdmin(
    `💰 <b>New boost campaign</b>\nStore: ${store.store_name}\n${targetType} boosted for ${plan.duration_days}d ($${plan.price})`
  );

  revalidatePath("/dashboard/boost");
  revalidatePath("/");
}

export async function cancelBoostCampaign(campaignId: string) {
  const { supabase } = await getMyStoreOrRedirect();
  const { error } = await supabase.from("boost_campaigns").update({ status: "cancelled" }).eq("id", campaignId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/boost");
  revalidatePath("/");
}
