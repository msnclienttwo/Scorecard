"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import LiveIndicator from "./LiveIndicator";

interface Match {
  id: string;
  name?: string;
  status: string;
  scheduledAt?: string;
  venue?: string;
  homeTeam?: { name: string; shortName: string };
  awayTeam?: { name: string; shortName: string };
  innings?: { battingTeam: string; totalRuns: number; totalWickets: number; totalOvers: number }[];
  result?: string;
}

interface MatchCardProps {
  match: Match;
}

function getStatusVariant(status: string): "danger" | "info" | "success" {
  switch (status) {
    case "LIVE":
      return "danger";
    case "COMPLETED":
      return "success";
    default:
      return "info";
  }
}

function getTeamScore(innings: any[], teamId: string) {
  const inn = innings?.find((i) => i.battingTeam === teamId);
  if (!inn) return null;
  return `${inn.totalRuns}/${inn.totalWickets} (${inn.totalOvers})`;
}

export default function MatchCard({ match }: MatchCardProps) {
  const isLive = match.status === "LIVE";
  const isCompleted = match.status === "COMPLETED";

  return (
    <Link href={`/matches/${match.id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 cursor-pointer overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            {isLive ? (
              <LiveIndicator />
            ) : (
              <Badge variant={getStatusVariant(match.status)}>
                {match.status}
              </Badge>
            )}
            <div className="flex items-center gap-1 text-xs text-white/40">
              <Calendar size={12} />
              {match.scheduledAt
                ? new Date(match.scheduledAt).toLocaleDateString()
                : "TBD"}
            </div>
          </div>

          {match.name && (
            <div className="text-xs text-white/40 mb-3 truncate">
              {match.name}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {match.homeTeam?.shortName?.substring(0, 3) || "HOME"}
                </div>
                <span className="text-sm font-medium text-white">
                  {match.homeTeam?.name || "Home Team"}
                </span>
              </div>
              {getTeamScore(match.innings || [], match.homeTeam?.name || "") && (
                <span className="text-lg font-bold text-white">
                  {getTeamScore(match.innings || [], match.homeTeam?.name || "")}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-yellow-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {match.awayTeam?.shortName?.substring(0, 3) || "AWAY"}
                </div>
                <span className="text-sm font-medium text-white/60">
                  {match.awayTeam?.name || "Away Team"}
                </span>
              </div>
              {getTeamScore(match.innings || [], match.awayTeam?.name || "") && (
                <span className="text-lg font-bold text-white/60">
                  {getTeamScore(match.innings || [], match.awayTeam?.name || "")}
                </span>
              )}
            </div>
          </div>

          {isCompleted && match.result && (
            <div className="mt-3 text-xs text-green-400/80 truncate">
              {match.result}
            </div>
          )}

          {match.venue && (
            <div className="mt-3 flex items-center gap-1 text-xs text-white/30">
              <MapPin size={12} />
              {match.venue}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export { MatchCard };
