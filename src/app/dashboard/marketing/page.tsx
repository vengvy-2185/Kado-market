import { Megaphone } from "lucide-react";
import { getMyStoreOrRedirect } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { NewDiscountCodeForm } from "@/components/marketing/new-discount-code-form";
import { DiscountCodeRow } from "@/components/marketing/discount-code-row";

export default async function MarketingPage() {
  const { supabase, store } = await getMyStoreOrRedirect();

  const { data: codes } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-10">
      <div className="mb-6 flex items-center gap-2">
        <Megaphone className="h-6 w-6 text-accent" />
        <h1 className="text-2xl font-bold">Marketing</h1>
      </div>

      <div className="mb-6">
        <NewDiscountCodeForm />
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-white/70">Discount codes</h2>
        {!codes || codes.length === 0 ? (
          <p className="text-sm text-white/40">
            No discount codes yet. Create one above — customers enter it at checkout.
          </p>
        ) : (
          <div className="space-y-2">
            {codes.map((c) => (
              <DiscountCodeRow key={c.id} code={c} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
