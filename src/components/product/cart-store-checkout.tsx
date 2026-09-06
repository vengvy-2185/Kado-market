"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { checkoutCartForStore } from "@/lib/actions/cart";
import { generateKhqr } from "@/lib/khqr";
import { KhqrDisplay } from "@/components/settings/khqr-display";
import type { Database } from "@/lib/types/database.types";

type Address = Database["public"]["Tables"]["addresses"]["Row"];
type KhqrInfo = { accountId: string; phone: string; merchantName: string; merchantCity: string | null };

export function CartStoreCheckout({
  storeId,
  savedAddress,
  subtotal,
  khqrInfo,
}: {
  storeId: string;
  savedAddress: Address | null;
  subtotal: number;
  khqrInfo?: KhqrInfo | null;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      await checkoutCartForStore(formData);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Checkout failed.");
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-full">
        Checkout this store
      </Button>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <input type="hidden" name="store_id" value={storeId} />
      <p className="text-xs font-semibold text-white/60">Shipping address</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`fullname-${storeId}`}>Full name</Label>
          <Input id={`fullname-${storeId}`} name="full_name" required defaultValue={savedAddress?.full_name ?? ""} />
        </div>
        <div>
          <Label htmlFor={`phone-${storeId}`}>Phone</Label>
          <Input id={`phone-${storeId}`} name="phone" required defaultValue={savedAddress?.phone ?? ""} />
        </div>
      </div>
      <div>
        <Label htmlFor={`address-${storeId}`}>Address</Label>
        <Textarea id={`address-${storeId}`} name="address_line" rows={2} required defaultValue={savedAddress?.address_line ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`city-${storeId}`}>City</Label>
          <Input id={`city-${storeId}`} name="city" defaultValue={savedAddress?.city ?? ""} />
        </div>
        <div>
          <Label htmlFor={`country-${storeId}`}>Country</Label>
          <Input id={`country-${storeId}`} name="country" defaultValue={savedAddress?.country ?? "Cambodia"} />
        </div>
      </div>

      <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] text-warning">
        DEMO PAYMENT MODE — no real charge will be made.
      </div>

      {khqrInfo && (
        <div className="flex flex-col items-center gap-2 py-2">
          <p className="text-xs font-semibold text-white/60">Or pay now via KHQR</p>
          <KhqrDisplay
            khqrString={generateKhqr({
              bakongAccountId: khqrInfo.accountId,
              accountInformation: khqrInfo.phone,
              merchantName: khqrInfo.merchantName,
              merchantCity: khqrInfo.merchantCity ?? "Phnom Penh",
              amount: subtotal,
              currency: "USD",
            })}
            size={160}
            merchantName={khqrInfo.merchantName}
            amountLabel={`$${subtotal.toFixed(2)}`}
          />
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" loading={submitting} className="w-full">
        Place order (Demo payment)
      </Button>
    </form>
  );
}
