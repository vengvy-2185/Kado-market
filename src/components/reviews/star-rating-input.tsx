"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
        >
          <Star className={cn("h-7 w-7 transition-colors", i <= (hover || value) ? "fill-warning text-warning" : "text-white/20")} />
        </button>
      ))}
    </div>
  );
}
