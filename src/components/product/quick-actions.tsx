"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { addToCart } from "@/lib/actions/cart";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

export function QuickActions({
  productId,
}: {
  productId: string;
  storeId?: string;
  hasAiAssistant?: boolean;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const formData = new FormData();
    formData.set("product_id", productId);
    formData.set("quantity", "1");
    startTransition(async () => {
      await addToCart(formData);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    });
  }

  function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/checkout/${productId}?quantity=1`);
  }

  return (
    <div className="mt-2 flex gap-1.5">
      <button
        onClick={handleAddToCart}
        disabled={isPending}
        aria-label="Add to cart"
        className={cn(
          "flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs font-medium transition-colors hover:bg-white/10",
          added && "border-success/40 bg-success/10 text-success"
        )}
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        {added ? t("product_card_added") : t("product_card_cart")}
      </button>
      <button
        onClick={handleBuyNow}
        aria-label="Buy now"
        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-gradient py-1.5 text-xs font-semibold transition-all hover:brightness-110"
      >
        <Zap className="h-3.5 w-3.5" />
        {t("product_card_buy")}
      </button>
    </div>
  );
}
