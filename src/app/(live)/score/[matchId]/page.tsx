"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  MessageCircle,
  Twitter,
  RefreshCw,
  Wifi,
  Loader2,
} from "lucide-react";
import { cn, formatStoredOvers, parseOversToBalls, calculateRunRate } from "@/lib/utils";
import { isLegalDelivery } from "@/lib/scoring";
import { useSocketStore } from "@/store/useSocketStore";
import type { Match, Innings, Over, Ball, BattingScorecard, BowlingScorecard } from "@/types";

interface RecentBall {
  id: string;
  runs: number;
  isExtra: boolean;
  extraType: string | null;
  isWicket: boolean;
  overNumber: number;
  ballNumber: number;
}

interface CommentaryEntry {
  id: string;
  overLabel: string;
  bowlerName: string;
  batsmanName: string;
  text: string;
  outcome: "FOUR" | "SIX" | "WICKET" | "EXTRA" | "RUN" | "DOT";
}

type MatchWithInnings = Match & {
  homeTeam: { id: string; name: string; shortName: string; logo: string | null };
  awayTeam: { id: string; name: string; shortName: string; logo: string | null };
  tournament: { id: string; name: string } | null;
  innings: (Innings & {
    overs: (Over & { balls: Ball[] })[];
    battingCard: (BattingScorecard & { player: { id: string; name: string } })[];
    bowlingCard: (BowlingScorecard & { player: { id: string; name: string } })[];
  })[];
};

function getBallColor(runs: number, extras: string | null, isWicket: boolean): string {
  if (isWicket) return "bg-danger text-white";
  if (extras === "WIDE") return "bg-warning text-black";
  if (extras === "NO_BALL") return "bg-orange-500 text-white";
  if (runs === 6) return "bg-accent text-black";
  if (runs === 4) return "bg-primary text-white";
  if (runs === 0) return "bg-white/10 text-muted";
  return "bg-success/20 text-success";
}

function buildCommentary(
  innings: MatchWithInnings["innings"][number] | null
): CommentaryEntry[] {
  if (!innings) return [];

  const playerName = new Map<string, string>();
  (innings.battingCard ?? []).forEach((b) =>
    playerName.set(b.player.id, b.player.name)
  );
  (innings.bowlingCard ?? []).forEach((b) =>
    playerName.set(b.player.id, b.player.name)
  );

  const entries: CommentaryEntry[] = [];
  let legal = 0;

  for (const over of innings.overs ?? []) {
    for (const ball of over.balls ?? []) {
      const overLabel = `${Math.floor(legal / 6)}.${(legal % 6) + 1}`;
      const bowlerName = playerName.get(ball.bowlerId) ?? "Bowler";
      const batsmanName = playerName.get(ball.batsmanId) ?? "Batsman";

      let text: string;
      let outcome: CommentaryEntry["outcome"] = "RUN";

      if (ball.isWicket) {
        const type = (ball.wicketType ?? "wicket").replace(/_/g, " ");
        text = `OUT! ${type.charAt(0).toUpperCase()}${type.slice(1)}.`;
        outcome = "WICKET";
      } else if (ball.extraType === "WIDE") {
        const runs = Math.max(ball.extraRuns, 1);
        text = `${runs} wide${runs > 1 ? "s" : ""}.`;
        outcome = "EXTRA";
      } else if (ball.extraType === "NO_BALL") {
        text =
          ball.runs > 0
            ? `No ball, ${ball.runs} run${ball.runs > 1 ? "s" : ""}.`
            : "No ball.";
        outcome = "EXTRA";
      } else if (ball.extraType === "BYE") {
        text = `${ball.extraRuns} bye${ball.extraRuns === 1 ? "" : "s"}.`;
        outcome = "EXTRA";
      } else if (ball.extraType === "LEG_BYE") {
        text = `${ball.extraRuns} leg ${ball.extraRuns === 1 ? "bye" : "byes"}.`;
        outcome = "EXTRA";
      } else if (ball.runs === 0) {
        text = "No run.";
        outcome = "DOT";
      } else if (ball.runs === 4) {
        text = "FOUR!";
        outcome = "FOUR";
      } else if (ball.runs === 6) {
        text = "SIX!";
        outcome = "SIX";
      } else {
        text = `${ball.runs} run${ball.runs > 1 ? "s" : ""}.`;
      }

      entries.push({
        id: ball.id,
        overLabel,
        bowlerName,
        batsmanName,
        text,
        outcome,
      });

      if (isLegalDelivery(ball.extraType)) legal += 1;
    }
  }

  return entries.reverse();
}

export default function PublicLiveScorePage() {
  const params = useParams();
  const matchId = params.matchId as string;

  const { connect, subscribe, unsubscribe, on, off, isConnected } =
    useSocketStore();

  const [match, setMatch] = useState<MatchWithInnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Match not found");
        } else {
          setError("Failed to load match");
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMatch(data.match);
      setError(null);
    } catch {
      setError("Failed to load match");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    fetchMatch();
  }, [matchId, fetchMatch]);

  // Socket delivery is the primary sync path while connected.
  useEffect(() => {
    if (!matchId) return;
    connect();
  }, [matchId, connect]);

  useEffect(() => {
    if (!matchId || !isConnected) return;
    subscribe(matchId);

    const events = [
      "score:updated",
      "match:updated",
      "innings:updated",
      "innings:started",
      "innings:ended",
      "strike:swapped",
      "commentary:added",
    ];
    const handler = () => fetchMatch();
    events.forEach((event) => on(event, handler));

    return () => {
      unsubscribe(matchId);
      events.forEach((event) => off(event, handler));
    };
  }, [matchId, isConnected, subscribe, unsubscribe, on, off, fetchMatch]);

  // Polling only as a fallback when the socket is not connected.
  useEffect(() => {
    if (!matchId || isConnected) return;
    const interval = setInterval(fetchMatch, 30000);
    return () => clearInterval(interval);
  }, [matchId, isConnected, fetchMatch]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <span className="text-lg font-bold gradient-text">ScoreBolt</span>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-danger text-lg font-medium mb-2">{error || "Match not found"}</p>
            <p className="text-muted text-sm">This match may not exist or has been removed.</p>
          </div>
        </main>
      </div>
    );
  }

  const latestInnings = match.innings?.length
    ? match.innings.reduce((latest, inn) => (inn.inningsNumber > latest.inningsNumber ? inn : latest), match.innings[0])
    : null;

  const currentBatsmen = latestInnings
    ? latestInnings.battingCard
        .filter((b) => b.isNotOut)
        .slice(0, 2)
    : [];

  const currentBowler = latestInnings
    ? latestInnings.bowlingCard.reduce(
        (latest, bowler) => (!latest || bowler.overs > latest.overs ? bowler : latest),
        null as (BowlingScorecard & { player: { id: string; name: string } }) | null
      )
    : null;

  const recentBalls: RecentBall[] = latestInnings
    ? (latestInnings.overs ?? [])
        .flatMap((ov) =>
          (ov.balls ?? []).map((b) => ({
            id: b.id,
            runs: b.isWicket ? 0 : b.runs,
            isExtra: b.isExtra,
            extraType: b.extraType,
            isWicket: b.isWicket,
            overNumber: ov.overNumber,
            ballNumber: b.ballNumber,
          }))
        )
        .slice(-12)
    : [];

  const displayedBalls = recentBalls;

  const ballsCompleted = latestInnings
    ? parseOversToBalls(latestInnings.totalOvers)
    : 0;
  const crr = latestInnings
    ? calculateRunRate(latestInnings.totalRuns, ballsCompleted / 6)
    : 0;

  const ballsRemaining = match.totalOvers * 6 - ballsCompleted;
  const rrr =
    latestInnings?.targetScore &&
    latestInnings.targetScore > latestInnings.totalRuns &&
    ballsRemaining > 0
      ? calculateRunRate(
          latestInnings.targetScore - latestInnings.totalRuns,
          ballsRemaining / 6
        )
      : null;

  const commentary = buildCommentary(latestInnings);

  const shareText = `${match.name}: ${match.homeTeam.shortName} vs ${match.awayTeam.shortName} - Live Score`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold gradient-text">ScoreBolt</span>
            {match.status === "LIVE" && (
              <span className="text-[10px] text-success bg-success/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                LIVE
              </span>
            )}
            {match.status === "COMPLETED" && (
              <span className="text-[10px] text-muted bg-white/10 px-2 py-0.5 rounded-full">
                COMPLETED
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={fetchMatch}
              className="p-2 rounded-lg bg-white/5 text-muted hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
            <span className="text-[10px] text-muted hidden sm:block">
              {isConnected ? "Live updates" : "Auto-refresh: 30s"}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <div className="relative">
              <p className="text-sm text-muted mb-6">
                {match.tournament?.name ? `${match.tournament.name} ` : ""}
                {match.name}
              </p>

              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 flex items-center justify-center text-3xl md:text-4xl font-bold text-white mb-3 mx-auto">
                    {match.homeTeam.shortName}
                  </div>
                  <p className="text-xs md:text-sm text-white font-medium">
                    {match.homeTeam.name}
                  </p>
                </div>

                <div className="text-center">
                  <motion.p
                    key={latestInnings?.totalRuns ?? 0}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    className="text-7xl md:text-8xl font-bold gradient-text leading-none"
                  >
                    {latestInnings
                      ? `${latestInnings.totalRuns}/${latestInnings.totalWickets}`
                      : "-/-"}
                  </motion.p>
                  <p className="text-lg md:text-xl text-white/60 mt-2">
                    <span className="text-muted">Overs:</span>{" "}
                    <span className="text-white font-semibold">
                      {latestInnings ? formatStoredOvers(latestInnings.totalOvers) : "0"}
                    </span>
                    <span className="text-muted"> / {match.totalOvers}</span>
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 flex items-center justify-center text-3xl md:text-4xl font-bold text-white mb-3 mx-auto">
                    {match.awayTeam.shortName}
                  </div>
                  <p className="text-xs md:text-sm text-white font-medium">
                    {match.awayTeam.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-8 md:gap-12">
                <div className="text-center">
                  <p className="text-xs text-muted mb-0.5">CRR</p>
                  <p className="text-lg md:text-xl font-bold text-accent">{crr.toFixed(2)}</p>
                </div>
                {rrr !== null && (
                  <div className="text-center">
                    <p className="text-xs text-muted mb-0.5">RRR</p>
                    <p className="text-lg md:text-xl font-bold text-warning">{rrr.toFixed(2)}</p>
                  </div>
                )}
                {latestInnings?.targetScore && (
                  <div className="text-center">
                    <p className="text-xs text-muted mb-0.5">Target</p>
                    <p className="text-lg md:text-xl font-bold text-white">
                      {latestInnings.targetScore}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
          >
            <p className="text-xs text-muted mb-3 text-center">Recent Balls</p>
            {displayedBalls.length > 0 ? (
              <div className="flex gap-2 justify-center flex-wrap">
                <AnimatePresence>
                  {displayedBalls.map((ball, i) => (
                    <motion.div
                      key={ball.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={cn(
                        "w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-xs md:text-sm font-bold",
                        getBallColor(
                          ball.runs,
                          ball.isExtra ? ball.extraType : null,
                          ball.isWicket
                        )
                      )}
                    >
                      {ball.isWicket
                        ? "W"
                        : ball.extraType === "WIDE"
                        ? "WD"
                        : ball.isExtra
                        ? "N"
                        : ball.runs}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <p className="text-center text-muted text-xs">No balls bowled yet</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
          >
            <p className="text-xs text-muted mb-3 text-center">Commentary</p>
            {commentary.length > 0 ? (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {commentary.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={cn(
                        "flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm",
                        c.outcome === "WICKET" && "border-danger/30 bg-danger/10",
                        c.outcome === "FOUR" && "border-primary/30 bg-primary/10",
                        c.outcome === "SIX" && "border-accent/30 bg-accent/10"
                      )}
                    >
                      <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted">
                        {c.overLabel}
                      </span>
                      <p className="min-w-0 text-white/80">
                        <span className="font-medium text-white">
                          {c.bowlerName}
                        </span>{" "}
                        <span className="text-muted">to</span>{" "}
                        <span className="font-medium text-white">
                          {c.batsmanName}
                        </span>
                        ,{" "}
                        <span
                          className={cn(
                            "font-semibold",
                            c.outcome === "WICKET" && "text-danger",
                            c.outcome === "FOUR" && "text-primary",
                            c.outcome === "SIX" && "text-accent",
                            c.outcome === "EXTRA" && "text-warning"
                          )}
                        >
                          {c.text}
                        </span>
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <p className="text-center text-muted text-xs">No balls bowled yet</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted mb-1">Batsman</p>
                {currentBatsmen.length > 0 ? (
                  <>
                    <p className="text-sm text-white font-medium">
                      {currentBatsmen[0].player.name} *
                    </p>
                    <p className="text-xs text-accent">
                      {currentBatsmen[0].runs}({currentBatsmen[0].balls}) SR{" "}
                      {currentBatsmen[0].strikeRate?.toFixed(2) || "0.00"}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted">-</p>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-muted mb-1">Bowler</p>
                {currentBowler ? (
                  <>
                    <p className="text-sm text-white font-medium">
                      {currentBowler.player.name}
                    </p>
                    <p className="text-xs text-danger">
                      {formatStoredOvers(currentBowler.overs)}-{currentBowler.maidens}-{currentBowler.runs}-{currentBowler.wickets}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted">-</p>
                )}
              </div>
            </div>
          </motion.div>

          {match.result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-success/10 border border-success/20 rounded-2xl p-4 text-center"
            >
              <p className="text-sm text-success font-medium">{match.result}</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={copyLink}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                copied
                  ? "bg-success/20 text-success border border-success/30"
                  : "bg-white/5 border border-white/10 text-muted hover:text-white"
              )}
            >
              {copied ? (
                <>
                  <Wifi className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(
                    `${shareText} ${window.location.href}`
                  )}`,
                  "_blank"
                )
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-medium hover:bg-success/20 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `${shareText} ${window.location.href}`
                  )}`,
                  "_blank"
                )
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-all"
            >
              <Twitter className="w-4 h-4" />
              Twitter
            </motion.button>
          </motion.div>
        </div>
      </main>

      <footer className="text-center py-4 border-t border-white/5">
        <p className="text-[10px] text-muted/50">
          {isConnected
            ? "Powered by ScoreBolt &middot; Live updates"
            : "Powered by ScoreBolt &middot; Auto-refreshes every 30 seconds"}
        </p>
      </footer>
    </div>
  );
}
