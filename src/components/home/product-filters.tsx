"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

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
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-highlight px-1 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute left-0 z-40 mt-2 w-72 rounded-2xl border border-white/10 bg-surface p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Filters</p>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mb-1 block text-xs text-white/50">Price range ($)</label>
            <div className="mb-3 flex items-center gap-2">
              <input
                type="number"
                min={0}
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm"
              />
              <span className="text-white/30">–</span>
              <input
                type="number"
                min={0}
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm"
              />
            </div>

            <label className="mb-1 block text-xs text-white/50">Location (city or province)</label>
            <input
              type="text"
              placeholder="e.g. Phnom Penh"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm"
            />

            <div className="flex gap-2">
              <button onClick={clearFilters} className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-white/60 hover:bg-white/5">
                Clear
              </button>
              <button onClick={applyFilters} className="flex-1 rounded-xl bg-brand-gradient py-2 text-sm font-semibold">
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      <select
        value={currentSort}
        onChange={(e) => changeSort(e.target.value)}
        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 outline-none"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
