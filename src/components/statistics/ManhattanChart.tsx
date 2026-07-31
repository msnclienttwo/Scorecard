"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface ManhattanData {
  over: number;
  runs: number;
  batsman?: string;
}

interface ManhattanChartProps {
  data: ManhattanData[];
}

const COLORS = ["#2563EB", "#00D4FF", "#3B82F6", "#06B6D4", "#60A5FA", "#22D3EE", "#1D4ED8", "#0891B2"];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0d1320] border border-white/10 rounded-xl p-3 text-white text-sm">
      <div className="font-medium">Over {d.over}</div>
      <div className="text-white/60">{d.runs} runs</div>
      {d.batsman && (
        <div className="text-white/40 text-xs mt-1">Scorer: {d.batsman}</div>
      )}
    </div>
  );
}

export default function ManhattanChart({ data }: ManhattanChartProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
      <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
        Manhattan
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
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
          <Bar dataKey="runs" radius={[4, 4, 0, 0]} barSize={16}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { ManhattanChart };
