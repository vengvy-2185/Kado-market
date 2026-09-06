"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { savePlatformKhqr } from "@/lib/actions/platform-settings";
import { generateKhqr } from "@/lib/khqr";
import { KhqrDisplay } from "@/components/settings/khqr-display";

export function PlatformKhqrForm({
  initialAccountId,
  initialPhone,
  initialName,
  initialCity,
}: {
  initialAccountId: string | null;
  initialPhone: string | null;
  initialName: string;
  initialCity: string;
}) {
  const [accountId, setAccountId] = useState(initialAccountId ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState(initialCity);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setSaved(false);
    try {
      await savePlatformKhqr(formData);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const previewString =
    accountId && phone
      ? generateKhqr({ bakongAccountId: accountId, accountInformation: phone, merchantName: name, merchantCity: city, amount: 1, currency: "USD" })
      : null;

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-white/70">Platform KHQR (receives seller payments)</h2>
      <p className="mb-4 text-xs text-white/40">
        This is KADO MARKET&apos;s own Bakong account — used to show a QR code to sellers when
        they subscribe to a store plan, AI Assistant plan, or boost a post/product.
      </p>
      <form action={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label htmlFor="platform_name">Platform / merchant name</Label>
            <Input id="platform_name" name="platform_name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="platform_city">City</Label>
            <Input id="platform_city" name="platform_city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bakong_account_id">Bakong Account ID</Label>
            <Input id="bakong_account_id" name="bakong_account_id" placeholder="kadomarket@bank" value={accountId} onChange={(e) => setAccountId(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="bakong_phone">Phone / account number</Label>
            <Input id="bakong_phone" name="bakong_phone" placeholder="855912345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button type="submit" loading={saving} className="w-full">
            Save
          </Button>
          {saved && <p className="text-sm text-success">Saved.</p>}
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          {previewString ? (
            <KhqrDisplay khqrString={previewString} size={160} merchantName={name} amountLabel="$1.00 (preview)" />
          ) : (
            <p className="text-center text-xs text-white/30">Fill in the account details to preview</p>
          )}
        </div>
      </form>
    </Card>
  );
}
