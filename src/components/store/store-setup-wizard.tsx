"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { uploadPublicFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { LocationPicker } from "@/components/map/location-picker";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database.types";

type Store = Database["public"]["Tables"]["stores"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Plan = Database["public"]["Tables"]["subscription_plans"]["Row"];

const STEP_LABELS = [
  "Store name",
  "Logo",
  "Cover image",
  "Category",
  "Description",
  "Contact info",
  "Location",
  "Social links",
  "Shipping policy",
  "Return policy",
  "Choose plan",
  "Review & publish",
];

export function StoreSetupWizard({
  store,
  categories,
  plans,
}: {
  store: Store;
  categories: Category[];
  plans: Plan[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(store.setup_step, STEP_LABELS.length));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    store_name: store.store_name ?? "",
    logo_url: store.logo_url ?? "",
    cover_image_url: store.cover_image_url ?? "",
    category: store.category ?? "",
    description: store.description ?? "",
    phone: store.phone ?? "",
    email: store.email ?? "",
    address: store.address ?? "",
    city: store.city ?? "",
    province: store.province ?? "",
    country: store.country ?? "Cambodia",
    latitude: store.latitude,
    longitude: store.longitude,
    facebook_url: store.facebook_url ?? "",
    telegram_url: store.telegram_url ?? "",
    tiktok_url: store.tiktok_url ?? "",
    instagram_url: store.instagram_url ?? "",
    website_url: store.website_url ?? "",
    shipping_information: store.shipping_information ?? "",
    return_policy: store.return_policy ?? "",
  });
  const [planId, setPlanId] = useState(plans[1]?.id ?? plans[0]?.id ?? "");

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function persistStep(nextStep: number, extra: Partial<Store> = {}) {
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("stores")
      .update({
        store_name: form.store_name,
        logo_url: form.logo_url || null,
        cover_image_url: form.cover_image_url || null,
        category: form.category || null,
        description: form.description || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        city: form.city || null,
        province: form.province || null,
        country: form.country || null,
        latitude: form.latitude,
        longitude: form.longitude,
        facebook_url: form.facebook_url || null,
        telegram_url: form.telegram_url || null,
        tiktok_url: form.tiktok_url || null,
        instagram_url: form.instagram_url || null,
        website_url: form.website_url || null,
        shipping_information: form.shipping_information || null,
        return_policy: form.return_policy || null,
        setup_step: nextStep,
        ...extra,
      })
      .eq("id", store.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return false;
    }
    return true;
  }

  async function handleNext() {
    const ok = await persistStep(Math.min(step + 1, STEP_LABELS.length));
    if (ok) setStep((s) => Math.min(s + 1, STEP_LABELS.length));
  }

  function handleBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    bucket: "store-logos" | "store-covers",
    field: "logo_url" | "cover_image_url"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const url = await uploadPublicFile(bucket, store.id, file);
      update(field, url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    setError(null);
    setSaving(true);
    const supabase = createClient();

    const ok = await persistStep(STEP_LABELS.length, {
      setup_completed: true,
      status: "active", // no admin moderation queue built yet — publish immediately; admins can still suspend a store later from /admin/stores
    });

    if (ok && planId) {
      await supabase.from("store_subscriptions").upsert(
        {
          store_id: store.id,
          plan_id: planId,
          status: "trialing",
          billing_cycle: "monthly",
        },
        { onConflict: "store_id" }
      );
    }

    setSaving(false);
    if (ok) router.push("/dashboard");
  }

  const progress = Math.round((step / STEP_LABELS.length) * 100);

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-white/50">
          <span>
            Step {step} of {STEP_LABELS.length} — {STEP_LABELS[step - 1]}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-brand-gradient transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card>
        {step === 1 && (
          <div>
            <h2 className="mb-4 text-lg font-bold">What&apos;s your store called?</h2>
            <Label htmlFor="store_name">Store name</Label>
            <Input id="store_name" value={form.store_name} onChange={(e) => update("store_name", e.target.value)} />
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Add your store logo</h2>
            {form.logo_url && (
              <Image src={form.logo_url} alt="Logo preview" width={96} height={96} className="mb-4 rounded-xl object-cover" />
            )}
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "store-logos", "logo_url")} className="text-sm text-white/70" />
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Add a cover image</h2>
            {form.cover_image_url && (
              <Image
                src={form.cover_image_url}
                alt="Cover preview"
                width={480}
                height={160}
                className="mb-4 h-40 w-full rounded-xl object-cover"
              />
            )}
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "store-covers", "cover_image_url")} className="text-sm text-white/70" />
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Business category</h2>
            <Select value={form.category} onChange={(e) => update("category", e.target.value)}>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Describe your store</h2>
            <Textarea rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Tell shoppers what you sell and what makes your store special..." />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Contact information</h2>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="storeEmail">Store email</Label>
              <Input id="storeEmail" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Where are you located?</h2>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="province">Province</Label>
                <Input id="province" value={form.province} onChange={(e) => update("province", e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={form.country} onChange={(e) => update("country", e.target.value)} />
            </div>
            <div>
              <Label>Pin your exact location on the map (optional, but helps customers find you)</Label>
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={(lat, lng) => {
                  update("latitude", lat);
                  update("longitude", lng);
                }}
              />
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Social media links</h2>
            {(["facebook_url", "telegram_url", "tiktok_url", "instagram_url", "website_url"] as const).map((f) => (
              <div key={f}>
                <Label htmlFor={f}>{f.replace("_url", "").replace(/^\w/, (c) => c.toUpperCase())}</Label>
                <Input id={f} placeholder="https://" value={form[f]} onChange={(e) => update(f, e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {step === 9 && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Shipping policy</h2>
            <Textarea rows={5} value={form.shipping_information} onChange={(e) => update("shipping_information", e.target.value)} placeholder="How and when do you ship orders?" />
          </div>
        )}

        {step === 10 && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Return & refund policy</h2>
            <Textarea rows={5} value={form.return_policy} onChange={(e) => update("return_policy", e.target.value)} placeholder="What's your return/refund policy?" />
          </div>
        )}

        {step === 11 && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Choose your subscription plan</h2>
            <div className="space-y-3">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanId(p.id)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-colors",
                    planId === p.id ? "border-primary bg-primary/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-accent">${p.price_monthly}/mo</span>
                  </div>
                  <p className="mt-1 text-xs text-white/50">
                    {p.product_limit ? `Up to ${p.product_limit} products` : "Unlimited products"}
                    {p.ai_enabled ? " · AI Assistant" : ""}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 12 && (
          <div>
            <h2 className="mb-2 text-lg font-bold">Review & publish</h2>
            <p className="mb-4 text-sm text-white/50">
              Your store goes live immediately — you can keep editing products anytime.
            </p>
            <div className="space-y-1 text-sm text-white/70">
              <p><span className="text-white/40">Name:</span> {form.store_name}</p>
              <p><span className="text-white/40">Category:</span> {form.category || "—"}</p>
              <p><span className="text-white/40">Location:</span> {[form.city, form.country].filter(Boolean).join(", ") || "—"}</p>
              <p><span className="text-white/40">Plan:</span> {plans.find((p) => p.id === planId)?.name ?? "—"}</p>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={handleBack} disabled={step === 1 || saving} type="button">
            Back
          </Button>
          {step < STEP_LABELS.length ? (
            <Button onClick={handleNext} loading={saving} type="button">
              Next
            </Button>
          ) : (
            <Button onClick={handleComplete} loading={saving} type="button">
              Publish store
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
