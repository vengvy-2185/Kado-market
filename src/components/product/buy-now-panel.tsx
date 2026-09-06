"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { addToCart } from "@/lib/actions/cart";

type Variant = { id: string; variant_name: string; price: number | null; stock: number };

export function BuyNowPanel({
  productId,
  price,
  stock,
  variants,
}: {
  productId: string;
  price: number;
  stock: number;
  variants: Variant[];
}) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const selectedVariant = variants.find((v) => v.id === variantId);
  const availableStock = variants.length > 0 ? selectedVariant?.stock ?? 0 : stock;
  const effectivePrice = variants.length > 0 ? selectedVariant?.price ?? price : price;
  const isOutOfStock = availableStock <= 0;

  function handleBuyNow() {
    const params = new URLSearchParams({ quantity: String(quantity) });
    if (variantId) params.set("variant", variantId);
    router.push(`/checkout/${productId}?${params.toString()}`);
  }

  function handleAddToCart() {
    const formData = new FormData();
    formData.set("product_id", productId);
    if (variantId) formData.set("variant_id", variantId);
    formData.set("quantity", String(quantity));
    startTransition(async () => {
      await addToCart(formData);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      {variants.length > 0 && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/60">Option</label>
          <Select value={variantId} onChange={(e) => setVariantId(e.target.value)}>
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                {v.variant_name} {v.stock <= 0 ? "(out of stock)" : ""}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-white/60">Qty</label>
        <div className="flex items-center rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-white/60 hover:text-white"
          >
            −
          </button>
          <span className="w-8 text-center text-sm">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
            className="px-3 py-2 text-white/60 hover:text-white"
          >
            +
          </button>
        </div>
        <span className="text-xs text-white/40">
          {isOutOfStock ? "Out of stock" : `${availableStock} available`}
        </span>
      </div>

      <p className="text-sm text-white/50">
        Total: <span className="font-semibold text-white">${(effectivePrice * quantity).toFixed(2)}</span>
      </p>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleAddToCart}
          disabled={isOutOfStock || isPending}
          className="flex-1"
        >
          <ShoppingCart className="h-4 w-4" />
          {added ? "Added!" : "Add to Cart"}
        </Button>
        <Button onClick={handleBuyNow} disabled={isOutOfStock} className="flex-1">
          {isOutOfStock ? "Out of stock" : "Buy Now"}
        </Button>
      </div>
    </div>
  );
}
