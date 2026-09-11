"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Package, Heart, MessageSquare, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account/profile", label: "My Profile", icon: User },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/favorites", label: "Favorites", icon: Heart },
  { href: "/chat", label: "Messages", icon: MessageSquare },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-16 hidden max-h-[calc(100vh-4rem)] w-56 flex-shrink-0 self-start overflow-y-auto border-r border-white/10 bg-surface/40 md:block">
      <nav className="flex flex-col gap-1 p-3">
        {LINKS.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
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
    </aside>
  );
}
