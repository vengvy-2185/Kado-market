"use server";

import { revalidatePath } from "next/cache";
import { getMyStoreOrRedirect } from "@/lib/store";
import { notifyPlatformAdmin } from "@/lib/notify-admin";
import type { BillingCycle } from "@/lib/types/database.types";

export async function changeStorePlan(planId: string, billingCycle: BillingCycle) {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { data: plan, error: planError } = await supabase.from("subscription_plans").select("*").eq("id", planId).single();
  if (planError || !plan) throw new Error("Plan not found.");

  const periodEnd = new Date();
  if (billingCycle === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { error } = await supabase.from("store_subscriptions").insert({
    store_id: store.id,
    plan_id: plan.id,
    status: "active",
    billing_cycle: billingCycle,
    current_period_start: new Date().toISOString(),
    current_period_end: periodEnd.toISOString(),
  });

  if (error) throw new Error(error.message);

  const price = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
  await notifyPlatformAdmin(
    `💰 <b>New store subscription</b>\nStore: ${store.store_name}\nPlan: ${plan.name} ($${price}/${billingCycle})`
  );

  revalidatePath("/dashboard/subscription");
  revalidatePath("/dashboard");
}
