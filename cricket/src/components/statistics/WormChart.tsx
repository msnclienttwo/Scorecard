"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface WormData {
  over: number;
  team1: number;
  team2: number;
}

interface WormChartProps {
  data: WormData[];
  team1Name: string;
  team2Name: string;
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
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function WormChart({ data, team1Name, team2Name }: WormChartProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
      <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
        Match Worm
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
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
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#ffffff80" }}
          />
          <Line
            type="monotone"
            dataKey="team1"
            name={team1Name}
            stroke="#2563EB"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="team2"
            name={team2Name}
            stroke="#00D4FF"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export { WormChart };
