"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { cn, formatStoredOvers, parseOversToBalls } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";

interface Player {
  id: string;
  name: string;
}

interface BattingCard {
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
  bowlerId?: string | null;
  fielderId?: string | null;
  batPosition?: number;
}

interface BowlingCard {
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

interface FallOfWicket {
  id: string;
  wicketNumber: number;
  playerId: string;
  runs: number;
  overs: number;
  bowlerId?: string;
  batterName?: string;
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
  battingCard: BattingCard[];
  bowlingCard: BowlingCard[];
  fallOfWickets: FallOfWicket[];
  overs: Array<{ id: string; overNumber: number; totalRuns: number; extras: number }>;
}

interface Match {
  id: string;
  status: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  totalOvers: number;
}

function getDismissalText(card: BattingCard): string {
  if (card.isNotOut) return "not out";
  if (card.dismissalType) {
    const type = card.dismissalType.replace(/_/g, " ").toLowerCase();
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  return "\u2014";
}

function getExtrasBreakdown(innings: Innings) {
  const wides = innings.bowlingCard.reduce((s, b) => s + b.wides, 0);
  const noBalls = innings.bowlingCard.reduce((s, b) => s + b.noBalls, 0);
  const total = innings.extras;
  const byes = Math.max(0, total - wides - noBalls);
  return [
    { type: "Wides", count: wides },
    { type: "No Balls", count: noBalls },
    { type: "Byes", count: byes },
    { type: "Leg Byes", count: 0 },
  ].filter((e) => e.count > 0);
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

export default function ScorecardPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const [activeInnings, setActiveInnings] = useState(0);

  const matchQuery = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}`);
      if (!res.ok) throw new Error("Failed to fetch match");
      return res.json() as Promise<{ match: Match }>;
    },
  });

  const inningsQuery = useQuery({
    queryKey: ["innings", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}/innings`);
      if (!res.ok) return { innings: [] };
      return res.json() as Promise<{ innings: Innings[] }>;
    },
  });

  const match = matchQuery.data?.match;
  const innings = inningsQuery.data?.innings ?? [];
  const loading = matchQuery.isLoading || inningsQuery.isLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted">Loading scorecard...</p>
        </div>
      </div>
    );
  }

  if (matchQuery.error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-10 h-10 text-danger" />
          <p className="text-sm text-danger">{matchQuery.error.message}</p>
        </div>
      </div>
    );
  }

  if (innings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted">No scorecard data available</p>
        </div>
      </div>
    );
  }

  const current = innings[activeInnings];
  const extrasBreakdown = getExtrasBreakdown(current);
  const totalExtras = extrasBreakdown.reduce((s, e) => s + e.count, 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {innings.map((inn, idx) => {
          const teamName = inn.inningsNumber === 1
            ? match?.homeTeam.name ?? inn.battingTeam
            : match?.awayTeam.name ?? inn.battingTeam;
          return (
            <motion.button
              key={inn.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveInnings(idx)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                activeInnings === idx
                  ? "bg-primary text-white glow-primary"
                  : "bg-white/5 text-muted border border-white/10"
              )}
            >
              {teamName} \u2014 {inn.totalRuns}/{inn.totalWickets}
            </motion.button>
          );
        })}
      </div>

      <motion.div variants={rowVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-white">
            {innings[activeInnings].battingTeam || match?.homeTeam.name || "Batting Team"}
          </h2>
          <p className="text-2xl font-bold gradient-text">
            {current.totalRuns}/{current.totalWickets}
          </p>
        </div>
        <p className="text-sm text-muted">
          Overs: {formatStoredOvers(current.totalOvers)} &middot; Extras: {current.extras} &middot;
          RR: {(parseOversToBalls(current.totalOvers) / 6) > 0 ? (current.totalRuns / (parseOversToBalls(current.totalOvers) / 6)).toFixed(2) : "0.00"}
        </p>
      </motion.div>

      <motion.div variants={rowVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Batting</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Batsman", "Dismissal", "R", "B", "4s", "6s", "SR"].map((h) => (
                  <th key={h} className={cn("px-4 py-3 text-xs text-muted font-medium", h === "Batsman" || h === "Dismissal" ? "text-left" : "text-right")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...current.battingCard].sort((a, b) => (a.batPosition ?? 0) - (b.batPosition ?? 0)).map((b) => (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3"><span className="text-white font-medium">{b.player.name}</span></td>
                  <td className="px-4 py-3 text-muted text-xs">{getDismissalText(b)}</td>
                  <td className="px-4 py-3 text-right text-white font-semibold">{b.runs}</td>
                  <td className="px-4 py-3 text-right text-muted">{b.balls}</td>
                  <td className="px-4 py-3 text-right text-muted">{b.fours}</td>
                  <td className="px-4 py-3 text-right text-muted">{b.sixes}</td>
                  <td className="px-4 py-3 text-right text-accent">{b.strikeRate.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div variants={rowVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Bowling</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {["Bowler", "O", "M", "R", "W", "Econ", "WD", "NB"].map((h) => (
                  <th key={h} className={cn("px-4 py-3 text-xs text-muted font-medium", h === "Bowler" ? "text-left" : "text-right")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...current.bowlingCard].sort((a, b) => b.wickets - a.wickets).map((b) => (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3"><span className="text-white font-medium">{b.player.name}</span></td>
                  <td className="px-4 py-3 text-right text-muted">{formatStoredOvers(b.overs)}</td>
                  <td className="px-4 py-3 text-right text-muted">{b.maidens}</td>
                  <td className="px-4 py-3 text-right text-white">{b.runs}</td>
                  <td className="px-4 py-3 text-right text-danger font-semibold">{b.wickets}</td>
                  <td className="px-4 py-3 text-right text-accent">{b.economy.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-muted">{b.wides}</td>
                  <td className="px-4 py-3 text-right text-muted">{b.noBalls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        <motion.div variants={rowVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Fall of Wickets</h3>
          <div className="space-y-3">
            {(current.fallOfWickets ?? []).length === 0 ? (
              <p className="text-sm text-muted">No wickets fallen yet</p>
            ) : (
              (current.fallOfWickets ?? []).map((fow) => (
                <div key={fow.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center text-xs text-danger font-bold">
                    {fow.wicketNumber}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{fow.batterName || "Batsman"}</p>
                    <p className="text-xs text-muted">Score: {fow.runs}/{fow.wicketNumber} &middot; Over: {formatStoredOvers(fow.overs)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div variants={rowVariants} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Extras</h3>
          <div className="space-y-3">
            {extrasBreakdown.map((e) => (
              <div key={e.type} className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-sm text-muted">{e.type}</span>
                <span className="text-sm text-white font-semibold">{e.count}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-white font-medium">Total Extras</span>
              <span className="text-sm text-accent font-bold">{totalExtras}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
