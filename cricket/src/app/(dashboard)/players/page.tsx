"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PlusCircle, Search, Filter, User } from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";

const roles = ["All", "Batsman", "Bowler", "All-rounder", "Wicketkeeper"] as const;

const mockPlayers = [
  { id: "1", name: "Virat Kohli", team: "RCB", role: "Batsman", matches: 240, runs: 8004, wickets: 4, color: "from-red-500 to-red-700" },
  { id: "2", name: "Jasprit Bumrah", team: "MI", role: "Bowler", matches: 120, runs: 52, wickets: 145, color: "from-blue-500 to-blue-700" },
  { id: "3", name: "Ravindra Jadeja", team: "CSK", role: "All-rounder", matches: 210, runs: 2502, wickets: 132, color: "from-yellow-400 to-yellow-600" },
  { id: "4", name: "Rishabh Pant", team: "DC", role: "Wicketkeeper", matches: 98, runs: 2838, wickets: 0, color: "from-sky-400 to-sky-600" },
  { id: "5", name: "Jos Buttler", team: "RR", role: "Wicketkeeper", matches: 82, runs: 2831, wickets: 0, color: "from-pink-400 to-pink-600" },
  { id: "6", name: "Rashid Khan", team: "GT", role: "Bowler", matches: 100, runs: 132, wickets: 112, color: "from-teal-400 to-teal-600" },
  { id: "7", name: "KL Rahul", team: "LSG", role: "Batsman", matches: 110, runs: 3829, wickets: 0, color: "from-cyan-400 to-cyan-600" },
  { id: "8", name: "Sunil Narine", team: "KKR", role: "All-rounder", matches: 164, runs: 1012, wickets: 163, color: "from-purple-500 to-purple-700" },
  { id: "9", name: "David Warner", team: "DC", role: "Batsman", matches: 170, runs: 6397, wickets: 0, color: "from-sky-400 to-sky-600" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState<(typeof roles)[number]>("All");

  const filtered = mockPlayers.filter((p) => {
    if (activeRole !== "All" && p.role !== activeRole) return false;
    if (search) return p.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Players</h1>
        <Link
          href="/players/create"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
        >
          <PlusCircle className="h-4 w-4" />
          Add Player
        </Link>
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-white/5 p-1">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
                activeRole === role
                  ? "bg-primary/20 text-primary"
                  : "text-muted hover:bg-white/5 hover:text-foreground"
              )}
            >
              {role}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((player) => (
          <motion.div key={player.id} variants={item}>
            <div className="glass-card group rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white", player.color)}>
                  {generateInitials(player.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-semibold text-foreground">{player.name}</h3>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs text-muted">{player.team}</span>
                    <span className="text-xs text-muted">·</span>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {player.role}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">{player.matches}</p>
                  <p className="text-[10px] text-muted">Matches</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">{player.runs}</p>
                  <p className="text-[10px] text-muted">Runs</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">{player.wickets}</p>
                  <p className="text-[10px] text-muted">Wickets</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <User className="h-8 w-8 text-muted" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">No players found</p>
          <p className="text-xs text-muted">Try adjusting your search or filter</p>
        </motion.div>
      )}
    </motion.div>
  );
}
