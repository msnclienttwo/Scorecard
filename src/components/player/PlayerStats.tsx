"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Stat {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}

interface PlayerStatsProps {
  stats: Stat[];
}

export default function PlayerStats({ stats }: PlayerStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-center hover:bg-white/[0.08] transition-colors"
        >
          {stat.icon && (
            <stat.icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          )}
          <div className="text-2xl font-bold text-white">{stat.value}</div>
          <div className="text-xs text-white/40 mt-1 uppercase tracking-wider">
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export { PlayerStats };
