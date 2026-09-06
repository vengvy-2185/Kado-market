"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/language-context";

export function LiveClock() {
  const { lang } = useLanguage();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <div className="h-4 w-32" />; // avoid SSR/client mismatch flash

  const locale = lang === "km" ? "km-KH" : "en-US";

  return (
    <div className="hidden text-right leading-tight sm:block">
      <p className="text-xs font-medium text-white/80">
        {now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="text-[11px] text-white/40">
        {now.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" })}
      </p>
    </div>
  );
}
