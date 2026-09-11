"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { Logo } from "@/components/logo";
import { ADMIN_NAV } from "./admin-nav-config";

export function AdminSidebarNav({
  onNavigate,
  badges = {},
}: {
  onNavigate?: () => void;
  badges?: { pendingStores?: number; openTickets?: number; recentErrors?: number };
}) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
      {ADMIN_NAV.map((item) => {
        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const Icon = item.icon;
        const badgeCount = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-brand-gradient text-white shadow-glow" : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <span className="flex items-center gap-3">
              <Icon className="h-4 w-4" />
              {t(item.labelKey)}
            </span>
            {badgeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-highlight px-1.5 text-[10px] font-bold text-white">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebarHeader() {
  const { t } = useLanguage();
  return (
    <div className="border-b border-white/10 p-4">
      <Link href="/admin" className="mb-4 block">
        <Logo size={28} />
      </Link>
      <div className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-gradient">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{t("super_admin")}</p>
          <p className="text-xs text-white/50">{t("platform_control")}</p>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebarLogout() {
  const { t } = useLanguage();
  return (
    <form action="/auth/signout" method="post" className="border-t border-white/10 p-3">
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-danger/10 hover:text-danger"
      >
        <LogOut className="h-4 w-4" />
        {t("nav_logout")}
      </button>
    </form>
  );
}
