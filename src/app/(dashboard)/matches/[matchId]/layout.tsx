"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart3,
  CircleDot,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Swords,
  Table,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Match, Team, Innings } from "@/types";

interface MatchWithDetails extends Match {
  homeTeam: Pick<Team, "id" | "name" | "shortName" | "logo">;
  awayTeam: Pick<Team, "id" | "name" | "shortName" | "logo">;
  innings: (Innings & {
    battingCard: { playerId: string; runs: number; balls: number }[];
    overs: { overNumber: number; totalRuns: number; ballsCount: number }[];
  })[];
}

const TABS = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "Scorecard", href: "scorecard", icon: Table },
  { label: "Ball-by-Ball", href: "ball-by-ball", icon: CircleDot },
  { label: "Commentary", href: "commentary", icon: MessageSquare },
  { label: "Statistics", href: "statistics", icon: BarChart3 },
  { label: "Scoring", href: "live", icon: TrendingUp },
];

export default function MatchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  const pathname = usePathname();

  // Shares the ["match", matchId] query used by the Overview page (and the
  // live pages via useMatchLive), so navigating into a match issues a single
  // network request instead of the previous duplicate fetch.
  const { data, isLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}`);
      if (!res.ok) throw new Error("Match not found");
      return res.json() as Promise<{ match: MatchWithDetails }>;
    },
  });
  const match = data?.match;

  const currentTab =
    TABS.find((tab) => {
      const href = tab.href
        ? `/matches/${matchId}/${tab.href}`
        : `/matches/${matchId}`;
      return pathname === href;
    })?.href ?? "";

  const isLive = match?.status === "LIVE";
  const isCompleted = match?.status === "COMPLETED";
  const currentInnings =
    isLive && match && match.innings.length > 0
      ? match.innings[match.innings.length - 1]
      : null;

  return (
    <div className="min-h-screen">
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted mb-1">Home</p>
                <p className="text-lg font-bold text-white">
                  {isLoading ? "---" : match?.homeTeam.shortName ?? "TBA"}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold gradient-text">vs</span>
                {isLive && (
                  <span className="text-[10px] text-accent font-medium">
                    LIVE
                  </span>
                )}
                {isCompleted && (
                  <span className="text-[10px] text-success font-medium">
                    COMPLETED
                  </span>
                )}
                {!isLive && !isCompleted && !isLoading && (
                  <span className="text-[10px] text-muted font-medium">
                    {match?.status ?? ""}
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs text-muted mb-1">Away</p>
                <p className="text-lg font-bold text-white">
                  {isLoading ? "---" : match?.awayTeam.shortName ?? "TBA"}
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4 text-sm">
              {currentInnings && (
                <>
                  <div className="text-center px-3 py-1 bg-white/5 rounded-lg">
                    <p className="text-xs text-muted">Score</p>
                    <p className="text-white font-bold">
                      {currentInnings.totalRuns}/{currentInnings.totalWickets}
                    </p>
                  </div>
                  <div className="text-center px-3 py-1 bg-white/5 rounded-lg">
                    <p className="text-xs text-muted">Overs</p>
                    <p className="text-white font-bold">
                      {currentInnings.totalOvers}
                    </p>
                  </div>
                </>
              )}
              {!isLoading && !currentInnings && (
                <div className="text-center px-3 py-1 bg-white/5 rounded-lg">
                  <p className="text-xs text-muted">Format</p>
                  <p className="text-white font-bold">
                    {match?.totalOvers ?? ""} overs
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto no-scrollbar gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.href === currentTab;
              const href = tab.href
                ? `/matches/${matchId}/${tab.href}`
                : `/matches/${matchId}`;
              return (
                <Link key={tab.href} href={href}>
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                      isActive ? "text-white" : "text-muted hover:text-white/70"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
