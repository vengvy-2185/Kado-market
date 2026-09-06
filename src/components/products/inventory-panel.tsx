"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database.types";
import { adjustStock, updateLowStockThreshold } from "@/lib/actions/products";

type Product = Pick<Database["public"]["Tables"]["products"]["Row"], "id" | "name" | "stock" | "low_stock_threshold" | "sku">;
type Txn = Database["public"]["Tables"]["inventory_transactions"]["Row"] & { products: { name: string } | null };

export function InventoryPanel({ products, transactions }: { products: Product[]; transactions: Txn[] }) {
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      await adjustStock(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Adjustment failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white/80">Current stock</h2>
        {products.length === 0 && (
          <Card>
            <p className="text-white/60">No products yet.</p>
          </Card>
        )}
        {products.map((p) => {
          const isOut = p.stock === 0;
          const isLow = !isOut && p.stock <= p.low_stock_threshold;
          return (
            <Card key={p.id} className="flex items-center justify-between py-4">
              <div>
                <p className="font-semibold">{p.name}</p>
                {p.sku && <p className="text-xs text-white/40">SKU: {p.sku}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isOut && "text-danger",
                    isLow && "text-warning",
                    !isOut && !isLow && "text-success"
                  )}
                >
                  Stock: {p.stock}
                  {isOut && " · OUT OF STOCK"}
                  {isLow && " · LOW STOCK"}
                </span>
                <label className="flex items-center gap-1 text-xs text-white/40">
                  Alert at
                  <input
                    type="number"
                    min={0}
                    defaultValue={p.low_stock_threshold}
                    className="w-14 rounded-lg border border-white/10 bg-white/5 px-1.5 py-1 text-center text-white"
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v !== p.low_stock_threshold) startTransition(() => updateLowStockThreshold(p.id, v));
                    }}
                  />
                </label>
              </div>
            </Card>
          );
        })}

        <h2 className="pt-4 text-lg font-semibold text-white/80">Recent transactions</h2>
        <Card className="divide-y divide-white/10 p-0">
          {transactions.length === 0 && <p className="p-4 text-sm text-white/50">No transactions yet.</p>}
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p>{t.products?.name ?? "—"}</p>
                <p className="text-xs text-white/40">
                  {t.type.replace("_", " ")} {t.reason ? `· ${t.reason}` : ""}
                </p>
              </div>
              <span className={cn("font-semibold", t.quantity >= 0 ? "text-success" : "text-danger")}>
                {t.quantity >= 0 ? "+" : ""}
                {t.quantity}
              </span>
            </div>
          ))}
        </Card>
      </div>

      <Card className="h-fit">
        <h2 className="mb-4 text-lg font-bold">Adjust stock</h2>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Product</label>
            <Select name="product_id" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Type</label>
            <Select name="direction" defaultValue="stock_in">
              <option value="stock_in">Stock in (restock)</option>
              <option value="stock_out">Stock out (sold/damaged)</option>
              <option value="adjustment">Manual adjustment</option>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Quantity</label>
            <Input name="quantity" type="number" min="1" required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Reason (optional)</label>
            <Input name="reason" placeholder="e.g. Supplier delivery" />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" loading={submitting} className="w-full">
            Apply adjustment
          </Button>
        </form>
      </Card>
    </div>
  );
}
