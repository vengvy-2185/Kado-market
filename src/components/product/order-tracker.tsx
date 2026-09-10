import { Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database.types";

type StatusHistoryRow = Database["public"]["Tables"]["order_status_history"]["Row"];

const TRACK_STEPS = [
  { status: "pending", label: "Order placed" },
  { status: "paid", label: "Payment confirmed" },
  { status: "processing", label: "Processing" },
  { status: "packed", label: "Packed" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
] as const;

export function OrderTracker({ currentStatus, history }: { currentStatus: string; history: StatusHistoryRow[] }) {
  if (currentStatus === "cancelled" || currentStatus === "refunded") {
    const eventTime = history.find((h) => h.status === currentStatus)?.created_at;
    return (
      <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-danger/20">
          <X className="h-4 w-4 text-danger" />
        </div>
        <div>
          <p className="text-sm font-semibold capitalize text-danger">Order {currentStatus}</p>
          {eventTime && <p className="text-xs text-white/40">{new Date(eventTime).toLocaleString()}</p>}
        </div>
      </div>
    );
  }

  const timestampByStatus = new Map(history.map((h) => [h.status, h.created_at]));
  const currentIndex = TRACK_STEPS.findIndex((s) => s.status === currentStatus);

  return (
    <div className="space-y-0">
      {TRACK_STEPS.map((step, i) => {
        const isDone = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const timestamp = timestampByStatus.get(step.status);
        const isLast = i === TRACK_STEPS.length - 1;

        return (
          <div key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isDone ? "border-success bg-success/20 text-success" : "border-white/15 bg-white/5 text-white/30",
                  isCurrent && "border-primary bg-primary/20 text-primary"
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              </div>
              {!isLast && <div className={cn("w-0.5 flex-1 py-1", isDone && i < currentIndex ? "bg-success" : "bg-white/10")} style={{ minHeight: 24 }} />}
            </div>
            <div className={cn("pb-5", isLast && "pb-0")}>
              <p className={cn("text-sm font-medium", isDone ? "text-white" : "text-white/40", isCurrent && "text-primary")}>{step.label}</p>
              {timestamp ? (
                <p className="text-xs text-white/40">{new Date(timestamp).toLocaleString()}</p>
              ) : (
                !isDone && <p className="text-xs text-white/25">Pending</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
