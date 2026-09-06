"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { createDiscountCode } from "@/lib/actions/marketing";

export function NewDiscountCodeForm() {
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      await createDiscountCode(formData);
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create code");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-white/70">New discount code</h2>
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" placeholder="SUMMER20" required className="uppercase" />
          </div>
          <div>
            <Label htmlFor="discount_type">Type</Label>
            <Select id="discount_type" name="discount_type" value={discountType} onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}>
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount off</option>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="value">{discountType === "percent" ? "Percent (%)" : "Amount ($)"}</Label>
            <Input id="value" name="value" type="number" step="0.01" min="0" max={discountType === "percent" ? 100 : undefined} required />
          </div>
          <div>
            <Label htmlFor="min_order_amount">Minimum order ($)</Label>
            <Input id="min_order_amount" name="min_order_amount" type="number" step="0.01" min="0" defaultValue="0" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="usage_limit">Usage limit (optional)</Label>
            <Input id="usage_limit" name="usage_limit" type="number" min="1" placeholder="Unlimited" />
          </div>
          <div>
            <Label htmlFor="expires_at">Expires on (optional)</Label>
            <Input id="expires_at" name="expires_at" type="date" />
          </div>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" loading={submitting} className="w-full">
          Create code
        </Button>
      </form>
    </Card>
  );
}
