"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, X, Flame, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { duplicateProducts } from "@/lib/actions/products";
import { isNewProduct, isPopularProduct } from "@/lib/product-badges";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
  low_stock_threshold: number;
  slug: string;
  sales_count?: number | null;
  created_at?: string | null;
};

const LONG_PRESS_MS = 450;

export function ProductsListWithSelection({ products }: { products: Product[] }) {
  const router = useRouter();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [duplicating, setDuplicating] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function enterSelectionMode(id: string) {
    setSelectionMode(true);
    setSelected(new Set([id]));
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === products.length ? new Set() : new Set(products.map((p) => p.id))));
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelected(new Set());
  }

  function handlePressStart(id: string) {
    pressTimer.current = setTimeout(() => enterSelectionMode(id), LONG_PRESS_MS);
  }

  function handlePressEnd() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  async function handleDuplicate() {
    if (selected.size === 0) return;
    setDuplicating(true);
    try {
      const { count } = await duplicateProducts(Array.from(selected));
      exitSelectionMode();
      router.refresh();
      alert(`Duplicated ${count} product${count === 1 ? "" : "s"} as draft${count === 1 ? "" : "s"} — review and publish when ready.`);
    } finally {
      setDuplicating(false);
    }
  }

  return (
    <div>
      {selectionMode && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5">
          <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm font-medium text-white/80">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-md border-2",
                selected.size === products.length ? "border-primary bg-primary" : "border-white/30"
              )}
            >
              {selected.size === products.length && <Check className="h-3.5 w-3.5 text-white" />}
            </span>
            {selected.size} selected · Select all
          </button>
          <button onClick={exitSelectionMode} className="text-white/50 hover:text-white" aria-label="Cancel selection">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="space-y-3">
        {products.map((p) => {
          const isOutOfStock = p.stock === 0;
          const isLowStock = !isOutOfStock && p.stock <= p.low_stock_threshold;
          const isSelected = selected.has(p.id);

          const cardInner = (
            <Card
              className={cn(
                "flex items-center justify-between transition-colors",
                selectionMode ? (isSelected ? "border-primary bg-primary/5" : "border-white/10") : "hover:border-primary/40"
              )}
            >
              <div className="flex items-center gap-3">
                {selectionMode && (
                  <span
                    className={cn(
                      "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2",
                      isSelected ? "border-primary bg-primary" : "border-white/30"
                    )}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </span>
                )}
                <div>
                  <p className="flex flex-wrap items-center gap-1.5 font-semibold">
                    {p.name}
                    {isPopularProduct(p.sales_count) && (
                      <span className="flex items-center gap-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        <Flame className="h-2.5 w-2.5" /> Popular
                      </span>
                    )}
                    {!isPopularProduct(p.sales_count) && isNewProduct(p.created_at) && (
                      <span className="flex items-center gap-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        <Sparkles className="h-2.5 w-2.5" /> New
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-white/50">
                    ${p.price} ·{" "}
                    <span
                      className={cn(
                        isOutOfStock && "text-danger",
                        isLowStock && "text-warning",
                        !isOutOfStock && !isLowStock && "text-white/50"
                      )}
                    >
                      {isOutOfStock ? "OUT OF STOCK" : isLowStock ? `LOW STOCK (${p.stock})` : `Stock: ${p.stock}`}
                    </span>
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                  p.status === "active" && "bg-success/15 text-success",
                  p.status === "draft" && "bg-white/10 text-white/60",
                  p.status === "out_of_stock" && "bg-danger/15 text-danger",
                  p.status === "archived" && "bg-white/5 text-white/40"
                )}
              >
                {p.status.replace("_", " ")}
              </span>
            </Card>
          );

          return (
            <div
              key={p.id}
              onMouseDown={() => !selectionMode && handlePressStart(p.id)}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onTouchStart={() => !selectionMode && handlePressStart(p.id)}
              onTouchEnd={handlePressEnd}
            >
              {selectionMode ? (
                <button onClick={() => toggleSelected(p.id)} className="block w-full text-left">
                  {cardInner}
                </button>
              ) : (
                <Link href={`/dashboard/products/${p.id}/edit`}>{cardInner}</Link>
              )}
            </div>
          );
        })}
      </div>

      {selectionMode && selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface/95 p-4 backdrop-blur-sm md:sticky md:bottom-4 md:mt-4 md:rounded-2xl md:border">
          <div className="mx-auto flex max-w-4xl justify-end gap-2">
            <button
              onClick={handleDuplicate}
              disabled={duplicating}
              className="flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              <Copy className="h-4 w-4" />
              {duplicating ? "Duplicating..." : `Duplicate ${selected.size} product${selected.size === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
