"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Trophy,
  Users,
  Target,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCard {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AnalyticsPage() {
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [matchesRes, playersRes, teamsRes] = await Promise.all([
          fetch("/api/matches?status=COMPLETED&limit=1"),
          fetch("/api/players"),
          fetch("/api/teams"),
        ]);

        const matchesData = matchesRes.ok ? await matchesRes.json() : null;
        const playersData = playersRes.ok ? await playersRes.json() : null;
        const teamsData = teamsRes.ok ? await teamsRes.json() : null;

        const matchCount = matchesData?.total ?? matchesData?.matches?.length ?? 0;
        const playerCount = playersData?.total ?? playersData?.players?.length ?? 0;
        const teamCount = teamsData?.total ?? teamsData?.teams?.length ?? 0;

        setHasData(matchCount > 0);

        if (matchCount > 0) {
          setStats([
            { label: "Matches Played", value: matchCount.toLocaleString(), icon: Trophy, color: "from-success to-accent" },
            { label: "Active Players", value: playerCount.toLocaleString(), icon: Users, color: "from-warning to-danger" },
            { label: "Teams", value: teamCount.toLocaleString(), icon: Target, color: "from-primary to-primary-light" },
          ]);
        }
      } catch {
        setHasData(false);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted">Track your performance and insights</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card animate-pulse rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-xl bg-white/5" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-7 w-20 rounded bg-white/5" />
                <div className="h-4 w-28 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : !hasData ? (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5">
            <BarChart3 className="h-10 w-10 text-muted" />
          </div>
          <p className="mt-6 text-base font-medium text-foreground">No analytics data yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted">Analytics will appear after matches are scored.</p>
        </motion.div>
      ) : (
        <>
          <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br", stat.color)}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={item} className="glass-card rounded-2xl p-5">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <TrendingUp className="h-8 w-8 text-muted" />
              <p className="mt-3 text-sm font-medium text-foreground">Detailed analytics coming soon</p>
              <p className="text-xs text-muted">Charts and in-depth stats will be available in a future update.</p>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
