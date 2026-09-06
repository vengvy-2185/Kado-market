import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PlatformKhqrForm } from "@/components/admin/platform-khqr-form";
import { PlatformTelegramPanel } from "@/components/admin/platform-telegram-panel";

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") redirect("/");

  const { data: settings } = await supabase.from("platform_settings").select("*").eq("id", 1).single();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        <Settings className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Platform Settings</h1>
      </div>

      <div className="space-y-6">
        <PlatformKhqrForm
          initialAccountId={settings?.bakong_account_id ?? null}
          initialPhone={settings?.bakong_phone ?? null}
          initialName={settings?.platform_name ?? "KADO MARKET"}
          initialCity={settings?.platform_city ?? "Phnom Penh"}
        />
        <PlatformTelegramPanel
          hasToken={Boolean(settings?.telegram_bot_token)}
          botUsername={settings?.telegram_bot_username ?? null}
          isConnected={Boolean(settings?.telegram_chat_id)}
        />
      </div>
    </div>
  );
}
