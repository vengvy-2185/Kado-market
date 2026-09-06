import Link from "next/link";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string };

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
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:-mx-6 md:px-6">
      <Link
        href={hrefFor(undefined)}
        className={cn(
          "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
          !activeCategory ? "bg-brand-gradient text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
        )}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={hrefFor(c.slug)}
          className={cn(
            "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            activeCategory === c.slug ? "bg-brand-gradient text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
          )}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
