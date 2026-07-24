"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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

  const [match, setMatch] = useState<Match | null>(null);
  const [currentInnings, setCurrentInnings] = useState<Innings | null>(null);
  const [balls, setBalls] = useState<BallEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchMatchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch match");
      }
      const data = await res.json();
      const m: Match = data.match;
      setMatch(m);

      if (m.status !== "LIVE") {
        setError("This match is not currently live.");
        return;
      }

      if (m.innings && m.innings.length > 0) {
        const latestInnings = m.innings[m.innings.length - 1];
        setCurrentInnings(latestInnings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load match data");
    }
  }, [matchId]);

  const fetchBalls = useCallback(async () => {
    if (!currentInnings) return;
    try {
      const res = await fetch(`/api/matches/${matchId}/innings`);
      if (!res.ok) return;
      const data = await res.json();
      const inn = data.innings?.find((i: Innings) => i.id === currentInnings.id);
      if (inn) {
        setCurrentInnings(inn);
      }
    } catch {
      // silently fail, balls will be stale
    }
  }, [matchId, currentInnings?.id]);

  useEffect(() => {
    setLoading(true);
    fetchMatchData().finally(() => setLoading(false));
  }, [fetchMatchData]);

  useEffect(() => {
    if (!match || match.status !== "LIVE") return;
    const interval = setInterval(fetchBalls, 5000);
    return () => clearInterval(interval);
  }, [match, fetchBalls]);

  const totalRuns = currentInnings?.totalRuns ?? 0;
  const wickets = currentInnings?.totalWickets ?? 0;
  const totalBallsBowled = currentInnings
    ? currentInnings.overs.reduce((acc, o) => acc + o.ballsCount, 0)
    : 0;
  const currentOverNum = Math.floor(totalBallsBowled / 6);
  const currentBallInOver = totalBallsBowled % 6;

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

  const lastOverNumber = currentOverNum > 0 ? currentOverNum - 1 : 0;
  const thisOverBalls = currentInnings?.overs
    .filter((o) => o.overNumber === currentOverNum || o.overNumber === lastOverNumber)
    .flatMap((o) => {
      const overBalls = balls.filter((b) => b.overId === o.id);
      return overBalls;
    }) ?? [];

  const partnership = (() => {
    if (!currentInnings) return { runs: 0, balls: 0 };
    const fows = currentInnings.fallOfWickets ?? [];
    if (fows.length === 0) {
      return { runs: totalRuns, balls: totalBallsBowled };
    }
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
        extraRuns: extraRuns,
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

        if (!res.ok) {
          const data = await res.json();
          console.error("Failed to log ball:", data.error);
          return;
        }

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
        await fetchMatchData();
        await fetchBalls();
      } catch (err) {
        console.error("Error logging ball:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [currentInnings, match, matchId, currentBowler, onStrikeBatsman, nonStrikeBatsman, submitting, fetchMatchData, fetchBalls]
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

  if (error || !match) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-danger" />
          <p className="text-sm text-danger">{error || "Match not found"}</p>
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
              {match.tournament?.name ?? "Match"} &middot;{" "}
              {match.homeTeam.name} vs {match.awayTeam.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={async () => {
                if (balls.length === 0) return;
                setBalls((prev) => prev.slice(0, -1));
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-muted hover:text-white transition-colors"
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
            {currentInnings?.inningsNumber === 1
              ? "st"
              : currentInnings?.inningsNumber === 2
              ? "nd"
              : "th"}{" "}
            Innings
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
            <span className="text-white font-semibold">
              {formatOvers(totalBallsBowled)}
            </span>{" "}
            <span className="text-muted">/ {match.totalOvers}</span>
          </p>
          <div className="flex items-center justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-xs text-muted">CRR</p>
              <p className="text-accent font-bold">
                {(
                  totalRuns /
                  Math.max(totalBallsBowled / 6, 0.1)
                ).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted">Partnership</p>
              <p className="text-white font-bold">
                {partnership.runs}({partnership.balls})
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={cn(
            "bg-white/5 backdrop-blur-xl border rounded-2xl p-4",
            onStrikeBatsman
              ? "border-accent/50 glow-accent"
              : "border-white/10"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">Batsman</span>
            {onStrikeBatsman && (
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            )}
          </div>
          <p className="text-white font-semibold">
            {onStrikeBatsman?.player.name ?? "—"}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-2xl font-bold text-white">
              {onStrikeBatsman?.runs ?? 0}
            </p>
            <p className="text-sm text-muted">
              ({onStrikeBatsman?.balls ?? 0} balls)
            </p>
            <p className="text-sm text-accent font-medium">
              SR{" "}
              {(onStrikeBatsman?.strikeRate ?? 0).toFixed(1)}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "bg-white/5 backdrop-blur-xl border rounded-2xl p-4",
            nonStrikeBatsman
              ? "border-white/10"
              : "border-white/10"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">Non-Striker</span>
          </div>
          <p className="text-white font-semibold">
            {nonStrikeBatsman?.player.name ?? "—"}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-2xl font-bold text-white">
              {nonStrikeBatsman?.runs ?? 0}
            </p>
            <p className="text-sm text-muted">
              ({nonStrikeBatsman?.balls ?? 0} balls)
            </p>
            <p className="text-sm text-accent font-medium">
              SR{" "}
              {(nonStrikeBatsman?.strikeRate ?? 0).toFixed(1)}
            </p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">Bowler</span>
          </div>
          <p className="text-white font-semibold">
            {currentBowler?.player.name ?? "—"}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-sm text-white">
              <span className="text-muted">O:</span>{" "}
              {currentBowler?.overs ?? 0}
            </p>
            <p className="text-sm text-white">
              <span className="text-muted">R:</span>{" "}
              {currentBowler?.runs ?? 0}
            </p>
            <p className="text-sm text-white">
              <span className="text-muted">W:</span>{" "}
              {currentBowler?.wickets ?? 0}
            </p>
            <p className="text-sm text-accent font-medium">
              Econ:{" "}
              {(currentBowler?.economy ?? 0).toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <h3 className="text-xs font-medium text-muted mb-3">This Over</h3>
        <div className="flex gap-2 flex-wrap">
          <AnimatePresence>
            {balls
              .filter(
                (b) =>
                  b.overId ===
                  currentInnings?.overs.find(
                    (o) => o.overNumber === currentOverNum
                  )?.id
              )
              .map((ball) => (
                <motion.div
                  key={ball.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                    getBallColor(ball)
                  )}
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
            {
              label: "4",
              runs: 4,
              className: "bg-primary/20 text-primary hover:bg-primary/30 shadow-[0_0_20px_rgba(37,99,235,0.15)]",
            },
            {
              label: "6",
              runs: 6,
              className: "bg-accent/20 text-accent hover:bg-accent/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]",
            },
          ].map((btn) => (
            <motion.button
              key={btn.label}
              whileTap={{ scale: 0.9 }}
              disabled={submitting || !currentInnings}
              onClick={() => addBall(btn.runs)}
              className={cn(
                "py-4 rounded-xl text-xl font-bold transition-all",
                btn.className,
                (submitting || !currentInnings) && "opacity-50 cursor-not-allowed"
              )}
            >
              {btn.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <h3 className="text-xs font-medium text-muted mb-3">Extras & Wicket</h3>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            disabled={submitting || !currentInnings}
            onClick={() => addBall(0, "wd")}
            className={cn(
              "py-3 rounded-xl bg-warning/10 text-warning text-sm font-medium hover:bg-warning/20 transition-all",
              (submitting || !currentInnings) && "opacity-50 cursor-not-allowed"
            )}
          >
            Wide
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            disabled={submitting || !currentInnings}
            onClick={() => addBall(0, "nb")}
            className={cn(
              "py-3 rounded-xl bg-orange-500/10 text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-all",
              (submitting || !currentInnings) && "opacity-50 cursor-not-allowed"
            )}
          >
            No Ball
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            disabled={submitting || !currentInnings}
            onClick={() => addBall(0)}
            className={cn(
              "py-3 rounded-xl bg-white/5 text-muted text-sm font-medium hover:bg-white/10 transition-all",
              (submitting || !currentInnings) && "opacity-50 cursor-not-allowed"
            )}
          >
            Bye
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            disabled={submitting || !currentInnings}
            onClick={() => addBall(0)}
            className={cn(
              "py-3 rounded-xl bg-white/5 text-muted text-sm font-medium hover:bg-white/10 transition-all",
              (submitting || !currentInnings) && "opacity-50 cursor-not-allowed"
            )}
          >
            Leg Bye
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            disabled={submitting || !currentInnings}
            onClick={() => addBall(0, undefined, true)}
            className={cn(
              "py-3 rounded-xl bg-danger/15 text-danger text-sm font-medium hover:bg-danger/25 transition-all col-span-2 md:col-span-1",
              (submitting || !currentInnings) && "opacity-50 cursor-not-allowed"
            )}
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
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted hover:text-white transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Change Batsman
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Change Bowler
          </motion.button>
        </div>
      </div>
    </div>
  );
}
