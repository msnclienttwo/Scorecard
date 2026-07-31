"use client";

import { motion } from "framer-motion";

interface Extras {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  total: number;
}

interface ExtrasBreakdownProps {
  extras: Extras;
}

const items = [
  { key: "wides", label: "Wides", color: "from-yellow-500/20 to-yellow-500/5" },
  { key: "noBalls", label: "No Balls", color: "from-orange-500/20 to-orange-500/5" },
  { key: "byes", label: "Byes", color: "from-white/20 to-white/5" },
  { key: "legByes", label: "Leg Byes", color: "from-blue-500/20 to-blue-500/5" },
  { key: "total", label: "Total", color: "from-[#2563EB]/20 to-[#2563EB]/5" },
];

export default function ExtrasBreakdown({ extras }: ExtrasBreakdownProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      {items.map((item, i) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`
            rounded-xl border border-white/10 bg-gradient-to-b ${item.color}
            backdrop-blur-xl p-4 text-center
          `}
        >
          <div className="text-2xl font-bold text-white">
            {extras[item.key as keyof Extras]}
          </div>
          <div className="text-xs text-white/40 mt-1">{item.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

export { ExtrasBreakdown };
