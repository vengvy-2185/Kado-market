"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { saveBakongApiSettings } from "@/lib/actions/platform-settings";

export function BakongApiSettingsForm({ hasToken, useSandbox }: { hasToken: boolean; useSandbox: boolean }) {
  const [sandbox, setSandbox] = useState(useSandbox);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setSaved(false);
    try {
      await saveBakongApiSettings(formData);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-white/70">Bakong Open API (real payment verification)</h2>
      <p className="mb-4 text-xs text-white/40">
        Once set, sellers and customers can click &quot;Check Payment Status&quot; on an order to
        verify a KHQR payment for real against NBC&apos;s API — instead of only checking their
        banking app manually. Get a developer token at{" "}
        <a href="https://api-bakong.nbc.gov.kh/register/" target="_blank" rel="noreferrer" className="text-accent hover:underline">
          api-bakong.nbc.gov.kh/register
        </a>
        .
      </p>
      <form action={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="bakong_developer_token">Developer Token</Label>
          <PasswordInput
            id="bakong_developer_token"
            name="bakong_developer_token"
            placeholder={hasToken ? "•••••••••••••• (saved — enter a new one to replace it)" : "Paste your Bakong Bearer token"}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" name="bakong_use_sandbox" checked={sandbox} onChange={(e) => setSandbox(e.target.checked)} />
          Use sandbox (SIT) environment — turn off only once you&apos;ve confirmed real verification works
        </label>
        <p className="text-xs text-warning">
          ⚠️ Production transaction checks only work from a server physically located in Cambodia
          (an NBC restriction, not something we can code around). If this app is hosted outside
          Cambodia, keep sandbox on for testing, or route this specific call through a
          Cambodia-based relay.
        </p>
        <Button type="submit" loading={saving}>
          Save
        </Button>
        {saved && <span className="ml-2 text-sm text-success">Saved.</span>}
      </form>
    </Card>
  );
}
