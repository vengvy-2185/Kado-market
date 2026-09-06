"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") throw new Error("Not authorized.");
  return supabase;
}

// ---------------- Subscription plans (store plans) ----------------

export async function createSubscriptionPlan(formData: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("subscription_plans").insert({
    name: String(formData.get("name")),
    price_monthly: Number(formData.get("price_monthly")),
    price_yearly: Number(formData.get("price_yearly")),
    product_limit: formData.get("product_limit") ? Number(formData.get("product_limit")) : null,
    ai_enabled: formData.get("ai_enabled") === "on",
    analytics_enabled: formData.get("analytics_enabled") === "on",
    stories_enabled: formData.get("stories_enabled") === "on",
    boost_enabled: formData.get("boost_enabled") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0),
  });
  if (error) throw new Error(error.message);
  await logAudit(supabase, "plan.created", "subscription_plan", null, { name: formData.get("name") });
  revalidatePath("/admin/plans");
}

export async function updateSubscriptionPlanField(id: string, field: string, value: string | number | boolean) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("subscription_plans").update({ [field]: value }).eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, "plan.updated", "subscription_plan", id, { field, value });
  revalidatePath("/admin/plans");
}

export async function deleteSubscriptionPlan(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, "plan.deleted", "subscription_plan", id);
  revalidatePath("/admin/plans");
}

// ---------------- AI plans ----------------

export async function createAiPlan(formData: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("ai_plans").insert({
    name: String(formData.get("name")),
    price: Number(formData.get("price")),
    duration_months: Number(formData.get("duration_months")),
    message_limit: Number(formData.get("message_limit")),
    sort_order: Number(formData.get("sort_order") ?? 0),
  });
  if (error) throw new Error(error.message);
  await logAudit(supabase, "plan.created", "ai_plan", null, { name: formData.get("name") });
  revalidatePath("/admin/plans");
}

export async function updateAiPlanField(id: string, field: string, value: string | number | boolean) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("ai_plans").update({ [field]: value }).eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, "plan.updated", "ai_plan", id, { field, value });
  revalidatePath("/admin/plans");
}

export async function deleteAiPlan(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("ai_plans").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, "plan.deleted", "ai_plan", id);
  revalidatePath("/admin/plans");
}

// ---------------- Boost plans ----------------

export async function createBoostPlan(formData: FormData) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("boost_plans").insert({
    duration_days: Number(formData.get("duration_days")),
    price: Number(formData.get("price")),
    sort_order: Number(formData.get("sort_order") ?? 0),
  });
  if (error) throw new Error(error.message);
  await logAudit(supabase, "plan.created", "boost_plan", null, { duration_days: formData.get("duration_days") });
  revalidatePath("/admin/plans");
}

export async function updateBoostPlanField(id: string, field: string, value: string | number | boolean) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("boost_plans").update({ [field]: value }).eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, "plan.updated", "boost_plan", id, { field, value });
  revalidatePath("/admin/plans");
}

export async function deleteBoostPlan(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("boost_plans").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, "plan.deleted", "boost_plan", id);
  revalidatePath("/admin/plans");
}

// ---------------- Categories ----------------

export async function createCategory(formData: FormData) {
  const supabase = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    icon: String(formData.get("icon") ?? "").trim() || null,
    sort_order: Number(formData.get("sort_order") ?? 0),
  });
  if (error) throw new Error(error.message);
  await logAudit(supabase, "category.created", "category", null, { name });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function updateCategoryField(id: string, field: string, value: string | number | boolean) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("categories").update({ [field]: value }).eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, "category.updated", "category", id, { field, value });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategory(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, "category.deleted", "category", id);
  revalidatePath("/admin/categories");
  revalidatePath("/");
}
