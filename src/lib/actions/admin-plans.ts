"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, isAdminRole } from "@/lib/require-admin";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const role = await getUserRole(supabase, user.id);
  if (!isAdminRole(role)) throw new Error("Not authorized.");
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

// Postgres error codes we can turn into a message worth showing an admin,
// instead of the generic "something went wrong on the server" Next.js
// shows in production for anything thrown out of a Server Action.
function describeCategoryError(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "A category with a very similar name already exists — try a slightly different name.";
  return "Couldn't save the category. Please try again.";
}

// Category slugs are used in the shopper-facing URL (?category=slug), so
// they must be unique -- but two categories legitimately having the same
// name (e.g. a top-level "Other" and a sub-category also called "Other")
// shouldn't be a hard error the admin has to work around by hand. Instead,
// silently pick the next free slug (classis, classis-2, classis-3, ...).
async function uniqueCategorySlug(supabase: Awaited<ReturnType<typeof createClient>>, baseSlug: string): Promise<string> {
  const safeBase = baseSlug || "category";
  const { data } = await supabase.from("categories").select("slug").ilike("slug", `${safeBase}%`);
  const existing = new Set((data ?? []).map((r) => r.slug));
  if (!existing.has(safeBase)) return safeBase;
  let i = 2;
  while (existing.has(`${safeBase}-${i}`)) i++;
  return `${safeBase}-${i}`;
}

export async function createCategory(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Category name is required." };
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = await uniqueCategorySlug(supabase, baseSlug);
  const parentId = String(formData.get("parent_id") ?? "").trim() || null;
  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    icon: String(formData.get("icon") ?? "").trim() || null,
    icon_url: String(formData.get("icon_url") ?? "").trim() || null,
    parent_id: parentId,
    sort_order: Number(formData.get("sort_order") ?? 0),
  });
  if (error) return { ok: false, error: describeCategoryError(error) };
  await logAudit(supabase, "category.created", "category", null, { name, parent_id: parentId });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true };
}

export async function updateCategoryField(id: string, field: string, value: string | number | boolean | null) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("categories").update({ [field]: value }).eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, "category.updated", "category", id, { field, value });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function updateCategoryFields(
  id: string,
  fields: Partial<{ name: string; icon: string | null; icon_url: string | null; parent_id: string | null; is_active: boolean; sort_order: number }>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("categories").update(fields).eq("id", id);
  if (error) return { ok: false, error: describeCategoryError(error) };
  await logAudit(supabase, "category.updated", "category", id, fields);
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteCategory(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(supabase, "category.deleted", "category", id);
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function saveAllCategoryIcon(url: string | null) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("platform_settings").update({ all_category_icon_url: url }).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
  revalidatePath("/");
}
