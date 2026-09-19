"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { uploadPublicFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { CategorySelect } from "@/components/products/category-select";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Database } from "@/lib/types/database.types";
import { createProduct } from "@/lib/actions/products";

type Category = Database["public"]["Tables"]["categories"]["Row"];

type Variant = {
  variant_name: string;
  sku: string;
  price: string;
  stock: string;
};

export function NewProductForm({ storeId, categories }: { storeId: string; categories: Category[] }) {
  const { t } = useLanguage();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadPublicFile("product-images", `${storeId}/new-${Date.now()}`, file);
        setImages((imgs) => [...imgs, url]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("product_form_upload_failed"));
    } finally {
      setUploading(false);
    }
  }

  function addVariant() {
    setVariants((v) => [...v, { variant_name: "", sku: "", price: "", stock: "0" }]);
  }

  function updateVariant(i: number, field: keyof Variant, value: string) {
    setVariants((v) => v.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  }

  function removeVariant(i: number) {
    setVariants((v) => v.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    formData.set("images", JSON.stringify(images));
    formData.set(
      "variants",
      JSON.stringify(
        variants
          .filter((v) => v.variant_name.trim())
          .map((v) => ({
            variant_name: v.variant_name,
            sku: v.sku || undefined,
            price: v.price ? Number(v.price) : null,
            stock: Number(v.stock || 0),
            attributes: {},
          }))
      )
    );
    try {
      await createProduct(formData);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : t("product_form_generic_error"));
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card className="space-y-4">
        <h2 className="text-lg font-bold">{t("product_form_basic_info")}</h2>
        <div>
          <Label htmlFor="name">{t("product_form_name")}</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="description">{t("product_form_description")}</Label>
          <Textarea id="description" name="description" rows={4} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <CategorySelect categories={categories} />
          <div>
            <Label htmlFor="brand">{t("product_form_brand")}</Label>
            <Input id="brand" name="brand" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="condition">{t("product_form_condition")}</Label>
            <Select id="condition" name="condition" defaultValue="new">
              <option value="new">{t("product_condition_new")}</option>
              <option value="used">{t("product_condition_used")}</option>
              <option value="refurbished">{t("product_condition_refurbished")}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">{t("product_form_status")}</Label>
            <Select id="status" name="status" defaultValue="active">
              <option value="active">{t("product_status_active_now")}</option>
              <option value="draft">{t("product_status_draft")}</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold">{t("product_form_pricing_stock")}</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price">{t("product_form_price")}</Label>
            <Input id="price" name="price" type="number" step="0.01" min="0" required />
          </div>
          <div>
            <Label htmlFor="compare_at_price">{t("product_form_compare_price")}</Label>
            <Input id="compare_at_price" name="compare_at_price" type="number" step="0.01" min="0" />
          </div>
          <div>
            <Label htmlFor="sku">{t("product_form_sku")}</Label>
            <Input id="sku" name="sku" />
          </div>
        </div>
        <div>
          <Label htmlFor="sale_ends_at">{t("product_form_sale_ends")}</Label>
          <Input id="sale_ends_at" name="sale_ends_at" type="datetime-local" />
          <p className="mt-1 text-xs text-white/40">{t("product_form_sale_ends_hint")}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="initial_stock">{t("product_form_initial_stock")}</Label>
            <Input id="initial_stock" name="initial_stock" type="number" min="0" defaultValue="0" />
          </div>
          <div>
            <Label htmlFor="low_stock_threshold">{t("product_form_low_stock")}</Label>
            <Input id="low_stock_threshold" name="low_stock_threshold" type="number" min="0" defaultValue="5" />
          </div>
        </div>
        <p className="text-xs text-white/40">{t("product_form_stock_hint")}</p>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold">{t("product_form_images")}</h2>
        <input type="file" accept="image/*" multiple onChange={handleImagePick} className="text-sm text-white/70" />
        {uploading && <p className="text-xs text-white/40">{t("product_form_uploading")}</p>}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div key={url} className="relative">
                <Image src={url} alt="" width={80} height={80} className="h-20 w-20 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((imgs) => imgs.filter((_, idx) => idx !== i))}
                  className="absolute -right-2 -top-2 rounded-full bg-danger p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t("product_form_variants_optional")}</h2>
          <Button type="button" variant="outline" onClick={addVariant}>
            {t("product_form_add_variant")}
          </Button>
        </div>
        {variants.map((v, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-end gap-2 rounded-xl border border-white/10 p-3">
            <div>
              <Label>{t("product_form_variant_name")}</Label>
              <Input placeholder="256GB / Black" value={v.variant_name} onChange={(e) => updateVariant(i, "variant_name", e.target.value)} />
            </div>
            <div>
              <Label>{t("product_form_sku")}</Label>
              <Input value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)} />
            </div>
            <div>
              <Label>{t("product_form_variant_price_override")}</Label>
              <Input
                type="number"
                step="0.01"
                placeholder={t("product_form_optional")}
                value={v.price}
                onChange={(e) => updateVariant(i, "price", e.target.value)}
              />
            </div>
            <div>
              <Label>{t("product_form_variant_stock")}</Label>
              <Input type="number" min="0" value={v.stock} onChange={(e) => updateVariant(i, "stock", e.target.value)} />
            </div>
            <button type="button" onClick={() => removeVariant(i)} className="mb-2 rounded-lg p-2 text-danger hover:bg-danger/10">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" loading={submitting || uploading} className="w-full">
        {t("product_form_create_button")}
      </Button>
    </form>
  );
}
