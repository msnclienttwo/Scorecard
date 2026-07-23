"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Trophy,
  Radio,
  Users,
  UserPlus,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  {
    label: "Total Matches",
    value: "1,284",
    change: "+12.5%",
    trend: "up" as const,
    icon: Trophy,
    color: "from-primary to-primary-light",
  },
  {
    label: "Live Now",
    value: "8",
    change: "+3",
    trend: "up" as const,
    icon: Radio,
    color: "from-success to-accent",
  },
  {
    label: "Teams",
    value: "256",
    change: "+8.2%",
    trend: "up" as const,
    icon: Users,
    color: "from-accent to-accent-light",
  },
  {
    label: "Players",
    value: "3,847",
    change: "-2.1%",
    trend: "down" as const,
    icon: UserPlus,
    color: "from-warning to-danger",
  },
];

const liveMatches = [
  { id: "1", team1: "Mumbai Indians", team2: "Chennai Super Kings", score1: "145/3", score2: "89/4", overs: "12.4", venue: "Wankhede Stadium" },
  { id: "2", team1: "RCB", team2: "KKR", score1: "178/5", score2: "67/1", overs: "8.2", venue: "M. Chinnaswamy" },
  { id: "3", team1: "Delhi Capitals", team2: "Rajasthan Royals", score1: "112/2", score2: "", overs: "15.0", venue: "Arun Jaitley" },
];

const recentMatches = [
  { id: "1", date: "Jul 22, 2026", team1: "MI", team2: "CSK", result: "MI won by 5 wickets", status: "completed" },
  { id: "2", date: "Jul 21, 2026", team1: "RCB", team2: "DC", result: "RCB won by 12 runs", status: "completed" },
  { id: "3", date: "Jul 20, 2026", team1: "KKR", team2: "SRH", result: "KKR won by 3 wickets", status: "completed" },
  { id: "4", date: "Jul 19, 2026", team1: "PBKS", team2: "GT", result: "GT won by 6 wickets", status: "completed" },
  { id: "5", date: "Jul 18, 2026", team1: "CSK", team2: "RR", result: "CSK won by 8 runs", status: "completed" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, <span className="gradient-text">John</span>
        </h1>
        <p className="text-muted">Here&apos;s what&apos;s happening with your matches today</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card group rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br", stat.color)}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div className={cn("flex items-center gap-1 text-xs font-semibold", stat.trend === "up" ? "text-success" : "text-danger")}>
                {stat.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Live Matches</h2>
          <Link href="/matches" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-light transition-colors">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {liveMatches.map((match) => (
            <div key={match.id} className="glass-card min-w-[320px] flex-shrink-0 rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  LIVE
                </span>
                <span className="text-xs text-muted">{match.overs} overs</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{match.team1}</span>
                  <span className="text-sm font-bold text-foreground">{match.score1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{match.team2}</span>
                  <span className="text-sm font-bold text-foreground">{match.score2 || "Yet to bat"}</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted">{match.venue}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Matches</h2>
          <Link href="/matches" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-light transition-colors">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Teams</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Result</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentMatches.map((match) => (
                  <tr key={match.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-muted">{match.date}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-foreground">{match.team1} vs {match.team2}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-foreground/80">{match.result}</td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/matches/create"
            className="glass-card group flex items-center gap-4 rounded-2xl p-5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <PlusCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Create Match</p>
              <p className="text-xs text-muted">Start a new match</p>
            </div>
          </Link>
          <Link
            href="/teams"
            className="glass-card group flex items-center gap-4 rounded-2xl p-5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/20">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Add Team</p>
              <p className="text-xs text-muted">Register a new team</p>
            </div>
          </Link>
          <Link
            href="/players"
            className="glass-card group flex items-center gap-4 rounded-2xl p-5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 transition-colors group-hover:bg-success/20">
              <UserPlus className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Add Player</p>
              <p className="text-xs text-muted">Register a new player</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
