"use client";

import { useState, use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

const TABS = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "Scorecard", href: "scorecard", icon: Table },
  { label: "Ball-by-Ball", href: "ball-by-ball", icon: CircleDot },
  { label: "Commentary", href: "commentary", icon: MessageSquare },
  { label: "Statistics", href: "statistics", icon: BarChart3 },
  { label: "Scoring", href: "score", icon: TrendingUp },
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

  const currentTab = TABS.find((tab) => {
    const href = tab.href
      ? `/matches/${matchId}/${tab.href}`
      : `/matches/${matchId}`;
    return pathname === href;
  })?.href ?? "";

  return (
    <div className="min-h-screen">
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted mb-1">Team A</p>
                <p className="text-lg font-bold text-white">MI</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold gradient-text">vs</span>
                <span className="text-[10px] text-accent font-medium">
                  LIVE
                </span>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted mb-1">Team B</p>
                <p className="text-lg font-bold text-white">CSK</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="text-center px-3 py-1 bg-white/5 rounded-lg">
                <p className="text-xs text-muted">Score</p>
                <p className="text-white font-bold">156/4</p>
              </div>
              <div className="text-center px-3 py-1 bg-white/5 rounded-lg">
                <p className="text-xs text-muted">Overs</p>
                <p className="text-white font-bold">15.3</p>
              </div>
              <div className="text-center px-3 py-1 bg-white/5 rounded-lg">
                <p className="text-xs text-muted">CRR</p>
                <p className="text-accent font-bold">10.06</p>
              </div>
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
