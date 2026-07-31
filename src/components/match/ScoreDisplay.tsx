"use client";

import { motion } from "framer-motion";

interface ScoreDisplayProps {
  runs: number;
  wickets: number;
  overs: number;
  crr?: number;
  rrr?: number;
}

export default function ScoreDisplay({
  runs,
  wickets,
  overs,
  crr,
  rrr,
}: ScoreDisplayProps) {
  return (
    <div className="flex items-center justify-center gap-8 py-6">
      {crr !== undefined && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-center"
        >
          <div className="text-sm text-white/40 mb-1">CRR</div>
          <div className="text-lg font-bold text-[#2563EB]">{crr.toFixed(2)}</div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-center"
      >
        <div className="flex items-baseline gap-1">
          <motion.span
            key={runs}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-6xl font-bold text-white tabular-nums"
          >
            {runs}
          </motion.span>
          <span className="text-4xl font-bold text-white/60">/</span>
          <motion.span
            key={wickets}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-6xl font-bold text-white tabular-nums"
          >
            {wickets}
          </motion.span>
        </div>
        <motion.div
          key={overs}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-white/50 mt-2"
        >
          Overs: {overs.toFixed(1)}
        </motion.div>
      </motion.div>

      {rrr !== undefined && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-center"
        >
          <div className="text-sm text-white/40 mb-1">RRR</div>
          <div className="text-lg font-bold text-[#00D4FF]">{rrr.toFixed(2)}</div>
        </motion.div>
      )}
    </div>
  );
}
