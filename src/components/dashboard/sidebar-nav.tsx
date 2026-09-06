"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { SELLER_NAV } from "./nav-config";
import { useLanguage } from "@/lib/i18n/language-context";

export function SidebarNav({
  onNavigate,
  badges = {},
}: {
  onNavigate?: () => void;
  badges?: Partial<Record<string, number>>;
}) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
      {SELLER_NAV.map((item) => {
        const isActive = item.href
          ? item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href)
          : false;
        const Icon = item.icon;
        const label = t(item.labelKey);
        const badgeCount = badges[item.labelKey] ?? 0;

        if (!item.href) {
          return (
            <div
              key={item.labelKey}
              className="flex cursor-not-allowed items-center justify-between rounded-xl px-3 py-2.5 text-sm text-white/30"
              title="Coming in a later phase"
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {label}
              </span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/30">
                {t("soon")}
              </span>
            </div>
          );
        }

        return (
          <Link
            key={item.labelKey}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-gradient text-white shadow-glow"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <span className="flex items-center gap-3">
              <Icon className="h-4 w-4" />
              {label}
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

export function SidebarLogout() {
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
