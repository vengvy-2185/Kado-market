import { Settings as SettingsIcon } from "lucide-react";
import { getMyStoreOrRedirect } from "@/lib/store";
import { KhqrSettingsForm } from "@/components/settings/khqr-settings-form";
import { TelegramPanel } from "@/components/settings/telegram-panel";
import { PasswordChangeForm } from "@/components/settings/password-change-form";

export default async function SettingsPage() {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { data: settingsRow } = await supabase.from("store_settings").select("settings").eq("store_id", store.id).maybeSingle();
  const settings = (settingsRow?.settings as Record<string, unknown> | undefined) ?? {};
  const isTelegramConnected = Boolean(settings.telegram_chat_id);
  const hasTelegramToken = Boolean(settings.telegram_bot_token);
  const telegramBotUsername = (settings.telegram_bot_username as string | undefined) ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
        <KhqrSettingsForm
          storeName={store.store_name}
          storeCity={store.city}
          initialAccountId={store.bakong_account_id}
          initialPhone={store.bakong_phone}
        />
        <TelegramPanel hasToken={hasTelegramToken} botUsername={telegramBotUsername} isConnected={isTelegramConnected} />
        <PasswordChangeForm />
      </div>
    </div>
  );
}
