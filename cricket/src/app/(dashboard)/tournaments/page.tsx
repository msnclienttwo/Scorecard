"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PlusCircle, Search, Calendar, Users, Trophy } from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";

interface Tournament {
  id: string;
  name: string;
  shortName?: string;
  format: string;
  startDate: string;
  endDate: string;
  status: string;
  _count?: { matches: number; teams: number };
}

interface TournamentsResponse {
  tournaments: Tournament[];
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

export default function TournamentsPage() {
  const [search, setSearch] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/tournaments?${params}`);
      if (res.ok) {
        const data: TournamentsResponse = await res.json();
        setTournaments(data.tournaments);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchTournaments, 300);
    return () => clearTimeout(timer);
  }, [fetchTournaments]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Tournaments</h1>
        <Link
          href="/tournaments/create"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
        >
          <PlusCircle className="h-4 w-4" />
          Create Tournament
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search tournaments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card animate-pulse rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 shrink-0 rounded-xl bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-white/5" />
                  <div className="h-3 w-1/2 rounded bg-white/5" />
                </div>
              </div>
              <div className="mt-4 border-t border-white/5 pt-3">
                <div className="h-3 w-2/3 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <motion.div key={tournament.id} variants={item}>
              <Link href={`/tournaments/${tournament.id}`} className="block glass-card group rounded-2xl p-5 transition-all hover:ring-1 hover:ring-primary/30">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
                    {tournament.shortName || generateInitials(tournament.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate font-semibold text-foreground">{tournament.name}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-muted">
                        {tournament.format}
                      </span>
                      {tournament.status === "live" || tournament.status === "in_progress" ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-success">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                          </span>
                          Live
                        </span>
                      ) : tournament.status === "upcoming" ? (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          Upcoming
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-muted/10 px-2 py-0.5 text-[10px] font-semibold text-muted">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 border-t border-white/5 pt-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <Users className="h-3 w-3" />
                    {tournament._count?.teams ?? 0} teams
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <Trophy className="h-3 w-3" />
                    {tournament._count?.matches ?? 0} matches
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <Calendar className="h-3 w-3" />
                    {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!loading && tournaments.length === 0 && (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Trophy className="h-8 w-8 text-muted" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">No tournaments found. Create your first tournament!</p>
          <Link href="/tournaments/create" className="mt-3 text-xs font-semibold text-primary hover:underline">
            + Create Tournament
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
