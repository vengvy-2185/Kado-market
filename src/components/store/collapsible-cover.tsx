"use client";

import { useState } from "react";
import Image from "next/image";
import { Store as StoreIcon, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsibleCover({ coverImageUrl }: { coverImageUrl: string | null }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl bg-white/5 transition-all duration-300", collapsed ? "h-16" : "h-40 md:h-56")}>
      {coverImageUrl ? (
        <Image src={coverImageUrl} alt="" fill className="object-cover" priority />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/20">
          <StoreIcon className="h-10 w-10" />
        </div>
      )}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
        aria-label={collapsed ? "Expand cover photo" : "Collapse cover photo"}
      >
        {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>
    </div>
  );
}
