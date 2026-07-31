"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Player {
  id: string;
  name: string;
  role: string;
  category: string;
}

interface TeamSquadProps {
  players: Player[];
}

const CATEGORIES = ["All", "Batsmen", "Bowlers", "All-rounders", "Wicketkeepers"];

export default function TeamSquad({ players }: TeamSquadProps) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? players
      : players.filter(
          (p) => p.category.toLowerCase() === activeCategory.toLowerCase()
        );

  return (
    <div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              relative px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors
              ${activeCategory === cat ? "text-white" : "text-white/50 hover:text-white/70"}
            `}
          >
            {activeCategory === cat && (
              <motion.div
                layoutId="squad-tab"
                className="absolute inset-0 bg-[#2563EB]/30 border border-[#2563EB]/40 rounded-lg"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{cat}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map((player, i) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-center hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-sm font-bold text-white/40">
                {player.name.charAt(0)}
              </span>
            </div>
            <div className="text-sm font-medium text-white truncate">{player.name}</div>
            <div className="text-xs text-white/40 mt-0.5">{player.role}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export { TeamSquad };
