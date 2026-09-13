"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  if (pathname === "/dashboard" || pathname === "/admin") return null;

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      aria-label="Go back"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("back_button")}
    </button>
  );
}
