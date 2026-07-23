"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PlusCircle, Search, Users, Trophy, User } from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";

const mockTeams = [
  { id: "1", name: "Mumbai Indians", players: 16, matches: 45, color: "from-blue-500 to-blue-700" },
  { id: "2", name: "Chennai Super Kings", players: 15, matches: 42, color: "from-yellow-400 to-yellow-600" },
  { id: "3", name: "Royal Challengers Bangalore", players: 17, matches: 40, color: "from-red-500 to-red-700" },
  { id: "4", name: "Kolkata Knight Riders", players: 14, matches: 38, color: "from-purple-500 to-purple-700" },
  { id: "5", name: "Delhi Capitals", players: 16, matches: 36, color: "from-sky-400 to-sky-600" },
  { id: "6", name: "Rajasthan Royals", players: 15, matches: 35, color: "from-pink-400 to-pink-600" },
  { id: "7", name: "Sunrisers Hyderabad", players: 16, matches: 39, color: "from-orange-400 to-orange-600" },
  { id: "8", name: "Gujarat Titans", players: 14, matches: 28, color: "from-teal-400 to-teal-600" },
  { id: "9", name: "Punjab Kings", players: 15, matches: 33, color: "from-red-400 to-red-600" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function TeamsPage() {
  const [search, setSearch] = useState("");

  const filtered = mockTeams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Teams</h1>
        <Link
          href="/teams/create"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
        >
          <PlusCircle className="h-4 w-4" />
          Add Team
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((team) => (
          <motion.div key={team.id} variants={item}>
            <div className="glass-card group rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className={cn("flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white", team.color)}>
                  {generateInitials(team.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-semibold text-foreground">{team.name}</h3>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <User className="h-3 w-3" />
                      {team.players} players
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Trophy className="h-3 w-3" />
                      {team.matches} matches
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Users className="h-8 w-8 text-muted" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">No teams found</p>
          <p className="text-xs text-muted">Try adjusting your search</p>
        </motion.div>
      )}
    </motion.div>
  );
}
