"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Datum = { date: string; revenue: number; orders: number };

export function RevenueChart({ data }: { data: Datum[] }) {
  if (data.length === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-white/40">No orders in this period.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tickLine={false} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{ background: "#101625", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: "white" }}
          formatter={(value: number, name: string) => [name === "revenue" ? `$${value.toFixed(2)}` : value, name === "revenue" ? "Revenue" : "Orders"]}
        />
        <Bar dataKey="revenue" fill="#A855F7" radius={[6, 6, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
