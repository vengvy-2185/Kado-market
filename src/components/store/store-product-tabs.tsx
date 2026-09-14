"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickActions } from "@/components/product/quick-actions";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  category_name: string | null;
  product_images: { url: string; sort_order: number }[] | null;
};

export function StoreProductTabs({
  products,
  storeId,
  hasAiAssistant,
  isLoggedIn,
}: {
  products: Product[];
  storeId: string;
  hasAiAssistant: boolean;
  isLoggedIn: boolean;
}) {
  const categories = Array.from(new Set(products.map((p) => p.category_name).filter(Boolean))) as string[];
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = products
    .filter((p) => (active ? p.category_name === active : true))
    .filter((p) => (query.trim() ? p.name.toLowerCase().includes(query.trim().toLowerCase()) : true));

  return (
    <div>
      {products.length > 4 && (
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this shop's products..."
            className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary"
          />
        </div>
      )}

      {categories.length > 1 && (
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActive(null)}
            className={cn(
              "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              !active ? "bg-brand-gradient text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={cn(
                "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active === cat ? "bg-brand-gradient text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-white/40">No products match.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((p) => {
            const images = p.product_images ?? [];
            const thumb = [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
            return (
              <div key={p.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-surface/60 transition-colors hover:border-primary/40">
                <Link href={`/product/${p.slug}`}>
                  <div className="flex aspect-[4/5] items-center justify-center bg-white/5">
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt={p.name}
                        width={300}
                        height={300}
                        className="h-full w-full object-contain p-5 transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-white/20">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link href={`/product/${p.slug}`}>
                    <p className="line-clamp-2 min-h-[2.5em] text-sm font-medium leading-tight">{p.name}</p>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-sm font-semibold text-accent">${p.price}</p>
                      {p.compare_at_price && <p className="text-xs text-white/30 line-through">${p.compare_at_price}</p>}
                    </div>
                  </Link>
                  {isLoggedIn && <QuickActions productId={p.id} storeId={storeId} hasAiAssistant={hasAiAssistant} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
