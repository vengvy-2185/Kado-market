"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

function format(msLeft: number): string {
  const totalSeconds = Math.max(0, Math.floor(msLeft / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

/** Renders nothing once the sale has actually ended (the parent should
 * still fall back to a normal discount badge -- this component only
 * concerns itself with the ticking countdown while time remains). */
export function FlashSaleCountdown({ endsAt, compact = false }: { endsAt: string; compact?: boolean }) {
  const [msLeft, setMsLeft] = useState(() => new Date(endsAt).getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => setMsLeft(new Date(endsAt).getTime() - Date.now()), 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (msLeft <= 0) return null;

  if (compact) {
    return (
      <span className="flex items-center gap-0.5 rounded-full bg-gradient-to-r from-red-600 to-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
        <Flame className="h-2.5 w-2.5" /> {format(msLeft)}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
      <Flame className="h-4 w-4" />
      Flash sale ends in {format(msLeft)}
    </div>
  );
}
