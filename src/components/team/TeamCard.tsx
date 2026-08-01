"use client";

import { motion } from "framer-motion";
import { TeamLogo } from "@/components/team/TeamLogo";

interface TeamCardProps {
  id: string;
  name: string;
  city: string;
  logo?: string;
  playerCount: number;
  wins: number;
  losses: number;
}

export default function TeamCard({
  id,
  name,
  city,
  logo,
  playerCount,
  wins,
  losses,
}: TeamCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 cursor-pointer overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/10 to-[#00D4FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <TeamLogo
            src={logo}
            name={name}
            fallback={name.substring(0, 2).toUpperCase()}
            size={56}
            rounded="rounded-full"
            background="linear-gradient(135deg, #2563EB, #00D4FF)"
          />
          <div>
            <h3 className="font-semibold text-white">{name}</h3>
            <p className="text-sm text-white/50">{city}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-white">{playerCount}</div>
            <div className="text-xs text-white/40">Players</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-400">{wins}</div>
            <div className="text-xs text-white/40">Wins</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-400">{losses}</div>
            <div className="text-xs text-white/40">Losses</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { TeamCard };
