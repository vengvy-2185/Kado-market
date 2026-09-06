"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { updateCartItemQuantity, removeCartItem } from "@/lib/actions/cart";

export function CartItemRow({
  id,
  name,
  image,
  unitPrice,
  quantity,
  maxStock,
}: {
  id: string;
  name: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}) {
  const [qty, setQty] = useState(quantity);
  const [isPending, startTransition] = useTransition();

  function changeQty(next: number) {
    const clamped = Math.max(0, Math.min(maxStock, next));
    setQty(clamped);
    startTransition(() => {
      updateCartItemQuantity(id, clamped);
    });
  }

  return (
    <div className="flex items-center gap-3 border-b border-white/5 py-3 last:border-0">
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
        {image && <Image src={image} alt={name} width={56} height={56} className="h-14 w-14 object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-white/40">${unitPrice} each</p>
      </div>
      <div className="flex items-center rounded-xl border border-white/10">
        <button onClick={() => changeQty(qty - 1)} disabled={isPending} className="px-2.5 py-1.5 text-white/60 hover:text-white">
          −
        </button>
        <span className="w-6 text-center text-sm">{qty}</span>
        <button onClick={() => changeQty(qty + 1)} disabled={isPending || qty >= maxStock} className="px-2.5 py-1.5 text-white/60 hover:text-white">
          +
        </button>
      </div>
      <button
        onClick={() => startTransition(() => removeCartItem(id))}
        className="rounded-lg p-1.5 text-white/40 hover:bg-danger/10 hover:text-danger"
        aria-label="Remove"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
