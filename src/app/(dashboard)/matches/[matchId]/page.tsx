"use client";

import { use, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  MapPin,
  Trophy,
  Users,
  Wind,
  Zap,
  Timer,
  CircleDot,
  MessageSquare,
  Activity,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn, formatStoredOvers, parseOversToBalls } from "@/lib/utils";
import { StartMatchModal } from "@/components/match/StartMatchModal";
import { BroadcastManager } from "@/components/video/BroadcastManager";
import { HighlightsSection } from "@/components/video/HighlightsSection";
import type { Match, Team, Innings } from "@/types";

interface MatchWithDetails extends Match {
  homeTeam: Pick<Team, "id" | "name" | "shortName" | "logo">;
  awayTeam: Pick<Team, "id" | "name" | "shortName" | "logo">;
  innings: (Innings & {
    battingCard: { playerId: string; runs: number; balls: number }[];
    bowlingCard: { playerId: string; overs: number; runs: number; wickets: number }[];
    overs: { overNumber: number; totalRuns: number; totalWickets: number; ballsCount: number }[];
  })[];
  squads: {
    teamId: string;
    player: { id: string; name: string; shortName?: string | null; role?: string | null };
  }[];
  scoringAccess: { allowed: boolean; reason?: string | null };
  tournament?: { id: string; name: string } | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function MatchOverviewPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  const router = useRouter();
  const [startOpen, setStartOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}`);
      if (!res.ok) throw new Error("Match not found");
      return res.json() as Promise<{ match: MatchWithDetails }>;
    },
    refetchInterval: (query) => {
      return query.state.data?.match?.status === "LIVE" ? 15_000 : false;
    },
  });

  const match = data?.match;

  const canScore = match?.scoringAccess?.allowed ?? false;

  const quickActions = useMemo(() => {
    if (!match) return [];
    const list: {
      label: string;
      href: string;
      icon: typeof Zap;
      color: string;
      bg: string;
    }[] = [
      {
        label: match.status === "COMPLETED" ? "View Scorecard" : "Full Scorecard",
        href: "scorecard",
        icon: Activity,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        label: "Ball-by-Ball",
        href: "ball-by-ball",
        icon: CircleDot,
        color: "text-accent",
        bg: "bg-accent/10",
      },
      {
        label: "Commentary",
        href: "commentary",
        icon: MessageSquare,
        color: "text-warning",
        bg: "bg-warning/10",
      },
    ];
    if (match.status === "LIVE" || match.status === "INNINGS_BREAK") {
      list.push(
        canScore
          ? {
              label: "Continue Scoring",
              href: "live",
              icon: Zap,
              color: "text-success",
              bg: "bg-success/10",
            }
          : {
              label: "View Live",
              href: `/score/${match.id}`,
              icon: Zap,
              color: "text-success",
              bg: "bg-success/10",
            }
      );
    } else if (match.status === "READY") {
      list.push({
        label: "Start Innings",
        href: "live",
        icon: Zap,
        color: "text-success",
        bg: "bg-success/10",
      });
    }
    return list;
  }, [match, canScore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Trophy className="w-12 h-12 text-muted mb-4" />
        <p className="text-white font-medium">{error?.message || "Match not found"}</p>
        <p className="text-sm text-muted mt-1">The match you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  const isLive = match.status === "LIVE";
  const currentInnings = isLive && match.innings.length > 0 ? match.innings[match.innings.length - 1] : null;
  const currentOversDecimal =
    currentInnings && parseOversToBalls(currentInnings.totalOvers) > 0
      ? parseOversToBalls(currentInnings.totalOvers) / 6
      : 0;
  const currentRunRate =
    currentInnings && currentOversDecimal > 0
      ? (currentInnings.totalRuns / currentOversDecimal).toFixed(2)
      : null;

  const officials = [
    match.umpire1 && { role: "Umpire", name: match.umpire1 },
    match.umpire2 && { role: "Umpire", name: match.umpire2 },
    match.thirdUmpire && { role: "Third Umpire", name: match.thirdUmpire },
    match.matchReferee && { role: "Match Referee", name: match.matchReferee },
  ].filter(Boolean) as { role: string; name: string }[];

  const tossText = match.tossWinner ? `${match.tossWinner} won the toss` : "Toss pending";
  const tossDecisionText = match.tossDecision
    ? match.tossDecision === "BAT" ? "Elected to bat first" : "Elected to bowl first"
    : "";

  const scheduledDate = match.scheduledAt
    ? new Date(match.scheduledAt).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "";

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative flex flex-col items-center text-center">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success bg-success/15 px-3 py-1 rounded-full mb-4">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              LIVE
            </span>
          )}
          {!isLive && match.status === "COMPLETED" && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/15 px-3 py-1 rounded-full mb-4">
              COMPLETED
            </span>
          )}
          {!isLive && match.status === "SCHEDULED" && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent bg-accent/15 px-3 py-1 rounded-full mb-4">
              {scheduledDate}
            </span>
          )}
          <div className="flex items-center gap-8 mb-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold text-white mb-2">
                {match.homeTeam.shortName}
              </div>
              <p className="text-sm text-muted">{match.homeTeam.name}</p>
            </div>
            <div className="text-center">
              {currentInnings ? (
                <>
                  <p className="text-6xl font-bold gradient-text leading-none mb-1">
                    {currentInnings.totalRuns}/{currentInnings.totalWickets}
                  </p>
                  <p className="text-lg text-white/70">
                    <span className="text-muted">Overs:</span>{" "}
                    <span className="text-white font-semibold">{formatStoredOvers(currentInnings.totalOvers)}</span>
                  </p>
                </>
              ) : (
                <p className="text-4xl font-bold gradient-text leading-none">vs</p>
              )}
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold text-white mb-2">
                {match.awayTeam.shortName}
              </div>
              <p className="text-sm text-muted">{match.awayTeam.name}</p>
            </div>
          </div>
          {currentInnings && (
            <div className="flex items-center gap-6 mt-2">
              <div className="text-center">
                <p className="text-xs text-muted">CRR</p>
                <p className="text-accent font-bold">{currentRunRate ?? "0.00"}</p>
              </div>
              {currentInnings.targetScore && (
                <div className="text-center">
                  <p className="text-xs text-muted">Target</p>
                  <p className="text-white font-bold">{currentInnings.targetScore}</p>
                </div>
              )}
            </div>
          )}
          {match.result && <p className="text-sm text-muted mt-3">{match.result}</p>}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h3 className="text-sm font-medium text-muted mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {match.status === "SCHEDULED" && canScore && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setStartOpen(true)}
              className="col-span-2 md:col-span-4 bg-gradient-to-br from-primary/20 via-white/5 to-accent/10 border border-primary/30 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Play className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-white font-semibold">Start Match</p>
                  <p className="text-sm text-muted">
                    Set the toss, verify the Playing XI, pick openers and begin
                    the first innings.
                  </p>
                </div>
              </div>
              <span className="text-primary text-sm font-medium">Begin &rarr;</span>
            </motion.button>
          )}
          {match.status === "SCHEDULED" && !canScore && (
            <p className="col-span-2 md:col-span-4 text-xs text-muted bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              {match.scoringAccess?.reason ??
                "Only the match creator or assigned scorers can start this match."}
            </p>
          )}
          {(match.status === "LIVE" || match.status === "INNINGS_BREAK") &&
            (canScore ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => router.push(`/matches/${matchId}/live`)}
                className="col-span-2 md:col-span-4 bg-gradient-to-br from-success/20 via-white/5 to-accent/10 border border-success/30 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Continue Scoring</p>
                    <p className="text-sm text-muted">
                      {match.status === "INNINGS_BREAK"
                        ? "The innings break is over. Resume the next innings and keep scoring."
                        : "This match is live. Resume scoring exactly where you left off."}
                    </p>
                  </div>
                </div>
                <span className="text-success text-sm font-medium">Resume &rarr;</span>
              </motion.button>
            ) : (
              <Link
                href={`/score/${matchId}`}
                className="col-span-2 md:col-span-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3 text-left transition-colors hover:bg-white/8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">View Live Score</p>
                    <p className="text-sm text-muted">Watch the live scoreboard for this match.</p>
                  </div>
                </div>
                <span className="text-primary text-sm font-medium">View &rarr;</span>
              </Link>
            ))}
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href.startsWith("/") ? action.href : `/matches/${matchId}/${action.href}`}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center cursor-pointer transition-colors hover:bg-white/8">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2", action.bg)}>
                    <Icon className={cn("w-5 h-5", action.color)} />
                  </div>
                  <p className="text-sm text-white font-medium">{action.label}</p>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <BroadcastManager matchId={matchId} />
      </motion.div>

      {(match.status === "LIVE" ||
        match.status === "INNINGS_BREAK" ||
        match.status === "COMPLETED") && (
        <motion.div variants={itemVariants}>
          <HighlightsSection matchId={matchId} />
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-5 h-5 text-warning" />
            <h3 className="text-sm font-medium text-white">Toss</h3>
          </div>
          <p className="text-white font-semibold">{tossText}</p>
          {tossDecisionText && <p className="text-sm text-muted mt-1">{tossDecisionText}</p>}
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-medium text-white">Venue</h3>
          </div>
          <p className="text-white font-semibold">{match.venue || "TBD"}</p>
          {scheduledDate && <p className="text-sm text-muted mt-1">{scheduledDate}</p>}
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Cloud className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-medium text-white">Weather</h3>
          </div>
          <div className="flex items-center gap-4">
            <Wind className="w-4 h-4 text-white/30" />
            <p className="text-sm text-white">{match.weather || "Not reported"}</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Timer className="w-5 h-5 text-danger" />
            <h3 className="text-sm font-medium text-white">Pitch Report</h3>
          </div>
          <p className="text-sm text-white">{match.pitchCondition || "Not reported"}</p>
        </motion.div>

        {officials.length > 0 && (
          <motion.div variants={itemVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-success" />
              <h3 className="text-sm font-medium text-white">Officials</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {officials.map((o) => (
                <div key={o.name} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs text-muted font-medium">
                    {o.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-xs text-muted">{o.role}</p>
                    <p className="text-sm text-white">{o.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <StartMatchModal
        isOpen={startOpen}
        onClose={() => setStartOpen(false)}
        match={match}
        onStarted={() => router.push(`/matches/${matchId}/live`)}
      />
    </motion.div>
  );
}
