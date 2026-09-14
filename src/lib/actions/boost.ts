"use server";

import { revalidatePath } from "next/cache";
import { getMyStoreOrRedirect } from "@/lib/store";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyPlatformAdmin } from "@/lib/notify-admin";
import { generateKhqr, khqrMd5 } from "@/lib/khqr";
import { checkBakongTransactionByMd5 } from "@/lib/bakong-api";
import type { BoostTargetType } from "@/lib/types/database.types";

const PER_CAMPAIGN_COOLDOWN_MS = 60_000;
const DAILY_QUOTA_SAFETY_LIMIT = 90; // leaves headroom under NBC's shared 100/day limit for order checks too

export async function createBoostCampaign(
  formData: FormData
): Promise<{ id: string; pending: boolean; khqrString: string | null; amount: number }> {
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

  // The platform's own KHQR (not the seller's) receives boost payments.
  const { data: platformRows } = await supabase.rpc("get_public_platform_khqr");
  const platformKhqr = platformRows?.[0];

  let khqrString: string | null = null;
  let khqrMd5Hash: string | null = null;
  if (platformKhqr?.bakong_account_id && platformKhqr?.bakong_phone) {
    khqrString = generateKhqr({
      bakongAccountId: platformKhqr.bakong_account_id,
      accountInformation: platformKhqr.bakong_phone,
      merchantName: platformKhqr.platform_name,
      merchantCity: platformKhqr.platform_city ?? "Phnom Penh",
      amount: plan.price,
      currency: "USD",
    });
    khqrMd5Hash = khqrMd5(khqrString);
  }

  // Only go straight to "active" when there's genuinely no way to verify a
  // real payment yet (platform hasn't configured Bakong) -- clearly a
  // fallback, not the normal path. Whenever a real KHQR exists, the
  // campaign starts pending and only activates once verifyBoostPayment
  // confirms an actual transaction against NBC's API.
  const isPending = Boolean(khqrMd5Hash);

  const { data: campaign, error } = await supabase
    .from("boost_campaigns")
    .insert({
      store_id: store.id,
      target_type: targetType,
      post_id: targetType === "post" ? targetId : null,
      product_id: targetType === "product" ? targetId : null,
      plan_id: plan.id,
      status: isPending ? "pending_payment" : "active",
      payment_method: isPending ? "bakong" : "demo",
      khqr_string: khqrString,
      khqr_md5: khqrMd5Hash,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !campaign) throw new Error(error?.message ?? "Failed to start boost.");

  if (!isPending) {
    await notifyPlatformAdmin(
      `💰 <b>New boost campaign (demo — no platform KHQR configured)</b>\nStore: ${store.store_name}\n${targetType} boosted for ${plan.duration_days}d ($${plan.price})`
    );
  }

  revalidatePath("/dashboard/boost");
  revalidatePath("/");

  return { id: campaign.id, pending: isPending, khqrString, amount: plan.price };
}

export async function verifyBoostPayment(campaignId: string): Promise<
  | { status: "success"; amount: number; currency: string; fromAccountId: string; hash: string }
  | { status: "not_found" | "failed" | "error" | "not_configured" | "rate_limited"; message: string }
> {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { data: campaign } = await supabase
    .from("boost_campaigns")
    .select("id, store_id, status, khqr_md5, bakong_last_checked_at, target_type, plan_id, boost_plans(duration_days, price)")
    .eq("id", campaignId)
    .single();

  if (!campaign) return { status: "error", message: "Campaign not found." };
  if (campaign.store_id !== store.id) return { status: "error", message: "Not authorized." };

  if (campaign.status === "active") return { status: "success" };
  if (!campaign.khqr_md5) return { status: "not_configured", message: "This campaign doesn't have a KHQR code to verify." };

  if (campaign.bakong_last_checked_at) {
    const elapsed = Date.now() - new Date(campaign.bakong_last_checked_at).getTime();
    if (elapsed < PER_CAMPAIGN_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((PER_CAMPAIGN_COOLDOWN_MS - elapsed) / 1000);
      return { status: "rate_limited", message: `Please wait ${waitSeconds}s before checking again.` };
    }
  }

  const admin = createAdminClient();
  const { data: settings } = await admin.from("platform_settings").select("bakong_developer_token, bakong_use_sandbox").eq("id", 1).single();
  if (!settings?.bakong_developer_token) {
    return { status: "not_configured", message: "Bakong verification isn't set up yet (admin needs to add a developer token)." };
  }

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { count: callsToday } = await admin
    .from("bakong_api_calls")
    .select("*", { count: "exact", head: true })
    .gte("called_at", since.toISOString());

  if ((callsToday ?? 0) >= DAILY_QUOTA_SAFETY_LIMIT) {
    return { status: "rate_limited", message: "Today's Bakong verification quota is used up — please try again tomorrow." };
  }

  await supabase.from("boost_campaigns").update({ bakong_last_checked_at: new Date().toISOString() }).eq("id", campaignId);
  await admin.from("bakong_api_calls").insert({ boost_campaign_id: campaignId });

  const result = await checkBakongTransactionByMd5({
    md5: campaign.khqr_md5,
    token: settings.bakong_developer_token,
    useSandbox: settings.bakong_use_sandbox,
  });

  if (result.status === "success") {
    await supabase
      .from("boost_campaigns")
      .update({ status: "active", bakong_verified_at: new Date().toISOString() })
      .eq("id", campaignId);

    const plan = campaign.boost_plans as unknown as { duration_days: number; price: number } | null;
    await notifyPlatformAdmin(
      `💰 <b>Boost payment verified</b>\nStore: ${store.store_name}\n${campaign.target_type} boosted for ${plan?.duration_days ?? "?"}d ($${plan?.price ?? "?"})`
    );
    revalidatePath("/dashboard/boost");
    revalidatePath("/");
    return { status: "success", amount: result.amount, currency: result.currency, fromAccountId: result.fromAccountId, hash: result.hash };
  }

  return { status: result.status, message: result.message };
}

export async function cancelBoostCampaign(campaignId: string) {
  const { supabase } = await getMyStoreOrRedirect();
  const { error } = await supabase.from("boost_campaigns").update({ status: "cancelled" }).eq("id", campaignId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/boost");
  revalidatePath("/");
}
