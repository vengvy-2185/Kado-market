import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { MobileBottomNav } from "@/components/home/mobile-bottom-nav";
import { HomeRightPanel } from "@/components/home/home-right-panel";

export async function AppShell({
  children,
  showCategories = false,
  searchDefaultValue,
  activeCategory,
  rightPanel = false,
}: {
  children: React.ReactNode;
  showCategories?: boolean;
  searchDefaultValue?: string;
  activeCategory?: string;
  rightPanel?: boolean;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasStore = false;
  let cartCount = 0;
  let favoritesCount = 0;
  let chatUnreadCount = 0;

  if (user) {
    const { data: store } = await supabase.from("stores").select("id").eq("seller_id", user.id).maybeSingle();
    hasStore = Boolean(store);

    const [{ count: cCount }, { count: fCount }, { data: convIds }] = await Promise.all([
      supabase.from("cart_items").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("saved_products").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("conversations").select("id").or(`customer_id.eq.${user.id},store_id.eq.${store?.id ?? "00000000-0000-0000-0000-000000000000"}`),
    ]);
    cartCount = cCount ?? 0;
    favoritesCount = fCount ?? 0;

    if (convIds && convIds.length > 0) {
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in(
          "conversation_id",
          convIds.map((c) => c.id)
        )
        .is("read_at", null)
        .neq("sender_id", user.id);
      chatUnreadCount = count ?? 0;
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar isLoggedIn={Boolean(user)} hasStore={hasStore} />
      <div className="flex min-w-0 flex-1 flex-col">
        <SiteHeader showCategories={showCategories} searchDefaultValue={searchDefaultValue} activeCategory={activeCategory} />
        <main className="mx-auto w-full max-w-4xl flex-1 pb-20 lg:pb-8">{children}</main>
      </div>
      {rightPanel && <HomeRightPanel chatUnreadCount={chatUnreadCount} />}
      <MobileBottomNav isLoggedIn={Boolean(user)} cartCount={cartCount} favoritesCount={favoritesCount} chatUnreadCount={chatUnreadCount} />
    </div>
  );
}
