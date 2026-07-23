"use client";

import { motion } from "framer-motion";

interface ScoringButtonProps {
  value: string | number;
  onClick: () => void;
  variant: "run" | "extra" | "wicket" | "action";
  disabled?: boolean;
}

const variantStyles = {
  run: "bg-white/10 hover:bg-white/20 text-white border-white/10",
  extra: "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/20",
  wicket: "bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/20",
  action: "bg-[#2563EB]/20 hover:bg-[#2563EB]/30 text-[#2563EB] border-[#2563EB]/20",
};

export default function ScoringButton({
  value,
  onClick,
  variant,
  disabled = false,
}: ScoringButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.1, boxShadow: "0 0 20px rgba(37,99,235,0.3)" }}
      whileTap={disabled ? {} : { scale: 0.9 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-16 h-16 rounded-2xl border font-bold text-lg
        flex items-center justify-center
        transition-colors duration-200
        disabled:opacity-30 disabled:cursor-not-allowed
        backdrop-blur-sm
        ${variantStyles[variant]}
      `}
    >
      {value}
    </motion.button>
  );
}
