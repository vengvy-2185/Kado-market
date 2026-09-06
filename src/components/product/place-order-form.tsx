"use client";

import { useState } from "react";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { placeOrder } from "@/lib/actions/orders";
import { previewDiscount } from "@/lib/actions/marketing";
import { generateKhqr } from "@/lib/khqr";
import { KhqrDisplay } from "@/components/settings/khqr-display";
import type { Database } from "@/lib/types/database.types";

type Address = Database["public"]["Tables"]["addresses"]["Row"];
type KhqrInfo = { accountId: string; phone: string; merchantName: string; merchantCity: string | null };

export function PlaceOrderForm({
  productId,
  storeId,
  subtotal,
  variantId,
  quantity,
  savedAddress,
  khqrInfo,
}: {
  productId: string;
  storeId: string;
  subtotal: number;
  variantId: string | null;
  quantity: number;
  savedAddress: Address | null;
  khqrInfo?: KhqrInfo | null;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeMessage, setCodeMessage] = useState<string | null>(null);

  async function handleApplyCode() {
    if (!discountCode.trim()) return;
    setCheckingCode(true);
    setCodeMessage(null);
    const amount = await previewDiscount(storeId, discountCode, subtotal);
    setDiscountAmount(amount);
    setCodeMessage(amount > 0 ? `Code applied: -$${amount.toFixed(2)}` : "That code isn't valid for this order.");
    setCheckingCode(false);
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      await placeOrder(formData);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Something went wrong placing your order.");
    }
  }

  const total = Math.max(0, subtotal - discountAmount);

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="product_id" value={productId} />
      {variantId && <input type="hidden" name="variant_id" value={variantId} />}
      <input type="hidden" name="quantity" value={quantity} />
      <input type="hidden" name="discount_code" value={discountAmount > 0 ? discountCode : ""} />

      <Card className="space-y-4">
        <h2 className="text-lg font-bold">Shipping address</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" required defaultValue={savedAddress?.full_name ?? ""} />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" required defaultValue={savedAddress?.phone ?? ""} />
          </div>
        </div>
        <div>
          <Label htmlFor="address_line">Address</Label>
          <Textarea id="address_line" name="address_line" rows={2} required defaultValue={savedAddress?.address_line ?? ""} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={savedAddress?.city ?? ""} />
          </div>
          <div>
            <Label htmlFor="province">Province</Label>
            <Input id="province" name="province" defaultValue={savedAddress?.province ?? ""} />
          </div>
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" defaultValue={savedAddress?.country ?? "Cambodia"} />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/60">
          <input type="checkbox" name="save_address" defaultChecked={!savedAddress} className="rounded" />
          Save this address for next time
        </label>
      </Card>

      <Card className="space-y-3">
        <Label htmlFor="discount_code_input">Discount code (optional)</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <Input
              id="discount_code_input"
              value={discountCode}
              onChange={(e) => {
                setDiscountCode(e.target.value.toUpperCase());
                setDiscountAmount(0);
                setCodeMessage(null);
              }}
              placeholder="SUMMER20"
              className="pl-9 uppercase"
            />
          </div>
          <Button type="button" variant="outline" loading={checkingCode} onClick={handleApplyCode}>
            Apply
          </Button>
        </div>
        {codeMessage && <p className={discountAmount > 0 ? "text-sm text-success" : "text-sm text-danger"}>{codeMessage}</p>}
        <div className="border-t border-white/10 pt-3 text-right text-sm">
          <p className="text-white/50">Subtotal: ${subtotal.toFixed(2)}</p>
          {discountAmount > 0 && <p className="text-success">Discount: -${discountAmount.toFixed(2)}</p>}
          <p className="mt-1 text-base font-bold">Total: ${total.toFixed(2)}</p>
        </div>
      </Card>

      {khqrInfo && (
        <Card className="flex flex-col items-center gap-2">
          <p className="text-sm font-semibold text-white/70">Or pay now via KHQR</p>
          <KhqrDisplay
            khqrString={generateKhqr({
              bakongAccountId: khqrInfo.accountId,
              accountInformation: khqrInfo.phone,
              merchantName: khqrInfo.merchantName,
              merchantCity: khqrInfo.merchantCity ?? "Phnom Penh",
              amount: total,
              currency: "USD",
            })}
            merchantName={khqrInfo.merchantName}
            amountLabel={`$${total.toFixed(2)}`}
          />
          <p className="text-center text-xs text-white/40">
            Scanning is optional — placing the order below records it either way (demo mode).
          </p>
        </Card>
      )}

      <Card>
        <Label htmlFor="customer_note">Note to seller (optional)</Label>
        <Textarea id="customer_note" name="customer_note" rows={2} />
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" loading={submitting} className="w-full">
        Place order (Demo payment)
      </Button>
    </form>
  );
}
