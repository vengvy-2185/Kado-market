import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { CartItemRow } from "@/components/product/cart-item-row";
import { CartStoreCheckout } from "@/components/product/cart-store-checkout";
import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/dashboard/back-button";

type CartRow = {
  id: string;
  quantity: number;
  product_id: string;
  variant_id: string | null;
  products: {
    id: string;
    name: string;
    price: number;
    stock: number;
    store_id: string;
    product_images: { url: string; sort_order: number }[] | null;
    stores: { id: string; store_name: string; city: string | null; bakong_account_id: string | null; bakong_phone: string | null } | null;
  } | null;
  product_variants: { id: string; variant_name: string; price: number | null; stock: number } | null;
};

export default async function CartPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/cart");

  const { data: rawItems } = await supabase
    .from("cart_items")
    .select(
      "id, quantity, product_id, variant_id, products(id, name, price, stock, store_id, product_images(url, sort_order), stores(id, store_name, city, bakong_account_id, bakong_phone)), product_variants(id, variant_name, price, stock)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = (rawItems ?? []) as unknown as CartRow[];

  const { data: defaultAddress } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  const groups = new Map<string, { storeName: string; storeCity: string | null; bakongAccountId: string | null; bakongPhone: string | null; items: CartRow[] }>();
  for (const item of items) {
    if (!item.products) continue;
    const storeId = item.products.store_id;
    const storeInfo = item.products.stores;
    if (!groups.has(storeId)) {
      groups.set(storeId, {
        storeName: storeInfo?.store_name ?? "Store",
        storeCity: storeInfo?.city ?? null,
        bakongAccountId: storeInfo?.bakong_account_id ?? null,
        bakongPhone: storeInfo?.bakong_phone ?? null,
        items: [],
      });
    }
    groups.get(storeId)!.items.push(item);
  }

  return (
    <AppShell>
      <div className="px-4 py-6 md:px-6 md:py-8">
      <div className="mb-4">
        <BackButton />
      </div>
      <h1 className="mb-6 text-2xl font-bold">My Cart</h1>

      {groups.size === 0 ? (
        <Card>
          <p className="text-white/60">Your cart is empty — browse products and add something.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([storeId, group]) => {
            const subtotal = group.items.reduce((sum, item) => {
              const unitPrice = item.product_variants?.price ?? item.products!.price;
              return sum + unitPrice * item.quantity;
            }, 0);

            return (
              <Card key={storeId}>
                <h2 className="mb-2 text-sm font-semibold text-white/70">{group.storeName}</h2>
                <div>
                  {group.items.map((item) => {
                    const images = item.products!.product_images ?? [];
                    const thumb = [...images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
                    const unitPrice = item.product_variants?.price ?? item.products!.price;
                    const maxStock = item.product_variants?.stock ?? item.products!.stock;
                    const name = item.products!.name + (item.product_variants ? ` (${item.product_variants.variant_name})` : "");
                    return (
                      <CartItemRow
                        key={item.id}
                        id={item.id}
                        name={name}
                        image={thumb}
                        unitPrice={unitPrice}
                        quantity={item.quantity}
                        maxStock={maxStock}
                      />
                    );
                  })}
                </div>
                <p className="mb-4 mt-3 text-right text-sm font-semibold">Subtotal: ${subtotal.toFixed(2)}</p>
                <CartStoreCheckout
                  storeId={storeId}
                  savedAddress={defaultAddress ?? null}
                  subtotal={subtotal}
                  khqrInfo={
                    group.bakongAccountId && group.bakongPhone
                      ? { accountId: group.bakongAccountId, phone: group.bakongPhone, merchantName: group.storeName, merchantCity: group.storeCity }
                      : null
                  }
                />
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </AppShell>
  );
}
