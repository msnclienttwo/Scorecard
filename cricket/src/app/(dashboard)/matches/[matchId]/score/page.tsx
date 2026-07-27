"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Undo2,
  RefreshCw,
  ArrowLeftRight,
  UserPlus,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn, formatOvers } from "@/lib/utils";

interface Player {
  id: string;
  name: string;
}

interface BattingScorecard {
  id: string;
  playerId: string;
  player: Player;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isNotOut: boolean;
  dismissalType?: string | null;
}

interface BowlingScorecard {
  id: string;
  playerId: string;
  player: Player;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  wides: number;
  noBalls: number;
  economy: number;
}

interface Over {
  id: string;
  overNumber: number;
  bowlerId: string;
  totalRuns: number;
  totalWickets: number;
  ballsCount: number;
  isCompleted: boolean;
}

interface BallEvent {
  id: string;
  ballNumber: number;
  runs: number;
  isExtra: boolean;
  extraType?: string | null;
  extraRuns: number;
  isWicket: boolean;
  wicketType?: string | null;
  overId: string;
  bowlerId: string;
  batsmanId: string;
}

interface Innings {
  id: string;
  inningsNumber: number;
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  extras: number;
  battingCard: BattingScorecard[];
  bowlingCard: BowlingScorecard[];
  overs: Over[];
  fallOfWickets: Array<{
    id: string;
    wicketNumber: number;
    playerId: string;
    runs: number;
    overs: number;
    batterName: string;
  }>;
}

interface Match {
  id: string;
  status: string;
  homeTeam: { id: string; name: string; logo?: string };
  awayTeam: { id: string; name: string; logo?: string };
  tournament?: { id: string; name: string };
  totalOvers: number;
  innings: Innings[];
}

function getBallColor(ball: BallEvent): string {
  if (ball.isWicket) return "bg-danger text-white";
  if (ball.extraType === "WIDE") return "bg-warning text-black";
  if (ball.extraType === "NO_BALL") return "bg-orange-500 text-white";
  if (ball.runs === 6) return "bg-accent text-black";
  if (ball.runs === 4) return "bg-primary text-white";
  if (ball.runs === 0 && !ball.isExtra) return "bg-white/10 text-muted";
  return "bg-success/20 text-success";
}

function getBallDisplay(ball: BallEvent): string {
  if (ball.isWicket) return "W";
  if (ball.extraType === "WIDE") return "WD";
  if (ball.extraType === "NO_BALL") return "NB";
  return String(ball.runs);
}

function mapBallResult(
  runs: number,
  extras?: string,
  isWicket?: boolean
): { ballResult: string; extraType?: string; extraRuns: number } {
  if (isWicket) return { ballResult: "WICKET", extraRuns: 0 };
  if (extras === "wd") return { ballResult: "WIDE", extraType: "WIDE", extraRuns: runs + 1 };
  if (extras === "nb") return { ballResult: "NO_BALL", extraType: "NO_BALL", extraRuns: runs + 1 };
  if (runs === 0) return { ballResult: "DOT", extraRuns: 0 };
  if (runs === 4) return { ballResult: "FOUR", extraRuns: 0 };
  if (runs === 6) return { ballResult: "SIX", extraRuns: 0 };
  return { ballResult: "SINGLE", extraRuns: 0 };
}

export default function LiveScoringPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const queryClient = useQueryClient();

  const [balls, setBalls] = useState<BallEvent[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const matchQuery = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}`);
      if (!res.ok) throw new Error("Match not found");
      return res.json() as Promise<{ match: Match }>;
    },
    refetchInterval: (query) => {
      return query.state.data?.match?.status === "LIVE" ? 5_000 : false;
    },
  });

  const inningsQuery = useQuery({
    queryKey: ["innings", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}/innings`);
      if (!res.ok) return { innings: [] as Innings[] };
      return res.json() as Promise<{ innings: Innings[] }>;
    },
    refetchInterval: (query) => {
      return query.state.data?.innings?.some((i) => i.overs.some((o) => !o.isCompleted)) ? 5_000 : false;
    },
  });

  const match = matchQuery.data?.match;
  const innings = inningsQuery.data?.innings ?? [];
  const loading = matchQuery.isLoading || inningsQuery.isLoading;

  const currentInnings = match && match.innings.length > 0
    ? innings.find((i) => i.id === match.innings[match.innings.length - 1].id) ?? match.innings[match.innings.length - 1]
    : null;

  const isLive = match?.status === "LIVE";

  const totalRuns = currentInnings?.totalRuns ?? 0;
  const wickets = currentInnings?.totalWickets ?? 0;
  const totalBallsBowled = currentInnings
    ? currentInnings.overs.reduce((acc, o) => acc + o.ballsCount, 0)
    : 0;
  const currentOverNum = Math.floor(totalBallsBowled / 6);

  const onStrikeBatsman = currentInnings?.battingCard.find((b) => b.isNotOut) ?? null;
  const nonStrikeBatsman = currentInnings?.battingCard.find(
    (b) => b.isNotOut && b.id !== onStrikeBatsman?.id
  ) ?? null;
  const currentBowler =
    currentInnings?.bowlingCard.length
      ? currentInnings.bowlingCard.reduce((latest, b) =>
          b.overs > (latest?.overs ?? 0) ? b : latest
        , currentInnings.bowlingCard[0])
      : null;

  const thisOverBalls = currentInnings?.overs
    .filter((o) => o.overNumber === currentOverNum)
    .flatMap((o) => balls.filter((b) => b.overId === o.id)) ?? [];

  const partnership = (() => {
    if (!currentInnings) return { runs: 0, balls: 0 };
    const fows = currentInnings.fallOfWickets ?? [];
    if (fows.length === 0) return { runs: totalRuns, balls: totalBallsBowled };
    const lastFow = fows[fows.length - 1];
    return {
      runs: totalRuns - lastFow.runs,
      balls: totalBallsBowled - Math.round(lastFow.overs * 6),
    };
  })();

  const addBall = useCallback(
    async (runs: number, extras?: string, isWicket?: boolean) => {
      if (!currentInnings || !match || submitting) return;
      setSubmitting(true);

      const { ballResult, extraType, extraRuns } = mapBallResult(runs, extras, isWicket);

      const payload = {
        inningsId: currentInnings.id,
        bowlerId: currentBowler?.playerId ?? "",
        batsmanId: onStrikeBatsman?.playerId ?? "",
        nonStrikerId: nonStrikeBatsman?.playerId ?? "",
        runs: extras ? 0 : runs,
        ballResult,
        isExtra: !!extraType,
        extraType: extraType ?? null,
        extraRuns,
        isWicket: isWicket ?? false,
        wicketType: isWicket ? "BOWLED" : null,
        fielderId: null,
        description: null,
      };

      try {
        const res = await fetch(`/api/matches/${matchId}/balls`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) return;

        const result = await res.json();
        const newBall: BallEvent = {
          id: result.ball.id,
          ballNumber: result.ball.ballNumber,
          runs,
          isExtra: !!extraType,
          extraType: extraType ?? null,
          extraRuns,
          isWicket: isWicket ?? false,
          wicketType: isWicket ? "BOWLED" : null,
          overId: result.ball.overId,
          bowlerId: result.ball.bowlerId,
          batsmanId: result.ball.batsmanId,
        };
        setBalls((prev) => [...prev, newBall]);

        queryClient.invalidateQueries({ queryKey: ["match", matchId] });
        queryClient.invalidateQueries({ queryKey: ["innings", matchId] });
      } catch (err) {
        console.error("Error logging ball:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [currentInnings, match, matchId, currentBowler, onStrikeBatsman, nonStrikeBatsman, submitting, queryClient]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted">Loading match data...</p>
        </div>
      </div>
    );
  }

  if (!match || matchQuery.error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-danger" />
          <p className="text-sm text-danger">Match not found</p>
        </div>
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-danger" />
          <p className="text-sm text-danger">This match is not currently live.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-success bg-success/15 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              LIVE
            </span>
            <span className="text-sm text-muted">
              {match.tournament?.name ?? "Match"} &middot; {match.homeTeam.name} vs {match.awayTeam.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setBalls((prev) => prev.slice(0, -1))}
              disabled={balls.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-muted hover:text-white transition-colors disabled:opacity-40"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </motion.button>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative">
          <p className="text-sm text-muted mb-1">
            {match.homeTeam.name} vs {match.awayTeam.name} &middot;{" "}
            {currentInnings?.inningsNumber ?? 1}
            {currentInnings?.inningsNumber === 1 ? "st" : currentInnings?.inningsNumber === 2 ? "nd" : "th"} Innings
          </p>
          <motion.p
            key={totalRuns}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-7xl font-bold gradient-text leading-none my-4"
          >
            {totalRuns}/{wickets}
          </motion.p>
          <p className="text-lg text-white/70">
            <span className="text-muted">Overs:</span>{" "}
            <span className="text-white font-semibold">{formatOvers(totalBallsBowled)}</span>{" "}
            <span className="text-muted">/ {match.totalOvers}</span>
          </p>
          <div className="flex items-center justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-xs text-muted">CRR</p>
              <p className="text-accent font-bold">
                {(totalRuns / Math.max(totalBallsBowled / 6, 0.1)).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted">Partnership</p>
              <p className="text-white font-bold">{partnership.runs}({partnership.balls})</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cn("bg-white/5 backdrop-blur-xl border rounded-2xl p-4", onStrikeBatsman ? "border-accent/50 glow-accent" : "border-white/10")}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">Batsman</span>
            {onStrikeBatsman && <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
          </div>
          <p className="text-white font-semibold">{onStrikeBatsman?.player.name ?? "\u2014"}</p>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-2xl font-bold text-white">{onStrikeBatsman?.runs ?? 0}</p>
            <p className="text-sm text-muted">({onStrikeBatsman?.balls ?? 0} balls)</p>
            <p className="text-sm text-accent font-medium">SR {(onStrikeBatsman?.strikeRate ?? 0).toFixed(1)}</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">Non-Striker</span>
          </div>
          <p className="text-white font-semibold">{nonStrikeBatsman?.player.name ?? "\u2014"}</p>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-2xl font-bold text-white">{nonStrikeBatsman?.runs ?? 0}</p>
            <p className="text-sm text-muted">({nonStrikeBatsman?.balls ?? 0} balls)</p>
            <p className="text-sm text-accent font-medium">SR {(nonStrikeBatsman?.strikeRate ?? 0).toFixed(1)}</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">Bowler</span>
          </div>
          <p className="text-white font-semibold">{currentBowler?.player.name ?? "\u2014"}</p>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-sm text-white"><span className="text-muted">O:</span> {currentBowler?.overs ?? 0}</p>
            <p className="text-sm text-white"><span className="text-muted">R:</span> {currentBowler?.runs ?? 0}</p>
            <p className="text-sm text-white"><span className="text-muted">W:</span> {currentBowler?.wickets ?? 0}</p>
            <p className="text-sm text-accent font-medium">Econ: {(currentBowler?.economy ?? 0).toFixed(1)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <h3 className="text-xs font-medium text-muted mb-3">This Over</h3>
        <div className="flex gap-2 flex-wrap">
          <AnimatePresence>
            {thisOverBalls.map((ball) => (
              <motion.div
                key={ball.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold", getBallColor(ball))}
              >
                {getBallDisplay(ball)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <h3 className="text-xs font-medium text-muted mb-3">Score</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "0", runs: 0, className: "bg-white/5 text-muted hover:bg-white/10" },
            { label: "1", runs: 1, className: "bg-success/10 text-success hover:bg-success/20" },
            { label: "2", runs: 2, className: "bg-success/15 text-success hover:bg-success/25" },
            { label: "3", runs: 3, className: "bg-success/20 text-success hover:bg-success/30" },
            { label: "4", runs: 4, className: "bg-primary/20 text-primary hover:bg-primary/30 shadow-[0_0_20px_rgba(37,99,235,0.15)]" },
            { label: "6", runs: 6, className: "bg-accent/20 text-accent hover:bg-accent/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]" },
          ].map((btn) => (
            <motion.button
              key={btn.label}
              whileTap={{ scale: 0.9 }}
              disabled={submitting || !currentInnings}
              onClick={() => addBall(btn.runs)}
              className={cn("py-4 rounded-xl text-xl font-bold transition-all", btn.className, (submitting || !currentInnings) && "opacity-50 cursor-not-allowed")}
            >
              {btn.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <h3 className="text-xs font-medium text-muted mb-3">Extras & Wicket</h3>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          {[
            { label: "Wide", onClick: () => addBall(0, "wd"), className: "bg-warning/10 text-warning hover:bg-warning/20" },
            { label: "No Ball", onClick: () => addBall(0, "nb"), className: "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" },
            { label: "Bye", onClick: () => addBall(0), className: "bg-white/5 text-muted hover:bg-white/10" },
            { label: "Leg Bye", onClick: () => addBall(0), className: "bg-white/5 text-muted hover:bg-white/10" },
          ].map((btn) => (
            <motion.button
              key={btn.label}
              whileTap={{ scale: 0.9 }}
              disabled={submitting || !currentInnings}
              onClick={btn.onClick}
              className={cn("py-3 rounded-xl text-sm font-medium transition-all", btn.className, (submitting || !currentInnings) && "opacity-50 cursor-not-allowed")}
            >
              {btn.label}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.9 }}
            disabled={submitting || !currentInnings}
            onClick={() => addBall(0, undefined, true)}
            className={cn("py-3 rounded-xl bg-danger/15 text-danger text-sm font-medium hover:bg-danger/25 transition-all col-span-2 md:col-span-1", (submitting || !currentInnings) && "opacity-50 cursor-not-allowed")}
          >
            WICKET
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="py-3 rounded-xl bg-white/5 text-muted text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-1"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            End Over
          </motion.button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <h3 className="text-xs font-medium text-muted mb-3">Quick Actions</h3>
        <div className="flex gap-3 flex-wrap">
          <motion.button whileTap={{ scale: 0.95 }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted hover:text-white transition-colors">
            <UserPlus className="w-4 h-4" />
            Change Batsman
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
            Change Bowler
          </motion.button>
        </div>
      </div>
    </div>
  );
}
