"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createSubscriptionPlan,
  createAiPlan,
  createBoostPlan,
  createCategory,
} from "@/lib/actions/admin-plans";

function useCreateForm(action: (formData: FormData) => Promise<void>) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      await action(formData);
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create.");
    } finally {
      setSubmitting(false);
    }
  }

  return { formRef, submitting, error, handleSubmit };
}

const inputClass = "rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm";

export function NewSubscriptionPlanForm() {
  const { formRef, submitting, error, handleSubmit } = useCreateForm(createSubscriptionPlan);
  return (
    <form ref={formRef} action={handleSubmit} className="mb-3 flex flex-wrap items-end gap-2">
      <input name="name" placeholder="Plan name" required className={inputClass} />
      <input name="price_monthly" type="number" step="0.01" placeholder="$/mo" required className={`${inputClass} w-20`} />
      <input name="price_yearly" type="number" step="0.01" placeholder="$/yr" required className={`${inputClass} w-20`} />
      <input name="product_limit" type="number" placeholder="Product limit" className={`${inputClass} w-28`} />
      {(["ai_enabled", "analytics_enabled", "stories_enabled", "boost_enabled"] as const).map((f) => (
        <label key={f} className="flex items-center gap-1 text-xs text-white/50">
          <input type="checkbox" name={f} /> {f.replace("_enabled", "")}
        </label>
      ))}
      <Button type="submit" loading={submitting} className="px-3 py-1.5 text-xs">
        <Plus className="h-3.5 w-3.5" /> Add plan
      </Button>
      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </form>
  );
}

export function NewAiPlanForm() {
  const { formRef, submitting, error, handleSubmit } = useCreateForm(createAiPlan);
  return (
    <form ref={formRef} action={handleSubmit} className="mb-3 flex flex-wrap items-end gap-2">
      <input name="name" placeholder="Plan name" required className={inputClass} />
      <input name="price" type="number" step="0.01" placeholder="Price" required className={`${inputClass} w-20`} />
      <input name="duration_months" type="number" placeholder="Months" required className={`${inputClass} w-20`} />
      <input name="message_limit" type="number" placeholder="Msg limit" required className={`${inputClass} w-24`} />
      <Button type="submit" loading={submitting} className="px-3 py-1.5 text-xs">
        <Plus className="h-3.5 w-3.5" /> Add plan
      </Button>
      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </form>
  );
}

export function NewBoostPlanForm() {
  const { formRef, submitting, error, handleSubmit } = useCreateForm(createBoostPlan);
  return (
    <form ref={formRef} action={handleSubmit} className="mb-3 flex flex-wrap items-end gap-2">
      <input name="duration_days" type="number" placeholder="Days" required className={`${inputClass} w-20`} />
      <input name="price" type="number" step="0.01" placeholder="Price" required className={`${inputClass} w-20`} />
      <Button type="submit" loading={submitting} className="px-3 py-1.5 text-xs">
        <Plus className="h-3.5 w-3.5" /> Add plan
      </Button>
      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </form>
  );
}

export function NewCategoryForm() {
  const { formRef, submitting, error, handleSubmit } = useCreateForm(createCategory);
  return (
    <form ref={formRef} action={handleSubmit} className="mb-3 flex flex-wrap items-end gap-2">
      <input name="icon" placeholder="🏷️" className={`${inputClass} w-16 text-center`} />
      <input name="name" placeholder="Category name" required className={inputClass} />
      <input name="sort_order" type="number" placeholder="Order" defaultValue={0} className={`${inputClass} w-20`} />
      <Button type="submit" loading={submitting} className="px-3 py-1.5 text-xs">
        <Plus className="h-3.5 w-3.5" /> Add category
      </Button>
      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </form>
  );
}
