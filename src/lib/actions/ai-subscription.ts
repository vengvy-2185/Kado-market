"use server";

import { revalidatePath } from "next/cache";
import { getMyStoreOrRedirect } from "@/lib/store";
import { notifyPlatformAdmin } from "@/lib/notify-admin";

export async function subscribeToAiPlan(planId: string) {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { data: plan, error: planError } = await supabase.from("ai_plans").select("*").eq("id", planId).single();
  if (planError || !plan) throw new Error("Plan not found.");

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + plan.duration_months);

  const { error } = await supabase.from("ai_subscriptions").insert({
    store_id: store.id,
    plan_id: plan.id,
    status: "active",
    payment_method: "demo",
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw new Error(error.message);

  await notifyPlatformAdmin(
    `💰 <b>New AI Assistant subscription</b>\nStore: ${store.store_name}\nPlan: ${plan.name} ($${plan.price})`
  );

  revalidatePath("/dashboard/ai-assistant");
}
