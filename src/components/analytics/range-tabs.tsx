import Link from "next/link";
import { cn } from "@/lib/utils";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "3 months" },
  { key: "1y", label: "1 year" },
] as const;

export function RangeTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-2">
      {RANGES.map((r) => (
        <Link
          key={r.key}
          href={`/dashboard/analytics?range=${r.key}`}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            active === r.key ? "bg-brand-gradient text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
          )}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
