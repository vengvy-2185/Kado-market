import Link from "next/link";
import Image from "next/image";
import { Package, ShieldCheck } from "lucide-react";
import { SaveButton } from "@/components/product/save-button";
import { QuickActions } from "@/components/product/quick-actions";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  store_id: string;
  product_images: { url: string; sort_order: number }[] | null;
  stores: { store_name: string; slug: string; verified: boolean } | null;
};

export function HomeProductCard({
  product,
  isLoggedIn,
  isSaved,
  hasAiAssistant,
}: {
  product: Product;
  isLoggedIn: boolean;
  isSaved: boolean;
  hasAiAssistant: boolean;
}) {
  const images = product.product_images ?? [];
  const thumb = [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
  const store = product.stores;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-surface/60 transition-colors hover:border-primary/40">
      {isLoggedIn && <SaveButton productId={product.id} initialSaved={isSaved} />}
      <Link href={`/product/${product.slug}`}>
        <div className="aspect-square bg-white/5">
          {thumb ? (
            <Image src={thumb} alt={product.name} width={300} height={300} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-white/20">
              <Package className="h-8 w-8" />
            </div>
          )}
        </div>
      </Link>
      <div className="p-3">
        {store && (
          <Link href={`/store/${store.slug}`} className="mb-1 flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70">
            {store.store_name}
            {store.verified && <ShieldCheck className="h-3 w-3 text-accent" />}
          </Link>
        )}
        <Link href={`/product/${product.slug}`}>
          <p className="truncate text-sm font-medium">{product.name}</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-sm font-semibold text-accent">${product.price}</p>
            {product.compare_at_price && <p className="text-xs text-white/30 line-through">${product.compare_at_price}</p>}
          </div>
        </Link>
        {isLoggedIn && <QuickActions productId={product.id} storeId={product.store_id} hasAiAssistant={hasAiAssistant} />}
      </div>
    </div>
  );
}
