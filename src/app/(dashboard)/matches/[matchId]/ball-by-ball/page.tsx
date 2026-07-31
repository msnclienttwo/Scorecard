"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface BallData {
  id: string;
  ballNumber: number;
  runs: number;
  isExtra: boolean;
  extraType: string | null;
  isWicket: boolean;
  wicketType: string | null;
  description: string | null;
  bowlerId: string;
  batsmanId: string;
  ballResult: string;
}

interface OverData {
  id: string;
  overNumber: number;
  bowlerId: string;
  totalRuns: number;
  totalWickets: number;
  ballsCount: number;
  isCompleted: boolean;
  balls: BallData[];
}

interface PlayerEntry {
  playerId: string;
  player: { id: string; name: string };
}

interface InningsData {
  id: string;
  inningsNumber: number;
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  overs: OverData[];
  battingCard: PlayerEntry[];
  bowlingCard: PlayerEntry[];
}

function getBallChipColor(ballResult: string): string {
  switch (ballResult) {
    case "FOUR":
      return "bg-primary text-white";
    case "SIX":
      return "bg-accent text-black";
    case "WIDE":
      return "bg-warning text-black";
    case "NO_BALL":
      return "bg-orange-500 text-white";
    case "DOT":
      return "bg-white/10 text-muted";
    case "BYE":
    case "LEG_BYE":
      return "bg-success/20 text-success";
    default:
      return "bg-white/10 text-muted";
  }
}

function getBallChipLabel(ball: BallData): string {
  if (ball.isWicket) return "W";
  if (ball.extraType === "WIDE") return "WD";
  if (ball.extraType === "NO_BALL") return "NB";
  return String(ball.runs);
}

export default function BallByBallPage() {
  const params = useParams();
  const matchId = params.matchId as string;

  const [innings, setInnings] = useState<InningsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBall, setHoveredBall] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInnings() {
      try {
        const res = await fetch(`/api/matches/${matchId}/innings`);
        const data = await res.json();
        setInnings(data.innings || []);
      } catch {
        console.error("Failed to fetch innings");
      } finally {
        setLoading(false);
      }
    }
    if (matchId) fetchInnings();
  }, [matchId]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-1">Ball-by-Ball</h2>
          <p className="text-sm text-muted">Loading match data...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </motion.div>
    );
  }

  const hasData = innings.some(
    (inn) => inn.overs.length > 0 && inn.overs.some((o) => o.balls.length > 0)
  );

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-1">Ball-by-Ball</h2>
          <p className="text-sm text-muted">No ball-by-ball data available</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted text-sm">No ball-by-ball data available</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {innings.map((inn) => {
        const playerNameMap = new Map<string, string>();
        inn.battingCard.forEach((bc) =>
          playerNameMap.set(bc.playerId, bc.player.name)
        );
        inn.bowlingCard.forEach((bc) =>
          playerNameMap.set(bc.playerId, bc.player.name)
        );

        return (
          <div key={inn.id} className="space-y-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-1">
                Innings {inn.inningsNumber}
              </h2>
              <p className="text-sm text-muted">
                {inn.totalRuns}/{inn.totalWickets} ({inn.totalOvers} overs)
              </p>
            </div>

            <div className="space-y-4">
              {inn.overs.map((over) => {
                const overWickets = over.balls.filter(
                  (b) => b.isWicket
                ).length;
                return (
                  <motion.div
                    key={over.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: over.overNumber * 0.05 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-white">
                          Over {over.overNumber + 1}
                        </span>
                        <span className="text-sm text-accent font-medium">
                          {over.totalRuns} runs
                        </span>
                        {overWickets > 0 && (
                          <span className="text-sm text-danger font-medium">
                            {overWickets} wkt
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted">
                        {playerNameMap.get(over.bowlerId) || "Unknown"}
                      </span>
                    </div>

                    <div className="flex gap-2 flex-wrap mb-3">
                      {over.balls.map((ball) => (
                        <div key={ball.id} className="relative">
                          <motion.div
                            whileHover={{ scale: 1.15 }}
                            onMouseEnter={() => setHoveredBall(ball.id)}
                            onMouseLeave={() => setHoveredBall(null)}
                            className={cn(
                              "w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold cursor-default transition-all",
                              getBallChipColor(ball.ballResult)
                            )}
                          >
                            {getBallChipLabel(ball)}
                          </motion.div>
                          {hoveredBall === ball.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-3 w-64 z-50"
                            >
                              <p className="text-xs text-white font-medium mb-1">
                                {playerNameMap.get(ball.batsmanId) ||
                                  "Unknown"}{" "}
                                vs{" "}
                                {playerNameMap.get(ball.bowlerId) ||
                                  "Unknown"}
                              </p>
                              {ball.description && (
                                <p className="text-xs text-muted">
                                  {ball.description}
                                </p>
                              )}
                              {ball.isWicket && ball.wicketType && (
                                <p className="text-xs text-danger font-medium mt-1">
                                  {ball.wicketType.replace(/_/g, " ")}
                                </p>
                              )}
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1">
                      {over.balls.map((ball) => {
                        const ballInOver =
                          ((ball.ballNumber - 1) % 6) + 1;
                        return (
                          <p
                            key={ball.id}
                            className="text-xs text-muted/70 leading-relaxed"
                          >
                            <span className="text-white/50 font-mono">
                              {over.overNumber + 1}.{ballInOver}
                            </span>{" "}
                            {ball.description ||
                              (ball.isWicket
                                ? `WICKET - ${ball.wicketType?.replace(/_/g, " ") || "Out"}`
                                : `${ball.runs} run${ball.runs !== 1 ? "s" : ""}`)}
                          </p>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
