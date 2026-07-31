"use client";

import { motion } from "framer-motion";

interface MatchResult {
  id?: string;
  matchName?: string;
  runs?: number;
  balls?: number;
  isOut?: boolean;
}

interface RecentFormProps {
  matches: MatchResult[];
}

function getPerformanceColor(runs: number): string {
  if (runs >= 100) return "bg-green-500/30 text-green-400 border-green-500/40";
  if (runs >= 50) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (runs >= 30) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (runs >= 10) return "bg-white/10 text-white/60 border-white/10";
  return "bg-red-500/10 text-red-400/60 border-red-500/20";
}

export default function RecentForm({ matches }: RecentFormProps) {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-center text-white/30 py-8">
        No recent matches
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {matches.map((m, i) => (
        <motion.div
          key={m.id || i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className={`flex-shrink-0 px-4 py-3 rounded-xl border text-center min-w-[80px] ${getPerformanceColor(m.runs || 0)}`}
        >
          <div className="text-lg font-bold">
            {m.runs || 0}
            {m.balls ? <span className="text-xs font-normal opacity-60">({m.balls})</span> : ""}
          </div>
          {m.isOut === false && (
            <div className="text-[10px] text-green-400 mt-1">Not Out</div>
          )}
          {m.matchName && (
            <div className="text-[10px] opacity-40 mt-1 truncate max-w-[60px]">
              {m.matchName}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export { RecentForm };
