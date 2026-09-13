import Link from "next/link";
import { cn } from "@/lib/utils";
import { colorForIndex } from "@/lib/category-visuals";

type Category = { slug: string; name: string; icon?: string | null; icon_url?: string | null; parent_id?: string | null; id?: string };

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
  // scannable no matter how finely a store owner splits things up (e.g.
  // "Food" instead of "Food", "Snacks", "Drinks", "Bakery" all as tabs).
  // Their sub-categories show up as a card panel below once that tab is
  // selected, one tap deeper rather than cluttering the main row.
  const topLevel = categories.filter((c) => !c.parent_id);
  const activeRow = categories.find((c) => c.slug === activeCategory);
  const activeTop = activeRow ? (activeRow.parent_id ? topLevel.find((t) => t.id === activeRow.parent_id) : activeRow) : undefined;
  const activeTopIndex = activeTop ? topLevel.findIndex((t) => t.id === activeTop.id) : -1;
  const children = activeTop ? categories.filter((c) => c.parent_id === activeTop.id) : [];
  const isTopActive = !activeCategory || activeCategory === activeTop?.slug;

  return (
    <div>
      <div id="categories" className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
        <Link href={hrefFor(undefined)} className="group flex w-16 flex-shrink-0 flex-col items-center gap-1.5 text-center">
          <span
            className={cn(
              "flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-xl shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:brightness-110 group-active:scale-95",
              !activeCategory ? "bg-brand-gradient shadow-[0_0_24px_rgba(168,85,247,0.55)]" : "bg-white/10 group-hover:bg-white/20"
            )}
          >
            {allIconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={allIconUrl} alt="" className="h-7 w-7 object-contain [filter:brightness(0)_invert(1)]" />
            ) : (
              "🏷️"
            )}
          </span>
          <span className={cn("text-xs font-medium transition-colors", !activeCategory ? "text-white" : "text-white/50 group-hover:text-white/80")}>All</span>
        </Link>
        {topLevel.map((c, i) => {
          const isActive = activeCategory === c.slug || activeTop?.slug === c.slug;
          return (
            <Link key={c.slug} href={hrefFor(c.slug)} className="group flex w-16 flex-shrink-0 flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-xl shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:brightness-110 group-active:scale-95",
                  colorForIndex(i).bg,
                  isActive && "shadow-[0_0_24px_rgba(255,255,255,0.45)]"
                )}
              >
                {c.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.icon_url} alt="" className="h-7 w-7 object-contain [filter:brightness(0)_invert(1)]" />
                ) : (
                  c.icon || "🏷️"
                )}
              </span>
              <span className={cn("truncate text-xs font-medium transition-colors", isActive ? "text-white" : "text-white/50 group-hover:text-white/80")}>
                {c.name}
              </span>
            </Link>
          );
        })}
      </div>

      {activeTop && children.length > 0 && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-white/70">{activeTop.name} categories</p>
            <Link
              href={hrefFor(activeTop.slug)}
              className={cn(
                "flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                isTopActive ? "bg-brand-gradient text-white shadow-glow" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
              )}
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {children.map((child, i) => {
              const isChildActive = activeCategory === child.slug;
              return (
                <Link
                  key={child.slug}
                  href={hrefFor(child.slug)}
                  className={cn(
                    "group flex flex-col items-center gap-1.5 rounded-xl p-2 text-center transition-colors",
                    isChildActive ? "bg-white/10" : "hover:bg-white/5"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center overflow-hidden rounded-full text-lg shadow-md transition-transform group-hover:scale-105",
                      colorForIndex(activeTopIndex + i + 1).bg,
                      isChildActive && "shadow-[0_0_16px_rgba(255,255,255,0.4)]"
                    )}
                  >
                    {child.icon_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={child.icon_url} alt="" className="h-6 w-6 object-contain [filter:brightness(0)_invert(1)]" />
                    ) : (
                      child.icon || "🏷️"
                    )}
                  </span>
                  <span className={cn("truncate text-[11px] font-medium leading-tight", isChildActive ? "text-white" : "text-white/60 group-hover:text-white/80")}>
                    {child.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
