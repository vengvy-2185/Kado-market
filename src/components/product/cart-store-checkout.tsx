"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { checkoutCartForStore } from "@/lib/actions/cart";
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

      {khqrInfo ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-white/60">
          You&apos;ll get a KHQR code to scan and pay right after this.
        </div>
      ) : (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] text-warning">
          DEMO PAYMENT MODE — this seller hasn&apos;t set up KHQR payments yet, no real charge will be made.
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" loading={submitting} className="w-full">
        {khqrInfo ? "Place order & pay with KHQR" : "Place order (Demo payment)"}
      </Button>
    </form>
  );
}
