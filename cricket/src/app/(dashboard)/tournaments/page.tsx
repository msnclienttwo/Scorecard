"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PlusCircle, Search, Calendar, Users, Trophy } from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";

const mockTournaments = [
  { id: "1", name: "IPL 2026", teams: 10, dates: "Mar 22 - May 28", status: "completed", color: "from-primary to-accent" },
  { id: "2", name: "World Cup Qualifier", teams: 12, dates: "Jul 1 - Jul 15", status: "live", color: "from-success to-accent" },
  { id: "3", name: "County Championship", teams: 18, dates: "Aug 1 - Sep 30", status: "upcoming", color: "from-purple-500 to-purple-700" },
  { id: "4", name: "The Ashes", teams: 2, dates: "Nov 21 - Jan 8", status: "upcoming", color: "from-warning to-danger" },
  { id: "5", name: "Caribbean Premier League", teams: 6, dates: "Aug 14 - Sep 22", status: "upcoming", color: "from-orange-400 to-orange-600" },
  { id: "6", name: "Big Bash League", teams: 8, dates: "Dec 15 - Feb 4", status: "upcoming", color: "from-sky-400 to-sky-600" },
];

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

  const filtered = mockTournaments.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

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

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tournament) => (
          <motion.div key={tournament.id} variants={item}>
            <div className="glass-card group rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white", tournament.color)}>
                  {generateInitials(tournament.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-semibold text-foreground">{tournament.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {tournament.status === "live" ? (
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
                  {tournament.teams} teams
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Calendar className="h-3 w-3" />
                  {tournament.dates}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Trophy className="h-8 w-8 text-muted" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">No tournaments found</p>
          <p className="text-xs text-muted">Try adjusting your search</p>
        </motion.div>
      )}
    </motion.div>
  );
}
