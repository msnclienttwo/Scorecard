"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  User,
  Trophy,
  Target,
  TrendingUp,
  Award,
  Calendar,
  MapPin,
  ArrowLeft,
  Share2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlayerStats } from "@/components/player/PlayerStats";
import { RecentForm } from "@/components/player/RecentForm";
import { DynamicBarChart, DynamicPieChart } from "@/components/ui/DynamicCharts";
import Link from "next/link";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = params.playerId as string;

  const { data: player, isLoading } = useQuery({
    queryKey: ["player", playerId],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}`);
      if (!res.ok) throw new Error("Player not found");
      return res.json();
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!player) {
    return (
      <EmptyState
        icon={User}
        title="Player Not Found"
        description="This player profile could not be loaded."
        actionLabel="Back to Players"
        onAction={() => window.history.back()}
      />
    );
  }

  const runsPerMatch = player.battingStats?.slice(-10).map((s: any, i: number) => ({
    match: `M${i + 1}`,
    runs: s.runs,
  })) || [];

  const boundaryData = [
    { name: "Fours", value: player.fours || 0, color: "#2563EB" },
    { name: "Sixes", value: player.sixes || 0, color: "#00D4FF" },
    { name: "Others", value: (player.totalRuns || 0) - (player.fours || 0) * 4 - (player.sixes || 0) * 6, color: "#ffffff20" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <Link
          href="/players"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Players
        </Link>
      </motion.div>

      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 via-[#0a0f1a] to-cyan-500/20 border border-white/10 p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(37,99,235,0.15),transparent_50%)]" />
        <div className="relative flex flex-col md:flex-row items-start gap-6">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-4xl font-bold text-white flex-shrink-0">
            {player.image ? (
              <Image src={player.image} alt={player.name} width={112} height={112} className="w-full h-full rounded-full object-cover" />
            ) : (
              player.name?.charAt(0)
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{player.name}</h1>
              {player.isCaptain && <Badge variant="accent">Captain</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm">
              {player.team && (
                <span className="flex items-center gap-1"><Trophy className="w-4 h-4" />{player.team.name}</span>
              )}
              {player.nationality && (
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{player.nationality}</span>
              )}
              {player.dateOfBirth && (
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(player.dateOfBirth).toLocaleDateString()}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {player.battingStyle && <Badge>{player.battingStyle}</Badge>}
              {player.bowlingStyle && <Badge>{player.bowlingStyle}</Badge>}
              {player.role && <Badge variant="info">{player.role}</Badge>}
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <PlayerStats
          stats={[
            { label: "Matches", value: player.matchesPlayed || 0, icon: Calendar },
            { label: "Runs", value: player.totalRuns || 0, icon: TrendingUp },
            { label: "Average", value: player.average?.toFixed(1) || "0.0", icon: Target },
            { label: "Strike Rate", value: player.strikeRate?.toFixed(1) || "0.0", icon: TrendingUp },
            { label: "Wickets", value: player.wickets || 0, icon: Award },
            { label: "Economy", value: player.economy?.toFixed(1) || "0.0", icon: Target },
          ]}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Runs Per Match</h3>
            {runsPerMatch.length > 0 ? (
              <DynamicBarChart data={runsPerMatch} dataKey="runs" />
            ) : (
              <div className="flex items-center justify-center h-[250px] text-white/30">No batting data available</div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Boundary Distribution</h3>
            {player.totalRuns > 0 ? (
              <DynamicPieChart data={boundaryData} />
            ) : (
              <div className="flex items-center justify-center h-[250px] text-white/30">No data available</div>
            )}
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Form</h3>
          <RecentForm matches={player.recentMatches || []} />
        </Card>
      </motion.div>

      {player.bio && (
        <motion.div variants={item}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-3">About</h3>
            <p className="text-white/60 leading-relaxed">{player.bio}</p>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
