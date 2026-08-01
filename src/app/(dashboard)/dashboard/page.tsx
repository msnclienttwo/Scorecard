"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Trophy,
  Radio,
  Users,
  UserPlus,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useSocketStore } from "@/store/useSocketStore";

interface InningsSummary {
  id: string;
  inningsNumber: number;
  battingTeam: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
}

interface MatchData {
  id: string;
  name: string;
  status: string;
  venue: string | null;
  scheduledAt: string;
  result: string | null;
  totalOvers: number;
  homeTeam: { id: string; name: string; shortName: string; logo: string | null };
  awayTeam: { id: string; name: string; shortName: string; logo: string | null };
  innings: InningsSummary[];
  scoringAccess: { allowed: boolean; reason?: string | null };
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-white/5", className)} />;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url}`);
  return res.json();
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const queryClient = useQueryClient();
  const { connect, subscribe, unsubscribe, on, off, isConnected } =
    useSocketStore();

  const matchesQuery = useQuery({
    queryKey: ["dashboard", "matches-count"],
    queryFn: () => fetchJson<{ pagination?: { total?: number } }>("/api/matches?limit=1"),
  });

  const liveQuery = useQuery({
    queryKey: ["dashboard", "live-matches"],
    queryFn: () => fetchJson<{ matches?: MatchData[]; pagination?: { total?: number } }>("/api/matches?status=LIVE&limit=100"),
    refetchInterval: isConnected ? false : 30_000,
  });

  const recentQuery = useQuery({
    queryKey: ["dashboard", "recent-matches"],
    queryFn: () => fetchJson<{ matches?: MatchData[] }>("/api/matches?status=COMPLETED&limit=5"),
  });

  const teamsQuery = useQuery({
    queryKey: ["dashboard", "teams-count"],
    queryFn: () => fetchJson<{ pagination?: { total?: number } }>("/api/teams?limit=1"),
  });

  const playersQuery = useQuery({
    queryKey: ["dashboard", "players-count"],
    queryFn: () => fetchJson<{ pagination?: { total?: number } }>("/api/players?limit=1"),
  });

  const loading = matchesQuery.isLoading || liveQuery.isLoading || recentQuery.isLoading;

  const totalMatches = matchesQuery.data?.pagination?.total ?? 0;
  const liveCount = liveQuery.data?.pagination?.total ?? 0;
  const liveMatches = liveQuery.data?.matches ?? [];
  const recentMatches = recentQuery.data?.matches ?? [];
  const teamCount = teamsQuery.data?.pagination?.total ?? 0;
  const playerCount = playersQuery.data?.pagination?.total ?? 0;

  const liveMatchIdsKey = liveMatches.map((m) => m.id).join(",");

  // Socket delivery is the primary sync path for the live matches shown here;
  // polling (above) is only a fallback while disconnected.
  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (!isConnected || !liveMatchIdsKey) return;
    const ids = liveMatchIdsKey.split(",");
    ids.forEach((id) => subscribe(id));

    const handler = () =>
      queryClient.invalidateQueries({ queryKey: ["dashboard", "live-matches"] });
    const events = [
      "score:updated",
      "match:updated",
      "innings:updated",
      "innings:started",
      "innings:ended",
      "strike:swapped",
      "commentary:added",
    ];
    events.forEach((event) => on(event, handler));

    return () => {
      ids.forEach((id) => unsubscribe(id));
      events.forEach((event) => off(event, handler));
    };
  }, [
    isConnected,
    liveMatchIdsKey,
    subscribe,
    unsubscribe,
    on,
    off,
    queryClient,
  ]);

  const stats = [
    {
      label: "Total Matches",
      value: totalMatches.toLocaleString(),
      icon: Trophy,
      color: "from-primary to-primary-light",
    },
    {
      label: "Live Now",
      value: liveCount.toLocaleString(),
      icon: Radio,
      color: "from-success to-accent",
    },
    {
      label: "Teams",
      value: teamCount.toLocaleString(),
      icon: Users,
      color: "from-accent to-accent-light",
    },
    {
      label: "Players",
      value: playerCount.toLocaleString(),
      icon: UserPlus,
      color: "from-warning to-danger",
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, <span className="gradient-text">{user?.name || "there"}</span>
        </h1>
        <p className="text-muted">Here&apos;s what&apos;s happening with your matches today</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <SkeletonBlock className="h-11 w-11 rounded-xl" />
                  <SkeletonBlock className="h-4 w-14" />
                </div>
                <div className="mt-4 space-y-2">
                  <SkeletonBlock className="h-7 w-20" />
                  <SkeletonBlock className="h-4 w-24" />
                </div>
              </div>
            ))
          : stats.map((stat) => (
              <div key={stat.label} className="glass-card group rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br", stat.color)}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted">{stat.label}</p>
                </div>
              </div>
            ))}
      </motion.div>

      <motion.div variants={item}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Active Matches</h2>
          <Link href="/matches" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-light transition-colors">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card min-w-[320px] flex-shrink-0 rounded-2xl p-5">
                <SkeletonBlock className="mb-3 h-4 w-16" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-full" />
                  <SkeletonBlock className="h-4 w-full" />
                </div>
                <SkeletonBlock className="mt-3 h-3 w-32" />
              </div>
            ))}
          </div>
        ) : liveMatches.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Radio className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-3 text-sm font-medium text-foreground">No live matches right now</p>
            <p className="text-xs text-muted">Live matches will appear here and can be resumed anytime</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {liveMatches.map((match) => {
              const latestInnings =
                match.innings && match.innings.length > 0
                  ? match.innings[match.innings.length - 1]
                  : null;
              const canScore = match.scoringAccess?.allowed ?? false;
              return (
                <div key={match.id} className="glass-card flex min-w-[320px] flex-shrink-0 flex-col rounded-2xl p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                      </span>
                      LIVE
                    </span>
                    <span className="text-xs text-muted">{match.totalOvers} overs</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {match.homeTeam.shortName || match.homeTeam.name}
                      </span>
                      <span className="text-xs text-muted">
                        {latestInnings?.battingTeam === match.homeTeam.id
                          ? `${latestInnings.totalRuns}/${latestInnings.totalWickets} (${latestInnings.totalOvers})`
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {match.awayTeam.shortName || match.awayTeam.name}
                      </span>
                      <span className="text-xs text-muted">
                        {latestInnings?.battingTeam === match.awayTeam.id
                          ? `${latestInnings.totalRuns}/${latestInnings.totalWickets} (${latestInnings.totalOvers})`
                          : ""}
                      </span>
                    </div>
                  </div>
                  {!latestInnings && (
                    <p className="mt-2 text-xs text-muted">Match is live but scoring has not started</p>
                  )}
                  <div className="mt-4 border-t border-white/5 pt-3">
                    {canScore ? (
                      <Link
                        href={`/matches/${match.id}/live`}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-accent px-3 py-2 text-xs font-semibold text-white transition-all hover:brightness-110"
                      >
                        Continue Scoring
                      </Link>
                    ) : (
                      <Link
                        href={`/score/${match.id}`}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-white/10"
                      >
                        View Live
                      </Link>
                    )}
                  </div>
                  {match.venue && <p className="mt-3 text-xs text-muted">{match.venue}</p>}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <motion.div variants={item}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Matches</h2>
          <Link href="/matches" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-light transition-colors">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Teams</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Result</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-5 py-3"><SkeletonBlock className="h-4 w-24" /></td>
                        <td className="px-5 py-3"><SkeletonBlock className="h-4 w-32" /></td>
                        <td className="px-5 py-3"><SkeletonBlock className="h-4 w-40" /></td>
                        <td className="px-5 py-3"><SkeletonBlock className="h-5 w-20 rounded-full" /></td>
                      </tr>
                    ))
                  : recentMatches.length === 0
                    ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center">
                          <Trophy className="mx-auto h-8 w-8 text-muted" />
                          <p className="mt-3 text-sm font-medium text-foreground">No completed matches yet</p>
                          <p className="text-xs text-muted">Completed matches will appear here</p>
                        </td>
                      </tr>
                    )
                    : recentMatches.map((match) => (
                        <tr key={match.id} className="transition-colors hover:bg-white/[0.02]">
                          <td className="whitespace-nowrap px-5 py-3 text-sm text-muted">
                            {new Date(match.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-foreground">
                            {match.homeTeam.name} vs {match.awayTeam.name}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-sm text-foreground/80">
                            {match.result || "\u2014"}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3">
                            <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                              Completed
                            </span>
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/matches/create" className="glass-card group flex items-center gap-4 rounded-2xl p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <PlusCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Create Match</p>
              <p className="text-xs text-muted">Start a new match</p>
            </div>
          </Link>
          <Link href="/teams" className="glass-card group flex items-center gap-4 rounded-2xl p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/20">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Add Team</p>
              <p className="text-xs text-muted">Register a new team</p>
            </div>
          </Link>
          <Link href="/players" className="glass-card group flex items-center gap-4 rounded-2xl p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 transition-colors group-hover:bg-success/20">
              <UserPlus className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Add Player</p>
              <p className="text-xs text-muted">Register a new player</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
