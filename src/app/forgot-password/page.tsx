"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold">Reset your password</h1>
        <p className="mb-6 text-sm text-white/50">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <p className="text-sm text-success">
            If an account exists for {email}, a reset link is on its way.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" loading={loading} className="w-full">
              Send reset link
            </Button>
          </form>
        )}

        <Link href="/login" className="mt-6 block text-center text-sm text-accent hover:underline">
          Back to login
        </Link>
      </Card>
    </main>
  );
}
