"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function AdminBarChart({
  data,
  color,
  format = "number",
}: {
  data: { label: string; value: number }[];
  color?: string;
  format?: "number" | "currency";
}) {
  if (data.length === 0) {
    return <div className="flex h-48 items-center justify-center text-sm text-white/40">No data yet.</div>;
  }

  const formatValue = (v: number) => (format === "currency" ? `$${v.toFixed(2)}` : String(v));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tickLine={false} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{ background: "#101625", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: "white" }}
          formatter={(value: number) => [formatValue(value), ""]}
        />
        <Bar dataKey="value" fill={color ?? "#A855F7"} radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
