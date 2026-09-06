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
      setError(err instanceof Error ? err.message : "Update failed");
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
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteProduct(product.id);
    } catch (err) {
      setDeleting(false);
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <form action={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Basic info</h2>
          <div>
            <Label htmlFor="name">Product name</Label>
            <Input id="name" name="name" defaultValue={product.name} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={4} defaultValue={product.description ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category_id">Category</Label>
              <Select id="category_id" name="category_id" defaultValue={product.category_id ?? ""}>
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" defaultValue={product.brand ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select id="condition" name="condition" defaultValue={product.condition}>
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={product.status}>
                <option value="active">Active (visible)</option>
                <option value="draft">Draft (hidden)</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Pricing</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={product.price} required />
            </div>
            <div>
              <Label htmlFor="compare_at_price">Compare-at price ($)</Label>
              <Input id="compare_at_price" name="compare_at_price" type="number" step="0.01" min="0" defaultValue={product.compare_at_price ?? ""} />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" defaultValue={product.sku ?? ""} />
            </div>
          </div>
          <div>
            <Label htmlFor="low_stock_threshold">Low stock alert below</Label>
            <Input id="low_stock_threshold" name="low_stock_threshold" type="number" min="0" defaultValue={product.low_stock_threshold} />
          </div>
          <p className="text-xs text-white/40">
            Current stock: <span className="text-white">{product.stock}</span> — adjust it from the{" "}
            <a href="/dashboard/inventory" className="text-accent hover:underline">Inventory</a> page so every
            change is logged.
          </p>
        </Card>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" loading={saving} className="flex-1">
            Save changes
          </Button>
          <Button type="button" variant="outline" onClick={handleDelete} loading={deleting} className="border-danger/40 text-danger hover:bg-danger/10">
            Delete
          </Button>
        </div>
      </form>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold">Images</h2>
        <input type="file" accept="image/*" multiple onChange={handleImagePick} className="text-sm text-white/70" />
        {uploading && <p className="text-xs text-white/40">Uploading...</p>}
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
          <h2 className="text-lg font-bold">Variants</h2>
          {variants.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-xl border border-white/10 p-3 text-sm">
              <span>{v.variant_name}</span>
              <span className="text-white/50">
                {v.price ? `$${v.price} · ` : ""}Stock: {v.stock}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
