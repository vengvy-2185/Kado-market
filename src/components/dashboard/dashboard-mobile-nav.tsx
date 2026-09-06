"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, PlusCircle, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/posts/new", label: "Post", icon: PlusCircle, isCta: true },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
  { href: "/dashboard/store", label: "Store", icon: Store },
];

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-white/10 bg-surface/95 px-2 py-2 backdrop-blur-sm md:hidden">
      {ITEMS.map((item) => {
        const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
        const Icon = item.icon;

        if (item.isCta) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-gradient shadow-glow"
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors",
              isActive ? "text-accent" : "text-white/50 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
