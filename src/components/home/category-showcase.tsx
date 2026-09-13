"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HomeProductCard } from "@/components/home/home-product-card";
import { colorForIndex } from "@/lib/category-visuals";
import { cn } from "@/lib/utils";

type Product = Parameters<typeof HomeProductCard>[0]["product"];

export type ShowcaseSection = {
  category: { id: string; slug: string; name: string; icon: string | null; icon_url: string | null };
  colorIndex: number;
  viewAllHref: string;
  products: Product[];
};

export function CategoryShowcase({
  sections,
  isLoggedIn,
  savedProductIds,
  aiEnabledStoreIds,
}: {
  sections: ShowcaseSection[];
  isLoggedIn: boolean;
  savedProductIds: string[];
  aiEnabledStoreIds: string[];
}) {
  const savedSet = new Set(savedProductIds);
  const aiSet = new Set(aiEnabledStoreIds);

  // As each section scrolls into view, highlight the matching chip in the
  // sticky category bar above -- a passive visual sync, not a navigation,
  // so scrolling never disturbs the horizontal scroll position of any row.
  useEffect(() => {
    const sectionEls = Array.from(document.querySelectorAll<HTMLElement>("[data-showcase-section]"));
    if (sectionEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestSlug: string | null = null;
        let bestRatio = 0;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestSlug = entry.target.getAttribute("data-cat-slug");
          }
        }
        if (bestSlug) {
          document.querySelectorAll("[data-cat-chip]").forEach((el) => el.classList.remove("scrollspy-active"));
          document.querySelector(`[data-cat-chip="${bestSlug}"]`)?.classList.add("scrollspy-active");
        }
      },
      { rootMargin: "-140px 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sectionEls.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      document.querySelectorAll("[data-cat-chip]").forEach((el) => el.classList.remove("scrollspy-active"));
    };
  }, [sections]);

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.category.id} data-showcase-section data-cat-slug={section.category.slug} id={`section-${section.category.slug}`}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn("flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-sm", colorForIndex(section.colorIndex).bg)}>
                {section.category.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={section.category.icon_url} alt="" className="h-4 w-4 object-contain [filter:brightness(0)_invert(1)]" />
                ) : (
                  section.category.icon || "🏷️"
                )}
              </span>
              <h3 className="text-base font-bold text-white">{section.category.name}</h3>
            </div>
            <Link href={section.viewAllHref} className="text-xs font-semibold text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
            {section.products.map((p) => (
              <div key={p.id} className="w-40 flex-shrink-0 sm:w-48">
                <HomeProductCard product={p} isLoggedIn={isLoggedIn} isSaved={savedSet.has(p.id)} hasAiAssistant={aiSet.has(p.store_id)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
