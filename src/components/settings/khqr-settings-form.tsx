"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { saveKhqrInfo } from "@/lib/actions/settings";
import { generateKhqr } from "@/lib/khqr";
import { KhqrDisplay } from "./khqr-display";

export function KhqrSettingsForm({
  storeName,
  storeCity,
  initialAccountId,
  initialPhone,
}: {
  storeName: string;
  storeCity: string | null;
  initialAccountId: string | null;
  initialPhone: string | null;
}) {
  const [accountId, setAccountId] = useState(initialAccountId ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setSaved(false);
    await saveKhqrInfo(formData);
    setSaving(false);
    setSaved(true);
  }

  const previewString =
    accountId && phone
      ? generateKhqr({
          bakongAccountId: accountId,
          accountInformation: phone,
          merchantName: storeName,
          merchantCity: storeCity ?? "Phnom Penh",
          amount: 1,
          currency: "USD",
        })
      : null;

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-white/70">KHQR payment (Bakong)</h2>
      <p className="mb-4 text-xs text-white/40">
        Enter your Bakong account details to show a real, scannable KHQR code to customers at
        checkout. Payment confirmation is still manual — check your banking app and mark the
        order as paid.
      </p>
      <form action={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label htmlFor="bakong_account_id">Bakong Account ID</Label>
            <Input
              id="bakong_account_id"
              name="bakong_account_id"
              placeholder="yourname@bank"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bakong_phone">Phone / account number</Label>
            <Input
              id="bakong_phone"
              name="bakong_phone"
              placeholder="855912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button type="submit" loading={saving} className="w-full">
            Save
          </Button>
          {saved && <p className="text-sm text-success">Saved.</p>}
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          {previewString ? (
            <KhqrDisplay khqrString={previewString} size={160} merchantName={storeName} amountLabel="$1.00 (preview)" />
          ) : (
            <p className="text-center text-xs text-white/30">Fill in both fields to preview your QR code</p>
          )}
        </div>
      </form>
    </Card>
  );
}
