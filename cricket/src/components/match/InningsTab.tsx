"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface InningsTabProps {
  innings: string[];
  onSelect: (index: number) => void;
}

export default function InningsTab({ innings, onSelect }: InningsTabProps) {
  const [active, setActive] = useState(0);

  const handleSelect = (index: number) => {
    setActive(index);
    onSelect(index);
  };

  return (
    <div className="relative flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
      {innings.map((label, i) => (
        <button
          key={i}
          onClick={() => handleSelect(i)}
          className={`
            relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200
            ${active === i ? "text-white" : "text-white/50 hover:text-white/70"}
          `}
        >
          {active === i && (
            <motion.div
              layoutId="innings-tab-indicator"
              className="absolute inset-0 bg-[#2563EB]/30 border border-[#2563EB]/40 rounded-lg"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{label}</span>
        </button>
      ))}
    </div>
  );
}
