import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, isAdminRole } from "@/lib/require-admin";
import { AdminInsightsChat } from "@/components/admin/admin-insights-chat";

export default async function AdminInsightsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const role = await getUserRole(supabase, user.id);
  if (!isAdminRole(role)) redirect("/");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-10">
      <h1 className="mb-6 text-2xl font-bold">AI Insights</h1>
      <AdminInsightsChat />
      <p className="mt-3 text-xs text-white/30">
        Requires <code>GEMINI_API_KEY</code> in <code>.env.local</code> to generate answers — the
        underlying data queries still run either way.
      </p>
    </div>
  );
}
