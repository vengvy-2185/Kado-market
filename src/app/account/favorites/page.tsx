import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { SaveButton } from "@/components/product/save-button";
import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/dashboard/back-button";

export default async function FavoritesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account/favorites");

  const { data: savedRaw } = await supabase
    .from("saved_products")
    .select("product_id, products(id, name, slug, price, status, product_images(url, sort_order))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  type SavedRow = {
    product_id: string;
    products: { id: string; name: string; slug: string; price: number; status: string; product_images: { url: string; sort_order: number }[] | null } | null;
  };
  const saved = (savedRaw ?? []) as unknown as SavedRow[];

  const products = saved.map((s) => s.products).filter((p): p is NonNullable<typeof p> => Boolean(p) && p!.status === "active");

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-4">
        <BackButton />
      </div>
      <h1 className="mb-6 text-2xl font-bold">My Favorites</h1>

      {products.length === 0 ? (
        <Card>
          <p className="text-white/60">No saved products yet — tap the heart on any product to save it here.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => {
            const images = p.product_images ?? [];
            const thumb = [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
            return (
              <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-surface/60">
                <SaveButton productId={p.id} initialSaved />
                <Link href={`/product/${p.slug}`}>
                  <div className="aspect-square bg-white/5">
                    {thumb ? (
                      <Image src={thumb} alt={p.name} width={300} height={300} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-white/20">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-sm font-semibold text-accent">${p.price}</p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </AppShell>
  );
}
