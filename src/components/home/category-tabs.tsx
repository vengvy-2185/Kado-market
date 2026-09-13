import Link from "next/link";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string; icon?: string | null; icon_url?: string | null; parent_id?: string | null; id?: string };

const CIRCLE_COLORS = [
  "bg-gradient-to-br from-pink-500 to-rose-500",
  "bg-gradient-to-br from-blue-500 to-cyan-500",
  "bg-gradient-to-br from-fuchsia-500 to-pink-400",
  "bg-gradient-to-br from-emerald-500 to-teal-500",
  "bg-gradient-to-br from-orange-500 to-amber-500",
  "bg-gradient-to-br from-indigo-500 to-violet-500",
  "bg-gradient-to-br from-red-500 to-orange-500",
  "bg-gradient-to-br from-sky-500 to-blue-400",
  "bg-gradient-to-br from-purple-500 to-fuchsia-500",
  "bg-gradient-to-br from-teal-500 to-emerald-400",
];

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
  // Their sub-categories show up as a second row of small chips once that
  // tab is selected, one tap deeper rather than cluttering the main row.
  const topLevel = categories.filter((c) => !c.parent_id);
  const activeRow = categories.find((c) => c.slug === activeCategory);
  const activeTop = activeRow ? (activeRow.parent_id ? topLevel.find((t) => t.id === activeRow.parent_id) : activeRow) : undefined;
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
                  CIRCLE_COLORS[i % CIRCLE_COLORS.length],
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
        <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
          <Link
            href={hrefFor(activeTop.slug)}
            className={cn(
              "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              isTopActive ? "bg-brand-gradient text-white shadow-glow" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
            )}
          >
            All {activeTop.name}
          </Link>
          {children.map((child) => {
            const isChildActive = activeCategory === child.slug;
            return (
              <Link
                key={child.slug}
                href={hrefFor(child.slug)}
                className={cn(
                  "flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  isChildActive ? "bg-brand-gradient text-white shadow-glow" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                )}
              >
                {child.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={child.icon_url} alt="" className="h-3.5 w-3.5 object-contain" />
                ) : (
                  child.icon && <span>{child.icon}</span>
                )}
                {child.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
