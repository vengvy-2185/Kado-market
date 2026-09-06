import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  thumbnail: string | null;
};

export function FeaturedProducts({ products, title }: { products: Product[]; title: string }) {
  if (products.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-white/70">{title}</h2>
      <div className="space-y-2">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/products/${p.id}/edit`}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition-colors hover:bg-white/[0.06]"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/5">
              {p.thumbnail ? (
                <Image src={p.thumbnail} alt={p.name} width={44} height={44} className="h-11 w-11 object-cover" />
              ) : (
                <Package className="h-5 w-5 text-white/30" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.name}</p>
              <p className="text-xs text-white/40">Stock: {p.stock}</p>
            </div>
            <span className="text-sm font-semibold text-accent">${p.price}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
