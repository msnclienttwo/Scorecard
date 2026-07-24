"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PlusCircle, Search, Users, Trophy, Loader2 } from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  shortName: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  city: string | null;
  country: string | null;
  _count?: { players?: number; homeMatches?: number; awayMatches?: number };
}

interface TeamsResponse {
  teams: Team[];
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

export default function TeamsPage() {
  const [search, setSearch] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/teams?${params}`);
      if (res.ok) {
        const data: TeamsResponse = await res.json();
        setTeams(data.teams);
      } else {
        setTeams([]);
      }
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

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

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => {
              const playerCount = team._count?.players ?? 0;
              const matchCount = (team._count?.homeMatches ?? 0) + (team._count?.awayMatches ?? 0);
              const gradient = team.primaryColor && team.secondaryColor
                ? undefined
                : "from-primary to-accent";
              return (
                <motion.div key={team.id} variants={item}>
                  <div className="glass-card group rounded-2xl p-5">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn("flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white", !gradient && "from-primary to-accent")}
                        style={gradient ? undefined : { background: `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})` }}
                      >
                        {team.shortName || generateInitials(team.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="truncate font-semibold text-foreground">{team.name}</h3>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs text-muted">
                            <Users className="h-3 w-3" />
                            {playerCount} players
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted">
                            <Trophy className="h-3 w-3" />
                            {matchCount} matches
                          </span>
                        </div>
                        {(team.city || team.country) && (
                          <p className="mt-1 text-xs text-muted">{[team.city, team.country].filter(Boolean).join(", ")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {teams.length === 0 && (
            <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                <Users className="h-8 w-8 text-muted" />
              </div>
              <p className="mt-4 text-sm font-medium text-foreground">No teams found</p>
              <p className="text-xs text-muted">No teams found. Create your first team!</p>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
