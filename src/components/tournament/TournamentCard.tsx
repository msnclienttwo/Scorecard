"use client";

import { motion } from "framer-motion";
import { Calendar, Users } from "lucide-react";

interface TournamentCardProps {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  format: string;
  status: "upcoming" | "ongoing" | "completed";
  teamsCount: number;
  logo?: string;
}

const statusColors = {
  upcoming: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ongoing: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-white/10 text-white/50 border-white/10",
};

export default function TournamentCard({
  name,
  startDate,
  endDate,
  format,
  status,
  teamsCount,
}: TournamentCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 cursor-pointer overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/10 to-[#00D4FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/30 flex items-center justify-center">
            <span className="text-lg font-bold text-[#2563EB]">TC</span>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[status]}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <h3 className="font-semibold text-white text-lg mb-2">{name}</h3>

        <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
          <Calendar size={12} />
          {startDate} - {endDate}
        </div>

        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/60 border border-white/10">
            {format}
          </span>
          <div className="flex items-center gap-1 text-xs text-white/50">
            <Users size={12} />
            {teamsCount} Teams
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { TournamentCard };
