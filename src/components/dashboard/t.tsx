"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import type { DictKey } from "@/lib/i18n/dictionary";

export function T({ k }: { k: DictKey }) {
  const { t } = useLanguage();
  return <>{t(k)}</>;
}
