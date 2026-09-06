import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, isAdminRole } from "@/lib/require-admin";
import { Card } from "@/components/ui/card";
import { SubscriptionPlanRow } from "@/components/admin/subscription-plan-row";
import { AiPlanRow } from "@/components/admin/ai-plan-row";
import { BoostPlanRow } from "@/components/admin/boost-plan-row";
import { NewSubscriptionPlanForm, NewAiPlanForm, NewBoostPlanForm } from "@/components/admin/new-plan-forms";

export default async function AdminPlansPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const role = await getUserRole(supabase, user.id);
  if (!isAdminRole(role)) redirect("/");

  const [{ data: storePlans }, { data: aiPlans }, { data: boostPlans }] = await Promise.all([
    supabase.from("subscription_plans").select("*").order("sort_order"),
    supabase.from("ai_plans").select("*").order("sort_order"),
    supabase.from("boost_plans").select("*").order("sort_order"),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Plans</h1>
      </div>
      <p className="mb-6 text-sm text-white/40">
        Edit prices and features directly — changes save automatically when you click away from a
        field. These are the plans sellers see on Subscription, AI Assistant, and Boost pages.
      </p>

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-white/70">Store subscription plans</h2>
        <NewSubscriptionPlanForm />
        <div className="grid grid-cols-12 gap-2 pb-1 text-[10px] uppercase tracking-wide text-white/30">
          <span className="col-span-3">Name</span>
          <span className="col-span-2">$/mo</span>
          <span className="col-span-2">$/yr</span>
          <span className="col-span-1">Limit</span>
          <span className="col-span-1 text-center">Active</span>
          <span className="col-span-2 text-center">Features</span>
          <span className="col-span-1"></span>
        </div>
        {(storePlans ?? []).map((p) => (
          <SubscriptionPlanRow key={p.id} plan={p} />
        ))}
      </Card>

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-white/70">AI Assistant plans</h2>
        <NewAiPlanForm />
        <div className="grid grid-cols-12 gap-2 pb-1 text-[10px] uppercase tracking-wide text-white/30">
          <span className="col-span-4">Name</span>
          <span className="col-span-2">Price</span>
          <span className="col-span-2">Months</span>
          <span className="col-span-2">Msg limit</span>
          <span className="col-span-1 text-center">Active</span>
          <span className="col-span-1"></span>
        </div>
        {(aiPlans ?? []).map((p) => (
          <AiPlanRow key={p.id} plan={p} />
        ))}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-white/70">Boost plans</h2>
        <NewBoostPlanForm />
        <div className="grid grid-cols-12 gap-2 pb-1 text-[10px] uppercase tracking-wide text-white/30">
          <span className="col-span-4">Duration (days)</span>
          <span className="col-span-4">Price</span>
          <span className="col-span-3">Active</span>
          <span className="col-span-1"></span>
        </div>
        {(boostPlans ?? []).map((p) => (
          <BoostPlanRow key={p.id} plan={p} />
        ))}
      </Card>
    </div>
  );
}
