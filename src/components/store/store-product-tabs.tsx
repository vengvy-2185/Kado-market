"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
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

  const filtered = active ? products.filter((p) => p.category_name === active) : products;

  return (
    <div>
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
        <p className="text-sm text-white/40">No products in this category.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((p) => {
            const images = p.product_images ?? [];
            const thumb = [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
            return (
              <div key={p.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-surface/60 transition-colors hover:border-primary/40">
                <Link href={`/product/${p.slug}`}>
                  <div className="aspect-square bg-white/5">
                    {thumb ? (
                      <Image src={thumb} alt={p.name} width={300} height={300} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-white/20">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link href={`/product/${p.slug}`}>
                    <p className="truncate text-sm font-medium">{p.name}</p>
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
