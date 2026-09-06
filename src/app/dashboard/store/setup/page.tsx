import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoreSetupWizard } from "@/components/store/store-setup-wizard";

export default async function StoreSetupPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: store }, { data: categories }, { data: plans }] = await Promise.all([
    supabase.from("stores").select("*").eq("seller_id", user.id).single(),
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("subscription_plans").select("*").eq("is_active", true).order("sort_order"),
  ]);

  if (!store) redirect("/dashboard");

  return (
    <StoreSetupWizard store={store} categories={categories ?? []} plans={plans ?? []} />
  );
}
