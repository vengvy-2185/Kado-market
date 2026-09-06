import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const starSize = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(starSize, i <= Math.round(rating) ? "fill-warning text-warning" : "text-white/20")} />
      ))}
    </div>
  );
}
