"use client";

import { useState } from "react";
import { Facebook, Send, Link2, Share2 } from "lucide-react";
import { StoreQrButton } from "@/components/store/store-qr-button";

export function ShareShopButtons({ storeUrl, storeName }: { storeUrl: string; storeName: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: storeName, url: storeUrl });
      } catch {
        // user cancelled — not an error
      }
    } else {
      copyLink();
    }
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-white/50">Share Shop</p>
      <div className="flex gap-2">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
          aria-label="Share on Facebook"
        >
          <Facebook className="h-4 w-4" />
        </a>
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(storeUrl)}&text=${encodeURIComponent(storeName)}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
          aria-label="Share on Telegram"
        >
          <Send className="h-4 w-4" />
        </a>
        <button
          onClick={copyLink}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
          aria-label="Copy link"
        >
          <Link2 className="h-4 w-4" />
        </button>
        <StoreQrButton storeUrl={storeUrl} storeName={storeName} />
        <button
          onClick={nativeShare}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 md:hidden"
          aria-label="Share"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
      {copied && <p className="mt-1 text-xs text-success">Link copied!</p>}
    </div>
  );
}
