import { ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Activity = {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  created_at: string;
  product_name: string;
};

export function RecentActivity({ items, title }: { items: Activity[]; title: string }) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-white/70">{title}</h2>
      <div className="space-y-2">
        {items.map((a) => {
          const isPositive = a.quantity >= 0;
          const Icon = a.type === "adjustment" ? SlidersHorizontal : isPositive ? ArrowUpCircle : ArrowDownCircle;
          return (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <Icon className={cn("h-4 w-4 flex-shrink-0", isPositive ? "text-success" : "text-danger")} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{a.product_name}</p>
                <p className="text-xs text-white/40">
                  {a.type.replace("_", " ")}
                  {a.reason ? ` · ${a.reason}` : ""}
                </p>
              </div>
              <span className={cn("text-sm font-semibold", isPositive ? "text-success" : "text-danger")}>
                {isPositive ? "+" : ""}
                {a.quantity}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
