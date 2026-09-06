"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, isAdminRole } from "@/lib/require-admin";
import { generateAdminInsightAnswer } from "@/lib/ai/provider";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const role = await getUserRole(supabase, user.id);
  if (!isAdminRole(role)) redirect("/");
  return supabase;
}

export async function askAdminInsight(question: string): Promise<string> {
  const supabase = await requireAdmin();
  const trimmed = question.trim();
  if (!trimmed) return "Please ask a question.";

  const [
    { count: totalUsers },
    { count: totalSellers },
    { count: totalCustomers },
    { count: totalStores },
    { count: activeStores },
    { count: pendingStores },
    { count: suspendedStores },
    { count: totalProducts },
    { count: totalOrders },
    { data: orderTotals },
    { count: activeStoreSubs },
    { count: activeAiSubs },
    { count: activeBoosts },
    { count: openTickets },
    { data: topStoresByProducts },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "seller"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("stores").select("*", { count: "exact", head: true }),
    supabase.from("stores").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("stores").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("stores").select("*", { count: "exact", head: true }).eq("status", "suspended"),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total, status"),
    supabase.from("store_subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("ai_subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("boost_campaigns").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("stores").select("store_name, products(count)").limit(50),
  ]);

  const grossOrderRevenue = (orderTotals ?? [])
    .filter((o) => !["cancelled", "refunded"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total), 0);

  const topStores = ((topStoresByProducts ?? []) as unknown as { store_name: string; products: { count: number }[] }[])
    .map((s) => ({ store_name: s.store_name, product_count: s.products?.[0]?.count ?? 0 }))
    .sort((a, b) => b.product_count - a.product_count)
    .slice(0, 5);

  const platformData = {
    users: { total: totalUsers ?? 0, sellers: totalSellers ?? 0, customers: totalCustomers ?? 0 },
    stores: {
      total: totalStores ?? 0,
      active: activeStores ?? 0,
      pending_review: pendingStores ?? 0,
      suspended: suspendedStores ?? 0,
      top_stores_by_product_count: topStores,
    },
    products: { total: totalProducts ?? 0 },
    orders: { total_count: totalOrders ?? 0, gross_revenue_usd: Math.round(grossOrderRevenue * 100) / 100 },
    subscriptions: {
      active_store_plans: activeStoreSubs ?? 0,
      active_ai_plans: activeAiSubs ?? 0,
      active_boost_campaigns: activeBoosts ?? 0,
    },
    support: { open_tickets: openTickets ?? 0 },
    note: "All monetary figures reflect demo-mode transactions; no real payment provider is connected yet.",
  };

  const answer = await generateAdminInsightAnswer({
    platformDataJson: JSON.stringify(platformData, null, 2),
    question: trimmed,
  });

  return (
    answer ??
    "The AI insights assistant is temporarily unavailable (check that GEMINI_API_KEY is set in .env.local)."
  );
}
