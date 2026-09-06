import Image from "next/image";
import Link from "next/link";
import { Store as StoreIcon, MapPin, Phone, ShieldCheck, ExternalLink } from "lucide-react";
import { getMyStoreOrRedirect } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareLinkButton } from "@/components/share-link-button";
import { cn } from "@/lib/utils";

export default async function StoreProfilePage() {
  const { store } = await getMyStoreOrRedirect();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
      <Card className="overflow-hidden p-0">
        {/* Cover */}
        <div className="relative h-40 w-full bg-white/5 md:h-56">
          {store.cover_image_url ? (
            <Image src={store.cover_image_url} alt="Store cover" fill className="object-cover" priority />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/20">
              <StoreIcon className="h-10 w-10" />
            </div>
          )}
        </div>

        <div className="px-5 pb-5 md:px-6">
          {/* Logo overlapping the cover */}
          <div className="relative -mt-10 mb-3 h-20 w-20 overflow-hidden rounded-2xl border-4 border-surface bg-surface md:h-24 md:w-24">
            {store.logo_url ? (
              <Image src={store.logo_url} alt={store.store_name} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-brand-gradient text-2xl font-bold">
                {store.store_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{store.store_name}</h1>
                {store.verified && <ShieldCheck className="h-5 w-5 text-accent" />}
              </div>
              <span
                className={cn(
                  "mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                  store.status === "active" && "bg-success/15 text-success",
                  store.status === "pending_review" && "bg-warning/15 text-warning",
                  store.status === "draft" && "bg-white/10 text-white/60",
                  store.status === "suspended" && "bg-danger/15 text-danger",
                  store.status === "rejected" && "bg-danger/15 text-danger"
                )}
              >
                {store.status.replace("_", " ")}
              </span>
            </div>
            <Link href="/dashboard/store/setup">
              <Button variant="outline">Edit store</Button>
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link href={`/store/${store.slug}`} target="_blank">
              <Button>
                <ExternalLink className="h-4 w-4" />
                Visit My Store
              </Button>
            </Link>
            <ShareLinkButton path={`/store/${store.slug}`} />
          </div>

          {store.description && <p className="mt-4 text-sm text-white/70">{store.description}</p>}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/50">
            {store.city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {[store.city, store.country].filter(Boolean).join(", ")}
              </span>
            )}
            {store.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                {store.phone}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[store.facebook_url, store.telegram_url, store.tiktok_url, store.instagram_url, store.website_url]
              .filter((url): url is string => Boolean(url && url.trim()))
              .map((url) => {
                const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
                let label = url;
                try {
                  label = new URL(href).hostname.replace("www.", "");
                } catch {
                  // leave the raw value as the label if it's still not a parseable URL
                }
                return (
                  <a
                    key={url}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    {label}
                  </a>
                );
              })}
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {store.shipping_information && (
          <Card>
            <h2 className="mb-1 text-sm font-semibold text-white/70">Shipping policy</h2>
            <p className="text-sm text-white/60">{store.shipping_information}</p>
          </Card>
        )}
        {store.return_policy && (
          <Card>
            <h2 className="mb-1 text-sm font-semibold text-white/70">Return policy</h2>
            <p className="text-sm text-white/60">{store.return_policy}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
