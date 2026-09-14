"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { createBoostCampaign } from "@/lib/actions/boost";
import { cn } from "@/lib/utils";
import { PlatformKhqrToggle } from "@/components/platform-khqr-toggle";
import { KhqrDisplay } from "@/components/settings/khqr-display";
import { BoostVerifyButton } from "@/components/boost/boost-verify-button";
import type { Database } from "@/lib/types/database.types";

type Plan = Database["public"]["Tables"]["boost_plans"]["Row"];
type Item = { id: string; label: string };
type PlatformKhqrInfo = { accountId: string; phone: string; merchantName: string; merchantCity: string };

export function NewBoostForm({
  posts,
  products,
  plans,
  platformKhqr,
}: {
  posts: Item[];
  products: Item[];
  plans: Plan[];
  platformKhqr?: PlatformKhqrInfo | null;
}) {
  const [targetType, setTargetType] = useState<"post" | "product">("post");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; khqrString: string; amount: number } | null>(null);
  const [demoSuccess, setDemoSuccess] = useState(false);
  const [verified, setVerified] = useState(false);

  const items = targetType === "post" ? posts : products;
  const selectedPlan = plans.find((p) => p.id === planId);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    formData.set("plan_id", planId);
    try {
      const result = await createBoostCampaign(formData);
      if (result.pending && result.khqrString) {
        setPending({ id: result.id, khqrString: result.khqrString, amount: result.amount });
      } else {
        setDemoSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start boost.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setPending(null);
    setDemoSuccess(false);
    setVerified(false);
    setError(null);
  }

  if (verified || demoSuccess) {
    return (
      <Card className="flex flex-col items-center gap-3 py-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </span>
        <div>
          <p className="font-semibold text-white">Boost activated!</p>
          <p className="text-sm text-white/50">{demoSuccess ? "(Demo — platform hasn't set up a real KHQR yet.)" : "Payment confirmed via Bakong."}</p>
        </div>
        <Button variant="outline" onClick={reset}>
          Boost something else
        </Button>
      </Card>
    );
  }

  if (pending) {
    return (
      <Card className="flex flex-col items-center gap-3">
        <h2 className="text-sm font-semibold text-white/70">Scan to pay ${pending.amount.toFixed(2)}</h2>
        <KhqrDisplay khqrString={pending.khqrString} size={180} merchantName="KADO MARKET" amountLabel={`$${pending.amount.toFixed(2)}`} />
        <BoostVerifyButton campaignId={pending.id} onVerified={() => setVerified(true)} />
        <button onClick={reset} className="text-xs text-white/30 hover:text-white/60">
          Cancel
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-white/70">Boost a post or product</h2>
      <form action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          {(["post", "product"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTargetType(t)}
              className={cn(
                "rounded-lg py-2 text-sm font-semibold capitalize",
                targetType === t ? "bg-brand-gradient text-white" : "text-white/60"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <input type="hidden" name="target_type" value={targetType} />

        {items.length === 0 ? (
          <p className="text-sm text-white/40">
            You don&apos;t have any {targetType === "post" ? "posts" : "active products"} to boost yet.
          </p>
        ) : (
          <Select name="target_id" required>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </Select>
        )}

        <div>
          <label className="mb-2 block text-xs font-medium text-white/60">Duration</label>
          <div className="grid grid-cols-4 gap-2">
            {plans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlanId(p.id)}
                className={cn(
                  "rounded-xl border p-2 text-center text-xs",
                  planId === p.id ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"
                )}
              >
                <p className="font-semibold">{p.duration_days}d</p>
                <p className="text-accent">${p.price}</p>
              </button>
            ))}
          </div>
        </div>

        {platformKhqr && selectedPlan && (
          <PlatformKhqrToggle
            accountId={platformKhqr.accountId}
            phone={platformKhqr.phone}
            merchantName={platformKhqr.merchantName}
            merchantCity={platformKhqr.merchantCity}
            amount={selectedPlan.price}
          />
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" loading={submitting} disabled={items.length === 0} className="w-full">
          {platformKhqr ? "Pay with KHQR to boost" : "Boost now (Demo — no KHQR set up)"}
        </Button>
      </form>
    </Card>
  );
}
