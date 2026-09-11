"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "best_selling", label: "Best Selling" },
];

export function ProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");

  const currentSort = searchParams.get("sort") ?? "";
  const activeCount = [searchParams.get("minPrice"), searchParams.get("maxPrice"), searchParams.get("location")].filter(Boolean).length;

  function buildUrl(overrides: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function applyFilters() {
    router.push(buildUrl({ minPrice: minPrice.trim(), maxPrice: maxPrice.trim(), location: location.trim() }));
    setOpen(false);
  }

  function clearFilters() {
    setMinPrice("");
    setMaxPrice("");
    setLocation("");
    router.push(buildUrl({ minPrice: null, maxPrice: null, location: null }));
    setOpen(false);
  }

  function changeSort(value: string) {
    router.push(buildUrl({ sort: value || null }));
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
            activeCount > 0 ? "bg-brand-gradient text-white shadow-glow" : "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/25 px-1 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute left-0 z-40 mt-2 w-72 rounded-2xl border border-primary/20 bg-surface p-4 shadow-2xl shadow-black/50">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Filters</p>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mb-1 block text-xs font-medium text-accent">Price range ($)</label>
            <div className="mb-3 flex items-center gap-2">
              <input
                type="number"
                min={0}
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none focus:border-primary"
              />
              <span className="text-white/30">–</span>
              <input
                type="number"
                min={0}
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none focus:border-primary"
              />
            </div>

            <label className="mb-1 block text-xs font-medium text-accent">Location (city or province)</label>
            <input
              type="text"
              placeholder="e.g. Phnom Penh"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mb-4 w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none focus:border-primary"
            />

            <div className="flex gap-2">
              <button onClick={clearFilters} className="flex-1 rounded-xl border border-white/15 py-2 text-sm text-white/60 hover:bg-white/5">
                Clear
              </button>
              <button onClick={applyFilters} className="flex-1 rounded-xl bg-brand-gradient py-2 text-sm font-semibold text-white shadow-glow">
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      <select
        value={currentSort}
        onChange={(e) => changeSort(e.target.value)}
        className={cn(
          "rounded-full px-3.5 py-2 text-xs font-semibold outline-none transition-colors",
          currentSort ? "bg-brand-gradient text-white" : "border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20"
        )}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface text-white">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
