"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, ShoppingCart, MessageCircle, User, LogIn, Menu as MenuIcon, X, Store, ShoppingBag, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

export function MobileBottomNav({
  isLoggedIn,
  cartCount = 0,
  favoritesCount = 0,
  chatUnreadCount = 0,
}: {
  isLoggedIn: boolean;
  cartCount?: number;
  favoritesCount?: number;
  chatUnreadCount?: number;
}) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = isLoggedIn
    ? [
        { href: "#menu", label: "Menu", icon: MenuIcon, badge: 0, isMenu: true },
        { href: "/", label: t("bottom_nav_home"), icon: Home, badge: 0 },
        { href: "/cart", label: t("bottom_nav_cart"), icon: ShoppingCart, badge: cartCount },
        { href: "/account/profile", label: t("bottom_nav_profile"), icon: User, badge: 0 },
      ]
    : [
        { href: "/", label: t("bottom_nav_home"), icon: Home, badge: 0 },
        { href: "/login", label: t("bottom_nav_login"), icon: LogIn, badge: 0 },
      ];

  const menuLinks = [
    { href: "/account/orders", label: "My Orders", icon: ShoppingBag },
    { href: "/dashboard", label: "My Shop", icon: Store },
    { href: "/chat", label: "Messages", icon: MessageCircle, badge: chatUnreadCount },
    { href: "/account/favorites", label: "Favorites", icon: Heart, badge: favoritesCount },
    { href: "/account/profile", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-white/10 bg-surface p-4 pb-8"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-white/80">Menu</p>
              <button onClick={() => setMenuOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              {menuLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-white/70 hover:bg-white/5"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </span>
                    {Boolean(link.badge) && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-highlight px-1 text-[10px] font-bold text-white">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface/95 backdrop-blur-sm md:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-around px-1 py-2">
          {items.map((item) => {
            const isActive = !item.isMenu && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
            const Icon = item.icon;
            if (item.isMenu) {
              return (
                <button
                  key="menu"
                  onClick={() => setMenuOpen(true)}
                  className="relative flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[10px] font-medium text-white/50 transition-colors hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-accent" : "text-white/50 hover:text-white"
                )}
              >
                <span className="relative">
                  <Icon className={cn("h-5 w-5", isActive && "fill-accent/20")} />
                  {item.badge > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-highlight text-[9px] font-bold text-white">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
