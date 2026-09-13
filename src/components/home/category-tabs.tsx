import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { colorForIndex } from "@/lib/category-visuals";

type Category = { slug: string; name: string; icon?: string | null; icon_url?: string | null; parent_id?: string | null; id?: string };

function CategoryIcon({ category, index, size = "lg" }: { category: Category; index: number; size?: "lg" | "sm" }) {
  const dims = size === "lg" ? "h-14 w-14 text-xl" : "h-11 w-11 text-lg";
  const imgDims = size === "lg" ? "h-7 w-7" : "h-6 w-6";
  return (
    <span className={cn("flex items-center justify-center overflow-hidden rounded-full shadow-md", dims, colorForIndex(index).bg)}>
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

  // No category picked yet ("All"): show the full top-level row, same as
  // any storefront category strip.
  if (!activeTop) {
    return (
      <div id="categories" className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
        <Link href={hrefFor(undefined)} className="group flex w-16 flex-shrink-0 flex-col items-center gap-1.5 text-center">
          <span
            className={cn(
              "flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-xl shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:brightness-110 group-active:scale-95",
              "bg-brand-gradient shadow-[0_0_24px_rgba(168,85,247,0.55)]"
            )}
          >
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

  // A top-level category is selected: collapse the full row down to a
  // single "back to All Categories" bar plus the selected category's own
  // sub-categories, instead of showing the whole top row AND a panel
  // underneath at the same time -- that combination just eats vertical
  // space without adding anything the back bar doesn't already cover.
  return (
    <div id="categories">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Link
          href={hrefFor(undefined)}
          className="flex flex-shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 py-1.5 pl-2 pr-3 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> All Categories
        </Link>
        <span className="flex flex-shrink-0 items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3">
          <CategoryIcon category={activeTop} index={activeTopIndex} size="sm" />
          <span className="text-sm font-semibold text-white">{activeTop.name}</span>
        </span>
      </div>

      {children.length > 0 && (
        <div className="no-scrollbar -mx-1 mt-2 flex gap-3 overflow-x-auto px-1 pb-1">
          {children.map((child, i) => {
            const isChildActive = activeCategory === child.slug;
            return (
              <Link
                key={child.slug}
                href={hrefFor(child.slug)}
                className={cn(
                  "group flex w-16 flex-shrink-0 flex-col items-center gap-1.5 rounded-xl p-2 text-center transition-colors",
                  isChildActive ? "bg-white/10" : "hover:bg-white/5"
                )}
              >
                <div className={cn("transition-transform group-hover:scale-105", isChildActive && "shadow-[0_0_16px_rgba(255,255,255,0.4)]")}>
                  <CategoryIcon category={child} index={activeTopIndex + i + 1} size="sm" />
                </div>
                <span className={cn("truncate text-[11px] font-medium leading-tight", isChildActive ? "text-white" : "text-white/60 group-hover:text-white/80")}>
                  {child.name}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
