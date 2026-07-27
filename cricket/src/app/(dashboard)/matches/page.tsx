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
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const tabs = ["All", "Live", "Upcoming", "Completed"] as const;

interface Team {
  name: string;
  shortName: string;
}

interface Match {
  id: string;
  name: string;
  homeTeam: Team;
  awayTeam: Team;
  status: string;
  scheduledAt: string;
  venue: string;
}

interface PaginatedResponse {
  matches: Match[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

const statusMap: Record<string, { label: string; className: string }> = {
  LIVE: { label: "LIVE", className: "text-success" },
  SCHEDULED: { label: "Upcoming", className: "text-primary" },
  COMPLETED: { label: "Completed", className: "text-muted" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["matches", { tab: activeTab, search, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (activeTab === "Live") params.set("status", "LIVE");
      else if (activeTab === "Upcoming") params.set("status", "SCHEDULED");
      else if (activeTab === "Completed") params.set("status", "COMPLETED");
      if (search) params.set("search", search);
      const res = await fetch(`/api/matches?${params}`);
      if (!res.ok) throw new Error("Failed to fetch matches");
      return res.json();
    },
  });

  const matches = data?.matches ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  function handleTabChange(tab: (typeof tabs)[number]) {
    setActiveTab(tab);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

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
              onClick={() => handleTabChange(tab)}
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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card animate-pulse rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="h-5 w-14 rounded-full bg-white/5" />
                <div className="h-4 w-20 rounded bg-white/5" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-white/5" />
                <div className="h-4 w-24 rounded bg-white/5" />
              </div>
              <div className="mt-3 border-t border-white/5 pt-3">
                <div className="h-3 w-32 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
            <Search className="h-10 w-10 text-muted/50" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">No matches found</h3>
          <p className="mt-1 text-sm text-muted">Try adjusting your filters or search.</p>
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
            <motion.div key={match.id} variants={item}>
              <Link href={`/matches/${match.id}`}>
                <div className="glass-card group rounded-2xl p-5 transition-all hover:border-white/15 cursor-pointer">
                  <div className="mb-3 flex items-center justify-between">
                    {match.status === "LIVE" ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                        </span>
                        LIVE
                      </span>
                    ) : match.status === "SCHEDULED" ? (
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
                      {formatDate(match.scheduledAt)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{match.homeTeam.shortName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{match.awayTeam.shortName}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <MapPin className="h-3 w-3" />
                      {match.venue}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {pagination.totalPages > 1 && (
        <motion.div variants={item} className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all",
                p === page ? "bg-primary/20 text-primary" : "text-muted hover:bg-white/5 hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
