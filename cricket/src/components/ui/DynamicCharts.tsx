"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

function ChartFallback() {
  return (
    <div className="flex items-center justify-center h-[250px]">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );
}

export const DynamicBarChart = dynamic(
  () => import("recharts").then((mod) => {
    const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } = mod;
    return function BarChartWrapper({ data, dataKey }: { data: any[]; dataKey: string }) {
      return (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis dataKey="match" stroke="#ffffff40" tick={{ fill: "#ffffff80", fontSize: 12 }} />
            <YAxis stroke="#ffffff40" tick={{ fill: "#ffffff80", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: "#0d1320",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#fff",
              }}
            />
            <Bar dataKey={dataKey} fill="#2563EB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    };
  }),
  { loading: () => <ChartFallback />, ssr: false }
);

export const DynamicPieChart = dynamic(
  () => import("recharts").then((mod) => {
    const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } = mod;
    return function PieChartWrapper({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
      return (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#0d1320",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#fff",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    };
  }),
  { loading: () => <ChartFallback />, ssr: false }
);

export const DynamicLineChart = dynamic(
  () => import("recharts").then((mod) => {
    const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } = mod;
    return function LineChartWrapper({
      data,
      dataKey,
      stroke,
      name,
    }: {
      data: any[];
      dataKey: string;
      stroke: string;
      name: string;
    }) {
      return (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="over" stroke="#94A3B8" fontSize={12} />
            <YAxis stroke="#94A3B8" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "#0d1320",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#fff",
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={stroke}
              strokeWidth={2}
              dot={{ fill: stroke, r: 3 }}
              name={name}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    };
  }),
  { loading: () => <ChartFallback />, ssr: false }
);
