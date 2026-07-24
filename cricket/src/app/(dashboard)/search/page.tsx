"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search as SearchIcon,
  User,
  Users,
  Trophy,
  Calendar,
  SearchX,
  Loader2,
} from "lucide-react";
import { cn, generateInitials } from "@/lib/utils";

const tabs = ["All", "Players", "Teams", "Matches", "Tournaments"] as const;

type TabKey = (typeof tabs)[number];

interface PlayerResult {
  id: string;
  name: string;
  role: string | null;
  image: string | null;
  team: { id: string; name: string } | null;
}

interface TeamResult {
  id: string;
  name: string;
  shortName: string | null;
  logo: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  _count: { players: number };
}

interface MatchResult {
  id: string;
  name: string | null;
  format: string | null;
  venue: string | null;
  scheduledAt: Date | null;
  status: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
}

interface TournamentResult {
  id: string;
  name: string;
  format: string | null;
  status: string;
  startDate: Date | null;
  logo: string | null;
}

interface SearchResults {
  players: PlayerResult[];
  teams: TeamResult[];
  matches: MatchResult[];
  tournaments: TournamentResult[];
}

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
  const [activeTab, setActiveTab] = useState<TabKey>("All");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.results);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (!value.trim()) {
        setResults(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      debounceTimer.current = setTimeout(() => performSearch(value), 300);
    },
    [performSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const tabFilterMap: Record<TabKey, keyof SearchResults | null> = {
    All: null,
    Players: "players",
    Teams: "teams",
    Matches: "matches",
    Tournaments: "tournaments",
  };

  const hasQuery = query.trim().length > 0;

  const filteredResults = results
    ? {
        players:
          activeTab === "All" || activeTab === "Players"
            ? results.players
            : [],
        teams:
          activeTab === "All" || activeTab === "Teams" ? results.teams : [],
        matches:
          activeTab === "All" || activeTab === "Matches" ? results.matches : [],
        tournaments:
          activeTab === "All" || activeTab === "Tournaments"
            ? results.tournaments
            : [],
      }
    : null;

  const totalResults = filteredResults
    ? filteredResults.players.length +
      filteredResults.teams.length +
      filteredResults.matches.length +
      filteredResults.tournaments.length
    : 0;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search players, teams, matches, tournaments..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-foreground placeholder-muted outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-lg"
            autoFocus
          />
          {isLoading && (
            <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-primary" />
          )}
        </div>
      </motion.div>

      <motion.div
        variants={item}
        className="flex gap-1 rounded-xl bg-white/5 p-1"
      >
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

      {!hasQuery ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
            <SearchIcon className="h-10 w-10 text-muted/50" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Search ScoreCast
          </h3>
          <p className="mt-1 text-sm text-muted">
            Find players, teams, matches, and tournaments
          </p>
        </motion.div>
      ) : isLoading && !filteredResults ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center py-20"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted">Searching...</p>
        </motion.div>
      ) : error ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-danger/10">
            <SearchX className="h-10 w-10 text-danger" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            {error}
          </h3>
        </motion.div>
      ) : totalResults === 0 ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
            <SearchX className="h-10 w-10 text-muted/50" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            No results found for &ldquo;{query}&rdquo;
          </h3>
          <p className="mt-1 text-sm text-muted">
            Try a different search term
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {filteredResults!.players.length > 0 && (
            <motion.div variants={item}>
              <h3 className="mb-2 text-sm font-semibold text-muted">
                Players ({filteredResults!.players.length})
              </h3>
              <div className="space-y-2">
                {filteredResults!.players.map((p) => (
                  <Link
                    key={p.id}
                    href={`/players/${p.id}`}
                    className="glass-card flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {generateInitials(p.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {p.name}
                      </p>
                      <p className="text-xs text-muted">
                        {p.team?.name && `${p.team.name} · `}
                        {p.role || "Player"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {filteredResults!.teams.length > 0 && (
            <motion.div variants={item}>
              <h3 className="mb-2 text-sm font-semibold text-muted">
                Teams ({filteredResults!.teams.length})
              </h3>
              <div className="space-y-2">
                {filteredResults!.teams.map((t) => (
                  <Link
                    key={t.id}
                    href={`/teams/${t.id}`}
                    className="glass-card flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t.name}
                      </p>
                      <p className="text-xs text-muted">
                        {t.shortName && `${t.shortName} · `}
                        {t._count.players} players
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {filteredResults!.matches.length > 0 && (
            <motion.div variants={item}>
              <h3 className="mb-2 text-sm font-semibold text-muted">
                Matches ({filteredResults!.matches.length})
              </h3>
              <div className="space-y-2">
                {filteredResults!.matches.map((m) => (
                  <Link
                    key={m.id}
                    href={`/matches/${m.id}`}
                    className="glass-card flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-xs font-bold text-success">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {m.name || `${m.homeTeam.name} vs ${m.awayTeam.name}`}
                      </p>
                      <p className="text-xs text-muted">
                        {m.scheduledAt
                          ? new Date(m.scheduledAt).toLocaleDateString()
                          : ""}{" "}
                        · {m.status}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {filteredResults!.tournaments.length > 0 && (
            <motion.div variants={item}>
              <h3 className="mb-2 text-sm font-semibold text-muted">
                Tournaments ({filteredResults!.tournaments.length})
              </h3>
              <div className="space-y-2">
                {filteredResults!.tournaments.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tournaments/${t.id}`}
                    className="glass-card flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-xs font-bold text-warning">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t.name}
                      </p>
                      <p className="text-xs text-muted">
                        {t.format && `${t.format} · `}
                        {t.status}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
