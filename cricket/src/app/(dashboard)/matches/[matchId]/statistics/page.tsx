"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, BarChart3, Target, Loader2 } from "lucide-react";
import type { Match, Innings, BowlingScorecard, BattingScorecard } from "@/types";

interface RunRatePoint {
  over: number;
  runRate: number;
}

interface ComputedStats {
  runRateData: RunRatePoint[];
  bowlingStats: (BowlingScorecard & { playerName: string })[];
  battingStats: (BattingScorecard & { playerName: string })[];
  latestInnings: Innings | null;
  totalFours: number;
  totalSixes: number;
  totalWickets: number;
  totalDots: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-sm">
      <p className="text-white font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function computeStats(match: Match & { innings: (Innings & { battingCard: (BattingScorecard & { player: { name: string } })[]; bowlingCard: (BowlingScorecard & { player: { name: string } })[]; overs: { totalRuns: number; totalWickets: number; ballsCount: number; overNumber: number }[] })[] }): ComputedStats {
  const inningsList = match.innings || [];

  const runRateData: RunRatePoint[] = [];
  const allBowlingStats: (BowlingScorecard & { playerName: string })[] = [];
  const allBattingStats: (BattingScorecard & { playerName: string })[] = [];
  let totalFours = 0;
  let totalSixes = 0;
  let totalWickets = 0;
  let totalDots = 0;

  for (const inn of inningsList) {
    const oversSorted = [...(inn.overs || [])].sort((a, b) => a.overNumber - b.overNumber);
    let cumulativeRuns = 0;
    let cumulativeBalls = 0;

    for (const ov of oversSorted) {
      cumulativeBalls += ov.ballsCount || 0;
      cumulativeRuns += ov.totalRuns || 0;
      const oversDecimal = cumulativeBalls / 6;
      if (oversDecimal > 0) {
        runRateData.push({
          over: ov.overNumber,
          runRate: Math.round((cumulativeRuns / oversDecimal) * 100) / 100,
        });
      }
    }

    for (const bs of inn.bowlingCard || []) {
      allBowlingStats.push({
        ...bs,
        playerName: bs.player.name,
      });
    }

    for (const bt of inn.battingCard || []) {
      allBattingStats.push({
        ...bt,
        playerName: bt.player.name,
      });
      totalFours += bt.fours || 0;
      totalSixes += bt.sixes || 0;
      totalDots += bt.balls - bt.runs - (bt.fours || 0) * 4 - (bt.sixes || 0) * 6;
    }

    totalWickets += inn.totalWickets || 0;
  }

  totalDots = Math.max(0, totalDots);

  return {
    runRateData,
    bowlingStats: allBowlingStats.sort((a, b) => b.wickets - a.wickets),
    battingStats: allBattingStats.sort((a, b) => b.runs - a.runs),
    latestInnings: inningsList.length > 0 ? inningsList[inningsList.length - 1] : null,
    totalFours,
    totalSixes,
    totalWickets,
    totalDots,
  };
}

function ComingSoonCard({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="flex items-center justify-center h-[250px] text-muted text-sm">
        Coming soon
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  const params = useParams();
  const matchId = params.matchId as string;

  const [match, setMatch] = useState<(Match & { innings: Innings[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;
    setLoading(true);
    fetch(`/api/matches/${matchId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch match");
        return res.json();
      })
      .then((data) => {
        setMatch(data.match);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-danger text-sm">{error}</p>
      </div>
    );
  }

  if (!match || !match.innings || match.innings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <BarChart3 className="w-12 h-12 text-muted/40 mb-4" />
        <p className="text-muted text-sm">
          No statistics available yet. Statistics will appear once the match has innings data.
        </p>
      </div>
    );
  }

  const stats = computeStats(match as Parameters<typeof computeStats>[0]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div
        variants={itemVariants}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-white">Run Rate</h3>
        </div>
        {stats.runRateData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.runRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="over" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="runRate"
                stroke="#00D4FF"
                strokeWidth={2}
                dot={{ fill: "#00D4FF", r: 3 }}
                name="CRR"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted text-sm">
            No over data available
          </div>
        )}
      </motion.div>

      <ComingSoonCard
        title="Partnerships"
        icon={<BarChart3 className="w-5 h-5 text-primary" />}
      />

      <ComingSoonCard
        title="Match Worm"
        icon={<TrendingUp className="w-5 h-5 text-success" />}
      />

      <ComingSoonCard
        title="Manhattan"
        icon={<BarChart3 className="w-5 h-5 text-warning" />}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <ComingSoonCard
          title="Run Distribution"
          icon={<BarChart3 className="w-5 h-5 text-accent" />}
        />
        <ComingSoonCard
          title="Wagon Wheel"
          icon={<Target className="w-5 h-5 text-danger" />}
        />
      </div>

      <motion.div
        variants={itemVariants}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Quick Stats</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.totalFours}</p>
            <p className="text-xs text-muted">Fours</p>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-accent">{stats.totalSixes}</p>
            <p className="text-xs text-muted">Sixes</p>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-danger">{stats.totalWickets}</p>
            <p className="text-xs text-muted">Wickets</p>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.totalDots}</p>
            <p className="text-xs text-muted">Dot Balls</p>
          </div>
        </div>
      </motion.div>

      {stats.battingStats.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-white mb-4">Top Batsmen</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.battingStats.slice(0, 8).map((b) => (
              <div
                key={b.id}
                className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center"
              >
                <p className="text-sm text-white font-medium mb-1">{b.playerName}</p>
                <p className="text-lg font-bold text-accent">
                  {b.runs}{" "}
                  <span className="text-xs text-muted font-normal">
                    ({b.balls}){b.isNotOut ? "*" : ""}
                  </span>
                </p>
                <p className="text-xs text-muted">
                  SR {b.strikeRate?.toFixed(1) || "0.0"} &middot; {b.fours}x4 {b.sixes}x6
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {stats.bowlingStats.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-white mb-4">Bowling Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.bowlingStats.map((b) => (
              <div
                key={b.id}
                className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center"
              >
                <p className="text-sm text-white font-medium mb-1">{b.playerName}</p>
                <p className="text-lg font-bold text-danger">{b.wickets}</p>
                <p className="text-xs text-muted">wickets</p>
                <div className="mt-2 pt-2 border-t border-white/5">
                  <p className="text-xs text-muted">
                    {b.runs} runs &middot; {b.dotBalls} dots
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
