"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — fall back to selecting text isn't worth the complexity here
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url, title: "Check out my store" });
      } catch {
        // user cancelled the share sheet — nothing to do
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden max-w-[220px] truncate rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 sm:block">
        {url}
      </div>
      <Button variant="outline" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy link"}
      </Button>
      <Button variant="outline" onClick={handleShare} className="sm:hidden">
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
