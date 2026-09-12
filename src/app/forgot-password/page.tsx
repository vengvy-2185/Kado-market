"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel";
import { Logo } from "@/components/logo";

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
    <main className="flex min-h-screen">
      <AuthHeroPanel />
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <Card className="w-full max-w-sm animate-scale-in">
          <div className="mb-4 flex justify-center lg:hidden">
            <Logo size={40} />
          </div>

          {sent ? (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
                <Mail className="h-5 w-5 text-success" />
              </div>
              <h1 className="mb-1 text-center text-xl font-bold">Check your email</h1>
              <p className="mb-6 text-center text-sm text-white/60">
                If an account exists for <span className="text-white">{email}</span>, a reset link is on its way. Be sure to check spam/junk too.
              </p>
              <button
                onClick={() => setSent(false)}
                className="w-full text-center text-sm text-accent hover:underline"
              >
                Use a different email
              </button>
            </>
          ) : (
            <>
              <h1 className="mb-1 text-2xl font-bold">Reset your password</h1>
              <p className="mb-6 text-sm text-white/50">
                Enter the email on your account and we&apos;ll send you a link to set a new password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    autoFocus
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
            </>
          )}

          <Link href="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-accent hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </Card>
      </div>
    </main>
  );
}
