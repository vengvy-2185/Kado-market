"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

type Role = "customer" | "seller";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("customer");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          username,
          role,
          phone,
          ...(role === "seller"
            ? { store_name: storeName, business_category: businessCategory }
            : {}),
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen">
        <AuthHeroPanel />
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <Card className="w-full max-w-sm animate-scale-in text-center">
            <div className="mb-4 flex justify-center lg:hidden">
              <Logo size={40} />
            </div>
            <h1 className="mb-2 text-xl font-bold">Check your inbox</h1>
            <p className="text-sm text-white/60">
              We sent a confirmation link to <span className="text-white">{email}</span>. Verify
              your email to activate your account
              {role === "seller" ? " and continue to Store Setup." : "."}
            </p>
            <Link href="/login" className="mt-6 inline-block text-sm text-accent hover:underline">
              Back to login
            </Link>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen">
      <AuthHeroPanel />
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md animate-scale-in">
          <div className="mb-4 flex justify-center lg:hidden">
            <Logo size={40} />
          </div>
          <h1 className="mb-1 text-2xl font-bold">Create your account</h1>
          <p className="mb-6 text-sm text-white/50">Join KADO MARKET as a shopper or a seller</p>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          {(["customer", "seller"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "rounded-lg py-2 text-sm font-semibold capitalize transition-colors",
                role === r ? "bg-brand-gradient text-white" : "text-white/60 hover:text-white"
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {role === "seller" && (
            <>
              <div>
                <Label htmlFor="storeName">Store name</Label>
                <Input id="storeName" required value={storeName} onChange={(e) => setStoreName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="businessCategory">Business category</Label>
                  <Input
                    id="businessCategory"
                    placeholder="Fashion, Electronics..."
                    required
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" loading={loading} className="w-full">
            {role === "seller" ? "Create seller account" : "Create account"}
          </Button>
        </form>

        {role === "customer" && (
          <>
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/40">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <GoogleSignInButton />
          </>
        )}

        <p className="mt-6 text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
