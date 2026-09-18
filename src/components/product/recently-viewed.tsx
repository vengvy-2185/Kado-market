"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/language-context";

const STORAGE_KEY = "kado-market-recently-viewed";
const MAX_ITEMS = 12;

type RecentProduct = { id: string; slug: string; name: string; price: number; image: string | null };

function readRecent(): RecentProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentProduct[]) : [];
  } catch {
    return [];
  }
}

/** Renders nothing -- just records the current product as "recently
 * viewed" in localStorage so RecentlyViewedStrip can show it elsewhere.
 * Kept as its own component (rather than inline in the page) so the
 * product page itself stays a server component. */
export function RecordRecentlyViewed({ product }: { product: RecentProduct }) {
  useEffect(() => {
    try {
      const existing = readRecent().filter((p) => p.id !== product.id);
      const next = [product, ...existing].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable (private mode, quota, etc) -- not worth surfacing an error for this
    }
  }, [product]);

  return null;
}

export function RecentlyViewedStrip({ excludeProductId }: { excludeProductId?: string }) {
  const { t } = useLanguage();
  const [items, setItems] = useState<RecentProduct[] | null>(null);

  useEffect(() => {
    setItems(readRecent().filter((p) => p.id !== excludeProductId));
  }, [excludeProductId]);

  if (!items || items.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-white/70">{t("recently_viewed")}</h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {items.map((p) => (
          <Link key={p.id} href={`/product/${p.slug}`} className="w-28 flex-shrink-0 sm:w-32">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white/5">
              {p.image ? (
                <Image src={p.image} alt={p.name} width={128} height={128} className="h-full w-full object-contain p-2" />
              ) : (
                <div className="h-full w-full bg-white/5" />
              )}
            </div>
            <p className="mt-1.5 line-clamp-1 text-xs text-white/70">{p.name}</p>
            <p className="text-xs font-semibold text-accent">${p.price}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
