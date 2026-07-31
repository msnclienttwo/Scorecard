"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface PlayerCardProps {
  id: string;
  name: string;
  team: string;
  role: string;
  avatar?: string;
  stats?: { label: string; value: string | number }[];
}

export default function PlayerCard({ id, name, team, role, avatar, stats }: PlayerCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 cursor-pointer overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/10 to-[#00D4FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
            {avatar ? (
              <Image src={avatar} alt={name} width={56} height={56} className="object-cover" />
            ) : (
              <span className="text-xl font-bold text-white/40">
                {name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">{name}</h3>
            <p className="text-sm text-white/50">{team}</p>
            <span className="text-xs text-[#00D4FF] font-medium">{role}</span>
          </div>
        </div>

        {stats && stats.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-lg font-bold text-white">{s.value}</div>
                <div className="text-xs text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export { PlayerCard };
