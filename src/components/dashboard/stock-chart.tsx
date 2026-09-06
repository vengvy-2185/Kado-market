"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useLanguage } from "@/lib/i18n/language-context";

type Datum = { name: string; stock: number };

export function StockChart({ data }: { data: Datum[] }) {
  const { t } = useLanguage();

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-white/40">
        {t("no_products_yet")}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          tickLine={false}
          interval={0}
          tickFormatter={(v: string) => (v.length > 10 ? `${v.slice(0, 10)}…` : v)}
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            background: "#101625",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "white" }}
        />
        <Bar dataKey="stock" fill="#A855F7" radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
