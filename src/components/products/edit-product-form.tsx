"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { updateProduct, deleteProduct, addProductImage, deleteProductImage } from "@/lib/actions/products";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export function EditProductForm({
  product,
  images,
  variants,
  categories,
  storeId,
}: {
  product: Product;
  images: ProductImage[];
  variants: ProductVariant[];
  categories: Category[];
  storeId: string;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError(null);
    try {
      await updateProduct(product.id, formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("product_form_update_failed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadPublicFile("product-images", `${storeId}/${product.id}`, file);
        await addProductImage(product.id, url);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("product_form_upload_failed"));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(t("edit_product_delete_confirm"))) return;
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      router.push("/dashboard/products");
    } catch (err) {
      setDeleting(false);
      setError(err instanceof Error ? err.message : t("edit_product_delete_failed"));
    }
  }

  return (
    <div className="space-y-6">
      <form action={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">{t("product_form_basic_info")}</h2>
          <div>
            <Label htmlFor="name">{t("product_form_name")}</Label>
            <Input id="name" name="name" defaultValue={product.name} required />
          </div>
          <div>
            <Label htmlFor="description">{t("product_form_description")}</Label>
            <Textarea id="description" name="description" rows={4} defaultValue={product.description ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CategorySelect categories={categories} defaultCategoryId={product.category_id} />
            <div>
              <Label htmlFor="brand">{t("product_form_brand")}</Label>
              <Input id="brand" name="brand" defaultValue={product.brand ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="condition">{t("product_form_condition")}</Label>
              <Select id="condition" name="condition" defaultValue={product.condition}>
                <option value="new">{t("product_condition_new")}</option>
                <option value="used">{t("product_condition_used")}</option>
                <option value="refurbished">{t("product_condition_refurbished")}</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">{t("product_form_status")}</Label>
              <Select id="status" name="status" defaultValue={product.status}>
                <option value="active">{t("product_status_active")}</option>
                <option value="draft">{t("product_status_draft")}</option>
                <option value="archived">{t("product_status_archived")}</option>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold">{t("product_form_pricing")}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">{t("product_form_price")}</Label>
              <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={product.price} required />
            </div>
            <div>
              <Label htmlFor="compare_at_price">{t("product_form_compare_price")}</Label>
              <Input id="compare_at_price" name="compare_at_price" type="number" step="0.01" min="0" defaultValue={product.compare_at_price ?? ""} />
            </div>
            <div>
              <Label htmlFor="sku">{t("product_form_sku")}</Label>
              <Input id="sku" name="sku" defaultValue={product.sku ?? ""} />
            </div>
          </div>
          <div>
            <Label htmlFor="low_stock_threshold">{t("product_form_low_stock")}</Label>
            <Input id="low_stock_threshold" name="low_stock_threshold" type="number" min="0" defaultValue={product.low_stock_threshold} />
          </div>
          <p className="text-xs text-white/40">
            {t("product_form_current_stock")} <span className="text-white">{product.stock}</span> —{" "}
            <a href="/dashboard/inventory" className="text-accent hover:underline">
              {t("nav_inventory")}
            </a>{" "}
            {t("product_form_stock_note")}
          </p>
        </Card>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={saving} className="flex-1">
            {t("product_form_save_button")}
          </Button>
          <Button type="button" variant="outline" onClick={handleDelete} loading={deleting} className="border-danger/40 text-danger hover:bg-danger/10">
            {t("product_form_delete_button")}
          </Button>
        </div>
      </form>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold">{t("product_form_images")}</h2>
        <input type="file" accept="image/*" multiple onChange={handleImagePick} className="text-sm text-white/70" />
        {uploading && <p className="text-xs text-white/40">{t("product_form_uploading")}</p>}
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative">
              <Image src={img.url} alt="" width={80} height={80} className="h-20 w-20 rounded-lg object-cover" />
              <button
                type="button"
                onClick={async () => {
                  await deleteProductImage(product.id, img.id);
                  router.refresh();
                }}
                className="absolute -right-2 -top-2 rounded-full bg-danger p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {variants.length > 0 && (
        <Card className="space-y-3">
          <h2 className="text-lg font-bold">{t("product_form_variants")}</h2>
          {variants.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-xl border border-white/10 p-3 text-sm">
              <span>{v.variant_name}</span>
              <span className="text-white/50">
                {v.price ? `$${v.price} · ` : ""}
                {t("product_form_variant_stock")}: {v.stock}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
