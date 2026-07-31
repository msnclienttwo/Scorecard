"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Trophy,
  Users,
  MapPin,
  Calendar,
  ArrowLeft,
  Share2,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { MatchCard } from "@/components/match/MatchCard";
import { cn } from "@/lib/utils";
import Link from "next/link";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function TeamPage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const { data: team, isLoading } = useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}`);
      if (!res.ok) throw new Error("Team not found");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!team) {
    return (
      <EmptyState
        icon={Trophy}
        title="Team Not Found"
        description="This team profile could not be loaded."
        actionLabel="Back to Teams"
        onAction={() => window.history.back()}
      />
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <Link
          href="/teams"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teams
        </Link>
      </motion.div>

      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-2xl border border-white/10 p-8"
        style={{
          background: `linear-gradient(135deg, ${team.primaryColor || "#2563EB"}20, #0a0f1a, ${team.secondaryColor || "#00D4FF"}20)`,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(37,99,235,0.1),transparent_50%)]" />
        <div className="relative flex flex-col md:flex-row items-start gap-6">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${team.primaryColor || "#2563EB"}, ${team.secondaryColor || "#00D4FF"})`,
            }}
          >
            {team.logo ? (
              <img
                src={team.logo}
                alt={team.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              team.shortName || team.name?.substring(0, 3)
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{team.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm">
              {team.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {team.city}
                </span>
              )}
              {team.country && <span>{team.country}</span>}
              {team.founded && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Est. {team.founded}
                </span>
              )}
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Matches", value: team.totalMatches || 0, icon: Trophy },
          { label: "Wins", value: team.wins || 0, icon: TrendingUp },
          { label: "Losses", value: team.losses || 0, icon: Target },
          { label: "Players", value: team.players?.length || 0, icon: Users },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <stat.icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-white/50 mt-1">{stat.label}</div>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Squad</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {team.players?.map((player: any) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {player.image ? (
                    <img
                      src={player.image}
                      alt={player.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    player.name?.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                    {player.name}
                  </div>
                  <div className="text-xs text-white/50 flex items-center gap-2">
                    {player.role && <span>{player.role}</span>}
                    {player.isCaptain && (
                      <Badge variant="accent" className="text-[10px] px-1.5 py-0">
                        C
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {(!team.players || team.players.length === 0) && (
            <div className="text-center text-white/30 py-8">
              No players in squad yet
            </div>
          )}
        </Card>
      </motion.div>

      {team.recentMatches && team.recentMatches.length > 0 && (
        <motion.div variants={item}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Recent Matches
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.recentMatches.map((match: any) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {team.description && (
        <motion.div variants={item}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-3">About</h3>
            <p className="text-white/60 leading-relaxed">{team.description}</p>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
