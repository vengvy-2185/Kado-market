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
      setError(err instanceof Error ? err.message : "Upload failed");
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
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card className="space-y-4">
        <h2 className="text-lg font-bold">Basic info</h2>
        <div>
          <Label htmlFor="name">Product name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={4} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category_id">Category</Label>
            <Select id="category_id" name="category_id" defaultValue="">
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
            <Input id="brand" name="brand" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="condition">Condition</Label>
            <Select id="condition" name="condition" defaultValue="new">
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="refurbished">Refurbished</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue="active">
              <option value="active">Active (visible now)</option>
              <option value="draft">Draft (hidden)</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold">Pricing & stock</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price">Price ($)</Label>
            <Input id="price" name="price" type="number" step="0.01" min="0" required />
          </div>
          <div>
            <Label htmlFor="compare_at_price">Compare-at price ($)</Label>
            <Input id="compare_at_price" name="compare_at_price" type="number" step="0.01" min="0" />
          </div>
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="initial_stock">Initial stock</Label>
            <Input id="initial_stock" name="initial_stock" type="number" min="0" defaultValue="0" />
          </div>
          <div>
            <Label htmlFor="low_stock_threshold">Low stock alert below</Label>
            <Input id="low_stock_threshold" name="low_stock_threshold" type="number" min="0" defaultValue="5" />
          </div>
        </div>
        <p className="text-xs text-white/40">
          Leave initial stock at 0 if this product only sells through variants below.
        </p>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold">Images</h2>
        <input type="file" accept="image/*" multiple onChange={handleImagePick} className="text-sm text-white/70" />
        {uploading && <p className="text-xs text-white/40">Uploading...</p>}
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
          <h2 className="text-lg font-bold">Variants (optional)</h2>
          <Button type="button" variant="outline" onClick={addVariant}>
            + Add variant
          </Button>
        </div>
        {variants.map((v, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-end gap-2 rounded-xl border border-white/10 p-3">
            <div>
              <Label>Name</Label>
              <Input placeholder="256GB / Black" value={v.variant_name} onChange={(e) => updateVariant(i, "variant_name", e.target.value)} />
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)} />
            </div>
            <div>
              <Label>Price override</Label>
              <Input type="number" step="0.01" placeholder="optional" value={v.price} onChange={(e) => updateVariant(i, "price", e.target.value)} />
            </div>
            <div>
              <Label>Stock</Label>
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
        Create product
      </Button>
    </form>
  );
}
