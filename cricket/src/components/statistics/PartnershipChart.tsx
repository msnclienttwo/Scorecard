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

interface Partnership {
  batsmen: string;
  runs: number;
  balls: number;
}

interface PartnershipChartProps {
  data: Partnership[];
}

const COLORS = ["#2563EB", "#00D4FF", "#3B82F6", "#06B6D4", "#60A5FA", "#22D3EE"];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0d1320] border border-white/10 rounded-xl p-3 text-white text-sm">
      <div className="font-medium">{d.batsmen}</div>
      <div className="text-white/60">
        {d.runs} runs ({d.balls} balls)
      </div>
    </div>
  );
}

export default function PartnershipChart({ data }: PartnershipChartProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
      <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
        Partnerships
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid stroke="#ffffff20" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            stroke="#ffffff80"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="batsmen"
            stroke="#ffffff80"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="runs" radius={[0, 6, 6, 0]} barSize={20}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { PartnershipChart };
