"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, Package, Store, MessageSquare, Heart, Settings, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CustomerSidebar({ isLoggedIn, hasStore }: { isLoggedIn: boolean; hasStore: boolean }) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/#categories", label: "All Categories", icon: LayoutGrid },
    { href: "/account/orders", label: "My Orders", icon: ShoppingBag },
    { href: hasStore ? "/dashboard" : "/dashboard/store/setup", label: "My Shop", icon: Store },
    { href: "/chat", label: "Messages", icon: MessageSquare },
    { href: "/account/favorites", label: "Favorites", icon: Heart },
    { href: "/account/profile", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="sticky top-20 hidden h-fit w-56 flex-shrink-0 lg:block">
      <nav className="space-y-1 rounded-2xl border border-white/10 bg-surface/40 p-3">
        {links.map((link) => {
          const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href.split("#")[0]) && link.href !== "/";
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              href={isLoggedIn || link.href === "/" || link.href === "/#categories" ? link.href : "/login"}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-brand-gradient text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {!hasStore && (
        <div className="mt-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-highlight/10 p-4 text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-accent" />
          <p className="mb-1 text-sm font-bold">Start Your Own Shop</p>
          <p className="mb-3 text-xs text-white/50">Join KADO MARKET and sell your products to customers across Cambodia.</p>
          <Link
            href="/dashboard/store/setup"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-gradient py-2 text-xs font-semibold text-white"
          >
            Register Now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </aside>
  );
}
