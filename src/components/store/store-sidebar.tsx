"use client";

import { Home, Grid3x3, Star, Info } from "lucide-react";

export function StoreSidebar({ reviewCount }: { reviewCount: number }) {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const items = [
    { label: "Home", icon: Home, onClick: () => scrollTo("store-top") },
    { label: "All Products", icon: Grid3x3, onClick: () => scrollTo("store-products") },
    { label: "About Shop", icon: Info, onClick: () => scrollTo("store-about") },
    { label: `Reviews (${reviewCount})`, icon: Star, onClick: () => scrollTo("store-reviews") },
  ];

  return (
    <aside className="sticky top-20 hidden h-fit w-56 flex-shrink-0 self-start lg:block">
      <nav className="space-y-1 rounded-2xl border border-white/10 bg-surface/40 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
