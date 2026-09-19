import Link from "next/link";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { User as UserIcon, LogOut } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/home/search-bar";
import { CategoryTabs } from "@/components/home/category-tabs";
import { LanguageToggle } from "@/components/dashboard/language-toggle";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notification-bell";

export async function SiteHeader({
  user,
  showCategories = false,
  searchDefaultValue,
  activeCategory,
}: {
  // Passed down from AppShell, which already fetched it -- this used to
  // call supabase.auth.getUser() again here too, a second real round trip
  // for information the caller already had, on every single page load.
  user: User | null;
  showCategories?: boolean;
  searchDefaultValue?: string;
  activeCategory?: string;
}) {
  const supabase = createClient();

  let avatarUrl: string | null = null;
  let initialNotifications: { id: string; title: string; message: string; link: string | null; is_read: boolean; created_at: string }[] = [];
  let categories: { id: string; slug: string; name: string; icon?: string | null; icon_url?: string | null; parent_id: string | null }[] = [];
  let allCategoryIconUrl: string | null = null;

  // Independent queries -- fetched together instead of one after another.
  const [profileResult, notifResult, categoriesResult, iconResult] = await Promise.all([
    user ? supabase.from("profiles").select("avatar_url").eq("id", user.id).single() : Promise.resolve({ data: null }),
    user
      ? supabase.from("notifications").select("id, title, message, link, is_read, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      : Promise.resolve({ data: null }),
    showCategories
      ? supabase.from("categories").select("id, slug, name, name_km, icon, icon_url, parent_id").eq("is_active", true).order("sort_order")
      : Promise.resolve({ data: null }),
    showCategories ? createAdminClient().from("platform_settings").select("all_category_icon_url").eq("id", 1).single() : Promise.resolve({ data: null }),
  ]);

  if (user) {
    avatarUrl = profileResult.data?.avatar_url ?? null;
    initialNotifications = notifResult.data ?? [];
  }
  if (showCategories) {
    categories = categoriesResult.data ?? [];
    allCategoryIconUrl = iconResult.data?.all_category_icon_url ?? null;
  }

  return (
    <div className="sticky top-0 z-30 border-b border-white/5 bg-background/95 px-4 pb-3 pt-4 backdrop-blur-sm md:px-6">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Link href="/" className="flex-shrink-0">
          <Logo size={32} />
        </Link>
        <div className="flex flex-shrink-0 items-center gap-1.5 md:order-3 md:ml-auto">
          <LanguageToggle />
            <ThemeToggle />
          {user ? (
            <>
              <NotificationBell userId={user.id} initialNotifications={initialNotifications} />
              <Link href="/account/profile" className="relative h-9 w-9 flex-shrink-0">
                <div className="relative h-full w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Profile" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/60">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-success" title="Online" />
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white/70 hover:bg-danger/10 hover:text-danger"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
        <div className="order-2 w-full md:order-none md:w-auto md:flex-1">
          <SearchBar defaultValue={searchDefaultValue} />
        </div>
      </div>

      {showCategories && (
        <CategoryTabs categories={categories} activeCategory={activeCategory} query={searchDefaultValue} allIconUrl={allCategoryIconUrl} />
      )}
    </div>
  );
}
