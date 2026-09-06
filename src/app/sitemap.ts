import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  const [{ data: stores }, { data: products }] = await Promise.all([
    supabase.from("stores").select("slug, updated_at").eq("status", "active"),
    supabase.from("products").select("slug, updated_at").eq("status", "active"),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/signup`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const storeEntries: MetadataRoute.Sitemap = (stores ?? []).map((s) => ({
    url: `${SITE_URL}/store/${s.slug}`,
    lastModified: s.updated_at ?? undefined,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${SITE_URL}/product/${p.slug}`,
    lastModified: p.updated_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...storeEntries, ...productEntries];
}
