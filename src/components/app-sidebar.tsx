"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Package, Store, MessageSquare, Heart, User as UserIcon, LogOut, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

export function AppSidebar({ isLoggedIn, hasStore }: { isLoggedIn: boolean; hasStore: boolean }) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/account/orders", label: "My Orders", icon: ShoppingBag },
    hasStore
      ? { href: "/dashboard", label: "My Shop", icon: Store }
      : { href: "/dashboard/store/setup", label: "Become a Seller", icon: Store },
    { href: "/chat", label: "Messages", icon: MessageSquare },
    { href: "/account/favorites", label: "Favorites", icon: Heart },
    { href: "/account/profile", label: "My Profile", icon: UserIcon },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-white/10 bg-surface/60 backdrop-blur-sm lg:flex">
      <Link href="/" className="flex items-center border-b border-white/10 px-5 py-4">
        <Logo size={30} />
      </Link>

      <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((link) => {
          const isHashLink = link.href.includes("#");
          const isActive = isHashLink ? false : link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
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

        {!hasStore && (
          <div className="mt-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-highlight/10 p-4 text-center">
            <Package className="mx-auto mb-2 h-7 w-7 text-accent" />
            <p className="mb-1 text-sm font-bold">Start Your Own Shop</p>
            <p className="mb-3 text-xs text-white/50">Join KADO MARKET and sell your products across Cambodia.</p>
            <Link
              href="/dashboard/store/setup"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-gradient py-2 text-xs font-semibold text-white"
            >
              Register Now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </nav>

      {isLoggedIn && (
        <form action="/auth/signout" method="post" className="border-t border-white/10 p-3">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </form>
      )}
    </aside>
  );
}
