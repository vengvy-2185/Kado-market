import Link from "next/link";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string; icon?: string | null; icon_url?: string | null };

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
}: {
  categories: Category[];
  activeCategory?: string;
  query?: string;
}) {
  function hrefFor(categorySlug?: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (categorySlug) params.set("category", categorySlug);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  return (
    <div className="relative">
      <div id="categories" className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
        <Link href={hrefFor(undefined)} className="group flex w-16 flex-shrink-0 flex-col items-center gap-1.5 text-center">
          <span
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full text-xl shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:brightness-110 group-active:scale-95",
              !activeCategory ? "bg-brand-gradient shadow-[0_0_24px_rgba(168,85,247,0.55)]" : "bg-white/10 group-hover:bg-white/20"
            )}
          >
            🏷️
          </span>
          <span className={cn("text-xs font-medium transition-colors", !activeCategory ? "text-white" : "text-white/50 group-hover:text-white/80")}>All</span>
        </Link>
        {categories.map((c, i) => {
          const isActive = activeCategory === c.slug;
          return (
            <Link key={c.slug} href={hrefFor(c.slug)} className="group flex w-16 flex-shrink-0 flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-xl shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:brightness-110 group-active:scale-95",
                  !c.icon_url && CIRCLE_COLORS[i % CIRCLE_COLORS.length],
                  isActive && "shadow-[0_0_24px_rgba(255,255,255,0.45)]"
                )}
              >
                {c.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.icon_url} alt="" className="h-full w-full object-cover" />
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
      {/* Soft fade at both edges to hint there's more to scroll — not a harsh cutoff */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent md:from-background" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent md:from-background" />
    </div>
  );
}
