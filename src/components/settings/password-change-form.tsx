"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function PasswordChangeForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (password.length < 8) {
      setMessage({ text: "Password must be at least 8 characters.", ok: false });
      return;
    }
    if (password !== confirm) {
      setMessage({ text: "Passwords don't match.", ok: false });
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setMessage({ text: error.message, ok: false });
    } else {
      setMessage({ text: "Password updated.", ok: true });
      setPassword("");
      setConfirm("");
    }
  }

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-white/70">Change password</h2>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="new_password">New password</Label>
          <Input id="new_password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} />
        </div>
        <div>
          <Label htmlFor="confirm_password">Confirm password</Label>
          <Input id="confirm_password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} />
        </div>
        <div className="sm:col-span-2">
          {message && <p className={message.ok ? "mb-2 text-sm text-success" : "mb-2 text-sm text-danger"}>{message.text}</p>}
          <Button type="submit" loading={saving} variant="outline">
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}
