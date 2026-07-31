"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface RunRateData {
  over: number;
  crr: number;
  rrr: number;
}

interface RunRateChartProps {
  data: RunRateData[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#0d1320] border border-white/10 rounded-xl p-3 text-white text-sm">
      <div className="font-medium mb-1">Over {label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="font-medium">{Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export default function RunRateChart({ data }: RunRateChartProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
      <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
        Run Rate
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="crrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rrrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#ffffff20" strokeDasharray="3 3" />
          <XAxis
            dataKey="over"
            stroke="#ffffff80"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#ffffff80"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="crr"
            name="CRR"
            stroke="#2563EB"
            fill="url(#crrGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="rrr"
            name="RRR"
            stroke="#00D4FF"
            fill="url(#rrrGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export { RunRateChart };
