"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

interface DistributionSegment {
  name: string;
  value: number;
}

interface RunDistributionProps {
  data: DistributionSegment[];
}

const COLORS: Record<string, string> = {
  "1s": "#6B7280",
  "2s": "#FFFFFF",
  "3s": "#22C55E",
  "4s": "#2563EB",
  "6s": "#00D4FF",
  "Dots": "#1A1A2E",
};

const DEFAULT_COLORS = ["#6B7280", "#FFFFFF", "#22C55E", "#2563EB", "#00D4FF", "#1A1A2E"];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[#0d1320] border border-white/10 rounded-xl p-3 text-white text-sm">
      <div className="font-medium">{d.name}</div>
      <div className="text-white/60">{d.value} runs</div>
    </div>
  );
}

export default function RunDistribution({ data }: RunDistributionProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
      <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
        Run Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={COLORS[entry.name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-white/60">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor:
                  COLORS[d.name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
              }}
            />
            {d.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export { RunDistribution };
