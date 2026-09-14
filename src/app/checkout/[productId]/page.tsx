import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PlaceOrderForm } from "@/components/product/place-order-form";
import { BackButton } from "@/components/dashboard/back-button";
import { AppShell } from "@/components/app-shell";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { productId: string };
  searchParams: { quantity?: string; variant?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/checkout/${params.productId}`);

  const { data: product } = await supabase
    .from("products")
    .select("id, name, price, stock, status, store_id, product_images(url, sort_order), stores(store_name, city, bakong_account_id, bakong_phone)")
    .eq("id", params.productId)
    .eq("status", "active")
    .single();

  if (!product) notFound();

  const store = product.stores as unknown as { store_name: string; city: string | null; bakong_account_id: string | null; bakong_phone: string | null } | null;

  const quantity = Math.max(1, Number(searchParams.quantity ?? 1));
  const variantId = searchParams.variant || null;

  let unitPrice = product.price;
  let variantName: string | null = null;
  if (variantId) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("*")
      .eq("id", variantId)
      .single();
    if (variant) {
      unitPrice = variant.price ?? product.price;
      variantName = variant.variant_name;
    }
  }

  const images = ((product.product_images as { url: string; sort_order: number }[] | null) ?? []).sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const thumbnail = images[0]?.url ?? null;
  const total = Math.round(unitPrice * quantity * 100) / 100;

  const { data: savedAddress } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  const khqrInfo =
    store?.bakong_account_id && store?.bakong_phone
      ? { accountId: store.bakong_account_id, phone: store.bakong_phone, merchantName: store.store_name, merchantCity: store.city }
      : null;

  return (
    <AppShell>
      <main className="mx-auto max-w-lg px-4 py-10 md:px-6">
        <div className="mb-4">
          <BackButton />
        </div>
        <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

        <Card className="mb-6 flex items-center gap-3">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
            {thumbnail && <Image src={thumbnail} alt={product.name} width={64} height={64} className="h-16 w-16 object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              {product.name}
              {variantName ? ` (${variantName})` : ""}
            </p>
            <p className="text-sm text-white/50">Qty {quantity} × ${unitPrice}</p>
          </div>
          <p className="font-semibold text-accent">${total.toFixed(2)}</p>
        </Card>

        {khqrInfo ? (
          <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs text-white/70">
            After placing your order, you&apos;ll get a KHQR code to scan and pay — the order is confirmed automatically once payment clears.
          </div>
        ) : (
          <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning">
            DEMO PAYMENT MODE — this seller hasn&apos;t set up KHQR payments yet, so no real charge will be made. This confirms the order flow only.
          </div>
        )}

        <PlaceOrderForm
          productId={product.id}
          storeId={product.store_id}
          subtotal={total}
          variantId={variantId}
          quantity={quantity}
          savedAddress={savedAddress}
          khqrInfo={khqrInfo}
        />
      </main>
    </AppShell>
  );
}
