import Link from "next/link";
import Image from "next/image";
import { Store, ShieldCheck } from "lucide-react";

type ShopSummary = { store_name: string; slug: string; verified: boolean; logo_url: string | null; product_count: number };

export function PopularShopsRow({ shops }: { shops: ShopSummary[] }) {
  if (shops.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-white/70">🛍️ Popular Shops</h2>
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 md:-mx-6 md:px-6">
        {shops.map((s) => (
          <Link key={s.slug} href={`/store/${s.slug}`} className="group flex w-20 flex-shrink-0 flex-col items-center gap-1.5 text-center">
            <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 transition-all duration-200 group-hover:scale-105 group-hover:border-primary/50 group-hover:shadow-[0_0_16px_rgba(124,58,237,0.35)]">
              {s.logo_url ? (
                <Image src={s.logo_url} alt={s.store_name} width={64} height={64} className="h-full w-full object-cover" />
              ) : (
                <Store className="h-6 w-6 text-white/30" />
              )}
              {s.verified && (
                <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                </span>
              )}
            </div>
            <p className="w-full truncate text-xs font-medium text-white/70 transition-colors group-hover:text-white">{s.store_name}</p>
            <p className="text-[10px] text-white/30">{s.product_count} products</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
