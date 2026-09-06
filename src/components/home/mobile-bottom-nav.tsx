"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, ShoppingCart, MessageCircle, User, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const items = isLoggedIn
    ? [
        { href: "/", label: "Home", icon: Home, badge: 0 },
        { href: "/chat", label: "Chat", icon: MessageCircle, badge: chatUnreadCount },
        { href: "/cart", label: "Cart", icon: ShoppingCart, badge: cartCount },
        { href: "/account/favorites", label: "Favorites", icon: Heart, badge: favoritesCount },
        { href: "/account/profile", label: "Profile", icon: User, badge: 0 },
      ]
    : [
        { href: "/", label: "Home", icon: Home, badge: 0 },
        { href: "/login", label: "Log in", icon: LogIn, badge: 0 },
      ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface/95 backdrop-blur-sm md:hidden">
      <div className="mx-auto flex max-w-4xl items-center justify-around px-1 py-2">
        {items.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
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
  );
}
