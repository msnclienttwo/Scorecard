"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = ["All", "Live", "Upcoming", "Completed"] as const;

const mockMatches = [
  { id: "1", team1: "Mumbai Indians", team2: "Chennai Super Kings", score1: "145/3", score2: "89/4", overs: "12.4", date: "Jul 23, 2026", venue: "Wankhede Stadium", status: "live" },
  { id: "2", team1: "RCB", team2: "KKR", score1: "178/5", score2: "67/1", overs: "8.2", date: "Jul 23, 2026", venue: "M. Chinnaswamy", status: "live" },
  { id: "3", team1: "Delhi Capitals", team2: "Rajasthan Royals", score1: "", score2: "", overs: "", date: "Jul 25, 2026", venue: "Arun Jaitley", status: "upcoming" },
  { id: "4", team1: "SRH", team2: "PBKS", score1: "", score2: "", overs: "", date: "Jul 26, 2026", venue: "Rajiv Gandhi Intl.", status: "upcoming" },
  { id: "5", team1: "GT", team2: "LSG", score1: "195/4", score2: "178/8", overs: "20.0", date: "Jul 21, 2026", venue: "Narendra Modi", status: "completed" },
  { id: "6", team1: "MI", team2: "DC", score1: "168/6", score2: "169/3", overs: "19.2", date: "Jul 20, 2026", venue: "Wankhede", status: "completed" },
  { id: "7", team1: "CSK", team2: "RCB", score1: "210/3", score2: "198/7", overs: "20.0", date: "Jul 19, 2026", venue: "M.A. Chidambaram", status: "completed" },
  { id: "8", team1: "KKR", team2: "SRH", score1: "175/5", score2: "176/3", overs: "18.4", date: "Jul 18, 2026", venue: "Eden Gardens", status: "completed" },
  { id: "9", team1: "RR", team2: "GT", score1: "189/7", score2: "156/10", overs: "17.3", date: "Jul 17, 2026", venue: "Sawai Mansingh", status: "completed" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("All");
  const [search, setSearch] = useState("");

  const filtered = mockMatches.filter((m) => {
    if (activeTab !== "All" && m.status !== activeTab.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.team1.toLowerCase().includes(q) || m.team2.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Matches</h1>
        <Link
          href="/matches/create"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
        >
          <PlusCircle className="h-4 w-4" />
          Create Match
        </Link>
      </motion.div>

      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl bg-white/5 p-1">
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
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search matches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((match) => (
          <motion.div key={match.id} variants={item}>
            <div className="glass-card group rounded-2xl p-5 transition-all hover:border-white/15">
              <div className="mb-3 flex items-center justify-between">
                {match.status === "live" ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                    </span>
                    LIVE
                  </span>
                ) : match.status === "upcoming" ? (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    Upcoming
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-muted/10 px-2.5 py-0.5 text-xs font-semibold text-muted">
                    Completed
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Calendar className="h-3 w-3" />
                  {match.date}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{match.team1}</span>
                  {match.score1 && <span className="text-sm font-bold text-foreground">{match.score1}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{match.team2}</span>
                  {match.score2 ? (
                    <span className="text-sm font-bold text-foreground">{match.score2}</span>
                  ) : (
                    <span className="text-xs text-muted italic">Yet to bat</span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                <span className="flex items-center gap-1 text-xs text-muted">
                  <MapPin className="h-3 w-3" />
                  {match.venue}
                </span>
                {match.overs && <span className="text-xs text-muted">{match.overs} ov</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} className="flex items-center justify-center gap-2">
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition-colors hover:bg-white/10 hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {[1, 2, 3].map((p) => (
          <button
            key={p}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all",
              p === 1 ? "bg-primary/20 text-primary" : "text-muted hover:bg-white/5 hover:text-foreground"
            )}
          >
            {p}
          </button>
        ))}
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition-colors hover:bg-white/10 hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}
