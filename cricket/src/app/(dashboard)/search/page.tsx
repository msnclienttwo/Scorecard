"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search as SearchIcon, User, Users, Trophy, Calendar, SearchX } from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";

const tabs = ["All", "Players", "Teams", "Matches", "Tournaments"] as const;

const mockResults = {
  players: [
    { id: "1", name: "Virat Kohli", subtitle: "RCB · Batsman" },
    { id: "2", name: "Jasprit Bumrah", subtitle: "MI · Bowler" },
  ],
  teams: [
    { id: "1", name: "Mumbai Indians", subtitle: "16 players · 45 matches" },
    { id: "2", name: "RCB", subtitle: "17 players · 40 matches" },
  ],
  matches: [
    { id: "1", name: "MI vs CSK", subtitle: "Jul 22, 2026 · Completed" },
    { id: "2", name: "RCB vs KKR", subtitle: "Jul 23, 2026 · Live" },
  ],
  tournaments: [
    { id: "1", name: "IPL 2026", subtitle: "10 teams · Completed" },
    { id: "2", name: "World Cup Qualifier", subtitle: "12 teams · Live" },
  ],
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("All");

  const hasResults = query.length > 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search players, teams, matches, tournaments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-lg"
            autoFocus
          />
        </div>
      </motion.div>

      <motion.div variants={item} className="flex gap-1 rounded-xl bg-white/5 p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-primary/20 text-primary"
                : "text-muted hover:bg-white/5 hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </motion.div>

      {!hasResults ? (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
            <SearchIcon className="h-10 w-10 text-muted/50" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">Search ScoreCast</h3>
          <p className="mt-1 text-sm text-muted">Find players, teams, matches, and tournaments</p>
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {(activeTab === "All" || activeTab === "Players") && (
            <motion.div variants={item}>
              <h3 className="mb-2 text-sm font-semibold text-muted">Players</h3>
              <div className="space-y-2">
                {mockResults.players.map((p) => (
                  <div key={p.id} className="glass-card flex items-center gap-3 rounded-xl p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {generateInitials(p.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted">{p.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {(activeTab === "All" || activeTab === "Teams") && (
            <motion.div variants={item}>
              <h3 className="mb-2 text-sm font-semibold text-muted">Teams</h3>
              <div className="space-y-2">
                {mockResults.teams.map((t) => (
                  <div key={t.id} className="glass-card flex items-center gap-3 rounded-xl p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted">{t.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {(activeTab === "All" || activeTab === "Matches") && (
            <motion.div variants={item}>
              <h3 className="mb-2 text-sm font-semibold text-muted">Matches</h3>
              <div className="space-y-2">
                {mockResults.matches.map((m) => (
                  <div key={m.id} className="glass-card flex items-center gap-3 rounded-xl p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-xs font-bold text-success">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted">{m.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {(activeTab === "All" || activeTab === "Tournaments") && (
            <motion.div variants={item}>
              <h3 className="mb-2 text-sm font-semibold text-muted">Tournaments</h3>
              <div className="space-y-2">
                {mockResults.tournaments.map((t) => (
                  <div key={t.id} className="glass-card flex items-center gap-3 rounded-xl p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-xs font-bold text-warning">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted">{t.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
