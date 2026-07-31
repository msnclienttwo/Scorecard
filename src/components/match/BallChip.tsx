"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BallChipProps {
  result: string;
  details?: string;
}

function getColor(result: string): string {
  const r = result.toLowerCase().trim();
  if (r === "•" || r === "dot" || r === "0") return "bg-[#333333] text-white/70";
  if (r === "4") return "bg-blue-600 text-white";
  if (r === "6") return "bg-cyan-500 text-black";
  if (r === "W" || r === "wicket") return "bg-red-500 text-white";
  if (r === "WD" || r === "wide") return "bg-yellow-500 text-black";
  if (r === "NB" || r === "no ball") return "bg-orange-500 text-black";
  const num = parseInt(r);
  if (!isNaN(num) && num >= 1 && num <= 3) return "bg-white/20 text-white";
  return "bg-white/10 text-white/70";
}

export default function BallChip({ result, details }: BallChipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <motion.div
        whileHover={{ scale: 1.15 }}
        className={`
          w-8 h-8 rounded-full flex items-center justify-center
          text-xs font-bold cursor-default select-none
          ${getColor(result)}
        `}
      >
        {result}
      </motion.div>

      <AnimatePresence>
        {showTooltip && details && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5
              bg-[#0d1320] border border-white/10 rounded-lg text-xs text-white whitespace-nowrap z-50
              shadow-lg"
          >
            {details}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
