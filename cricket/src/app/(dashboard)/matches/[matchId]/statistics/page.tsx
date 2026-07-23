"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Target,
} from "lucide-react";

const runRateData = [
  { over: 1, runRate: 8.0, target: 8.75 },
  { over: 2, runRate: 9.5, target: 8.75 },
  { over: 3, runRate: 10.2, target: 8.75 },
  { over: 4, runRate: 9.8, target: 8.75 },
  { over: 5, runRate: 10.5, target: 8.75 },
  { over: 6, runRate: 10.1, target: 8.75 },
  { over: 7, runRate: 10.8, target: 8.75 },
  { over: 8, runRate: 11.2, target: 8.75 },
  { over: 9, runRate: 10.6, target: 8.75 },
  { over: 10, runRate: 10.3, target: 8.75 },
  { over: 11, runRate: 10.0, target: 8.75 },
  { over: 12, runRate: 9.8, target: 8.75 },
  { over: 13, runRate: 10.1, target: 8.75 },
  { over: 14, runRate: 10.4, target: 8.75 },
  { over: 15, runRate: 10.06, target: 8.75 },
];

const partnershipData = [
  { partnership: "1st", runs: 42, balls: 36, batsmen: "Rohit & Ishan" },
  { partnership: "2nd", runs: 56, balls: 42, batsmen: "Rohit & SKY" },
  { partnership: "3rd", runs: 44, balls: 30, batsmen: "SKY & Tilak" },
  { partnership: "4th", runs: 16, balls: 12, batsmen: "SKY & Hardik" },
  { partnership: "5th", runs: 13, balls: 8, batsmen: "Tilak & Hardik" },
  { partnership: "6th", runs: 5, balls: 4, batsmen: "Tilak & Tim" },
];

const wormData = [
  { over: 0, mi: 0, csk: 0 },
  { over: 1, mi: 8, csk: 6 },
  { over: 2, mi: 18, csk: 14 },
  { over: 3, mi: 28, csk: 22 },
  { over: 4, mi: 38, csk: 30 },
  { over: 5, mi: 50, csk: 38 },
  { over: 6, mi: 60, csk: 46 },
  { over: 7, mi: 72, csk: 55 },
  { over: 8, mi: 84, csk: 64 },
  { over: 9, mi: 95, csk: 74 },
  { over: 10, mi: 103, csk: 82 },
  { over: 11, mi: 112, csk: 90 },
  { over: 12, mi: 122, csk: 98 },
  { over: 13, mi: 134, csk: 108 },
  { over: 14, mi: 148, csk: 120 },
  { over: 15, mi: 156, csk: 130 },
];

const manhattanData = [
  { over: 1, mi: 8, csk: 6 },
  { over: 2, mi: 10, csk: 8 },
  { over: 3, mi: 10, csk: 8 },
  { over: 4, mi: 10, csk: 8 },
  { over: 5, mi: 12, csk: 8 },
  { over: 6, mi: 10, csk: 8 },
  { over: 7, mi: 12, csk: 9 },
  { over: 8, mi: 12, csk: 9 },
  { over: 9, mi: 11, csk: 10 },
  { over: 10, mi: 8, csk: 8 },
];

const runDistribution = [
  { name: "Dots", value: 54, color: "#374151" },
  { name: "1s", value: 32, color: "#22C55E" },
  { name: "2s", value: 14, color: "#22C55E" },
  { name: "3s", value: 4, color: "#22C55E" },
  { name: "4s", value: 20, color: "#2563EB" },
  { name: "6s", value: 10, color: "#00D4FF" },
  { name: "Extras", value: 12, color: "#F59E0B" },
];

const wagonWheelData = Array.from({ length: 30 }, (_, i) => {
  const angle = Math.random() * 360;
  const runs = [0, 1, 2, 4, 6][Math.floor(Math.random() * 5)];
  return {
    angle,
    runs,
    x: Math.cos((angle * Math.PI) / 180) * (runs === 0 ? 30 : runs === 6 ? 100 : runs === 4 ? 80 : 50),
    y: Math.sin((angle * Math.PI) / 180) * (runs === 0 ? 30 : runs === 6 ? 100 : runs === 4 ? 80 : 50),
  };
});

const bowlingAnalysis = [
  { bowler: "Bumrah", runs: 34, wickets: 2, dotBalls: 10 },
  { bowler: "Chahar", runs: 42, wickets: 1, dotBalls: 8 },
  { bowler: "Jadeja", runs: 38, wickets: 1, dotBalls: 9 },
  { bowler: "Moeen", runs: 30, wickets: 0, dotBalls: 6 },
  { bowler: "Pathirana", runs: 31, wickets: 2, dotBalls: 11 },
  { bowler: "Deshpande", runs: 14, wickets: 0, dotBalls: 2 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-sm">
      <p className="text-white font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function StatisticsPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div
        variants={itemVariants}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-white">Run Rate</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={runRateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="over" stroke="#94A3B8" fontSize={12} />
            <YAxis stroke="#94A3B8" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="runRate"
              stroke="#00D4FF"
              strokeWidth={2}
              dot={{ fill: "#00D4FF", r: 3 }}
              name="CRR"
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#EF4444"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="RRR"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-white">Partnerships</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={partnershipData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" stroke="#94A3B8" fontSize={12} />
            <YAxis type="category" dataKey="partnership" stroke="#94A3B8" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="runs" fill="#2563EB" radius={[0, 6, 6, 0]} name="Runs" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-success" />
          <h3 className="font-semibold text-white">Match Worm</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={wormData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="over" stroke="#94A3B8" fontSize={12} />
            <YAxis stroke="#94A3B8" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="mi"
              stroke="#2563EB"
              fill="rgba(37,99,235,0.1)"
              strokeWidth={2}
              name="MI"
            />
            <Area
              type="monotone"
              dataKey="csk"
              stroke="#00D4FF"
              fill="rgba(0,212,255,0.1)"
              strokeWidth={2}
              name="CSK"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-warning" />
          <h3 className="font-semibold text-white">Manhattan</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={manhattanData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="over" stroke="#94A3B8" fontSize={12} />
            <YAxis stroke="#94A3B8" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="mi" fill="#2563EB" radius={[4, 4, 0, 0]} name="MI" />
            <Bar dataKey="csk" fill="#00D4FF" radius={[4, 4, 0, 0]} name="CSK" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-white">Run Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={runDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {runDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload && payload[0] ? (
                    <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-2 text-xs text-white">
                      {payload[0].name}: {payload[0].value}
                    </div>
                  ) : null
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {runDistribution.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-xs text-muted">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-danger" />
            <h3 className="font-semibold text-white">Wagon Wheel</h3>
          </div>
          <div className="relative flex items-center justify-center">
            <svg width="220" height="220" viewBox="-110 -110 220 220">
              <circle cx="0" cy="0" r="100" fill="none" stroke="rgba(255,255,255,0.08)" />
              <circle cx="0" cy="0" r="75" fill="none" stroke="rgba(255,255,255,0.06)" />
              <circle cx="0" cy="0" r="50" fill="none" stroke="rgba(255,255,255,0.04)" />
              <circle cx="0" cy="0" r="25" fill="none" stroke="rgba(255,255,255,0.03)" />
              <line x1="0" y1="-100" x2="0" y2="100" stroke="rgba(255,255,255,0.05)" />
              <line x1="-100" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.05)" />
              <line x1="-70" y1="-70" x2="70" y2="70" stroke="rgba(255,255,255,0.05)" />
              <line x1="70" y1="-70" x2="-70" y2="70" stroke="rgba(255,255,255,0.05)" />
              {wagonWheelData.map((d, i) => (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={4}
                  fill={
                    d.runs === 6
                      ? "#00D4FF"
                      : d.runs === 4
                      ? "#2563EB"
                      : d.runs === 0
                      ? "#374151"
                      : "#22C55E"
                  }
                  opacity={0.8}
                />
              ))}
              <circle cx="0" cy="0" r="4" fill="#F59E0B" />
            </svg>
          </div>
        </motion.div>
      </div>

      <motion.div
        variants={itemVariants}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h3 className="font-semibold text-white mb-4">Bowling Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {bowlingAnalysis.map((b) => (
            <div
              key={b.bowler}
              className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center"
            >
              <p className="text-sm text-white font-medium mb-1">{b.bowler}</p>
              <p className="text-lg font-bold text-danger">{b.wickets}</p>
              <p className="text-xs text-muted">wickets</p>
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-xs text-muted">
                  {b.runs} runs &middot; {b.dotBalls} dots
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
