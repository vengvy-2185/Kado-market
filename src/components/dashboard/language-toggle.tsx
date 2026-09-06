"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-0.5 text-xs font-semibold">
      {(["en", "km"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            "rounded-full px-2.5 py-1 transition-colors",
            lang === l ? "bg-brand-gradient text-white" : "text-white/50 hover:text-white"
          )}
        >
          {l === "en" ? "EN" : "ខ្មែរ"}
        </button>
      ))}
    </div>
  );
}
