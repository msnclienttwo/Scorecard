"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PlusCircle, Search, User, Loader2 } from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";

const roles = ["All", "Batsman", "Bowler", "All-rounder", "Wicketkeeper"] as const;

interface Player {
  id: string;
  name: string;
  role: string;
  nationality: string | null;
  battingStyle: string | null;
  bowlingStyle: string | null;
  team?: { id: string; name: string } | null;
}

interface PlayersResponse {
  players: Player[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

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
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "50" });
      if (search) params.set("search", search);
      if (activeRole !== "All") params.set("role", activeRole);
      const res = await fetch(`/api/players?${params}`);
      if (res.ok) {
        const data: PlayersResponse = await res.json();
        setPlayers(data.players);
      } else {
        setPlayers([]);
      }
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [search, activeRole]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

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

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <motion.div key={player.id} variants={item}>
                <div className="glass-card group rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
                      {generateInitials(player.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate font-semibold text-foreground">{player.name}</h3>
                      <div className="mt-0.5 flex items-center gap-2">
                        {player.team && <span className="text-xs text-muted">{player.team.name}</span>}
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {player.role}
                        </span>
                      </div>
                      {player.nationality && (
                        <p className="mt-1 text-xs text-muted">{player.nationality}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">N/A</p>
                      <p className="text-[10px] text-muted">Matches</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">N/A</p>
                      <p className="text-[10px] text-muted">Runs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">N/A</p>
                      <p className="text-[10px] text-muted">Wickets</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {players.length === 0 && (
            <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                <User className="h-8 w-8 text-muted" />
              </div>
              <p className="mt-4 text-sm font-medium text-foreground">No players found</p>
              <p className="text-xs text-muted">No players found. Add your first player!</p>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
