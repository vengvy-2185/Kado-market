import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { colorForIndex } from "@/lib/category-visuals";

type Category = { slug: string; name: string; icon?: string | null; icon_url?: string | null; parent_id?: string | null; id?: string };

function CategoryIcon({ category, index, size = "lg" }: { category: Category; index: number; size?: "lg" | "sm" | "xs" }) {
  const dims = size === "lg" ? "h-14 w-14 text-xl" : size === "sm" ? "h-9 w-9 text-base" : "h-7 w-7 text-sm";
  const imgDims = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-5 w-5" : "h-4 w-4";
  return (
    <span className={cn("flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full shadow-md", dims, colorForIndex(index).bg)}>
      {category.icon_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={category.icon_url} alt="" className={cn(imgDims, "object-contain [filter:brightness(0)_invert(1)]")} />
      ) : (
        category.icon || "🏷️"
      )}
    </span>
  );
}

export function CategoryTabs({
  categories,
  activeCategory,
  query,
  allIconUrl,
}: {
  categories: Category[];
  activeCategory?: string;
  query?: string;
  allIconUrl?: string | null;
}) {
  function hrefFor(categorySlug?: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (categorySlug) params.set("category", categorySlug);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  // Only top-level categories get their own tab, so the row stays short and
  // scannable no matter how finely a store owner splits things up.
  const topLevel = categories.filter((c) => !c.parent_id);
  const activeRow = categories.find((c) => c.slug === activeCategory);
  const activeTop = activeRow ? (activeRow.parent_id ? topLevel.find((t) => t.id === activeRow.parent_id) : activeRow) : undefined;
  const activeTopIndex = activeTop ? topLevel.findIndex((t) => t.id === activeTop.id) : -1;
  const children = activeTop ? categories.filter((c) => c.parent_id === activeTop.id) : [];
  const isViewAllActive = activeCategory === activeTop?.slug;

  // No category picked yet ("All"): show the full top-level row, same as
  // any storefront category strip.
  if (!activeTop) {
    return (
      <div id="categories" className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
        <Link href={hrefFor(undefined)} className="group flex w-16 flex-shrink-0 flex-col items-center gap-1.5 text-center">
          <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brand-gradient text-xl shadow-lg shadow-[0_0_16px_rgba(168,85,247,0.35)] transition-all duration-200 group-hover:scale-110 group-hover:brightness-110 group-active:scale-95">
            {allIconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={allIconUrl} alt="" className="h-7 w-7 object-contain [filter:brightness(0)_invert(1)]" />
            ) : (
              "🏷️"
            )}
          </span>
          <span className="text-xs font-medium text-white">All</span>
        </Link>
        {topLevel.map((c, i) => (
          <Link key={c.slug} href={hrefFor(c.slug)} className="group flex w-16 flex-shrink-0 flex-col items-center gap-1.5 text-center">
            <div className="transition-transform group-hover:scale-110 group-active:scale-95">
              <CategoryIcon category={c} index={i} />
            </div>
            <span className="truncate text-xs font-medium text-white/50 group-hover:text-white/80">{c.name}</span>
          </Link>
        ))}
      </div>
    );
  }

  // A top-level category is selected: one compact scrollable row --
  // back to All, the current category, "View all <name>", then its
  // sub-categories as inline icon+label pills -- instead of the full top
  // row plus a separate panel underneath, which just doubled the height
  // for the same information.
  return (
    <div id="categories" className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
      <Link
        href={hrefFor(undefined)}
        className="flex flex-shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 py-2 pl-2.5 pr-3 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> All Categories
      </Link>

      <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white/5 py-1 pl-1 pr-3">
        <CategoryIcon category={activeTop} index={activeTopIndex} size="sm" />
        <span className="text-sm font-semibold text-white">{activeTop.name}</span>
      </div>

      {children.length > 0 && (
        <>
          <span className="h-6 w-px flex-shrink-0 bg-white/10" />
          <Link
            href={hrefFor(activeTop.slug)}
            className={cn(
              "flex-shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
              isViewAllActive ? "bg-brand-gradient text-white shadow-glow" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
            )}
          >
            View all
          </Link>
          {children.map((child, i) => {
            const isChildActive = activeCategory === child.slug;
            return (
              <Link
                key={child.slug}
                href={hrefFor(child.slug)}
                data-cat-chip={child.slug}
                className={cn(
                  "flex flex-shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-medium transition-colors",
                  isChildActive ? "bg-white/15 text-white" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                )}
              >
                <CategoryIcon category={child} index={activeTopIndex + i + 1} size="xs" />
                {child.name}
              </Link>
            );
          })}
        </>
      )}
    </div>
  );
}
