"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  Trophy,
  Users,
  Target,
  Zap,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const overviewStats = [
  { label: "Total Runs Scored", value: "48,562", change: "+12.3%", icon: TrendingUp, color: "from-primary to-primary-light" },
  { label: "Wickets Taken", value: "2,847", change: "+8.7%", icon: Target, color: "from-accent to-accent-light" },
  { label: "Matches Played", value: "1,284", change: "+15.2%", icon: Trophy, color: "from-success to-accent" },
  { label: "Active Players", value: "3,847", change: "+5.4%", icon: Users, color: "from-warning to-danger" },
];

const topPerformers = [
  { name: "Virat Kohli", stat: "8,004 runs", team: "RCB" },
  { name: "Jasprit Bumrah", stat: "145 wickets", team: "MI" },
  { name: "Ravindra Jadeja", stat: "2,502 runs, 132 wkts", team: "CSK" },
  { name: "Jos Buttler", stat: "2,831 runs", team: "RR" },
];

const barData = [
  { label: "Jan", value: 65 },
  { label: "Feb", value: 45 },
  { label: "Mar", value: 80 },
  { label: "Apr", value: 90 },
  { label: "May", value: 70 },
  { label: "Jun", value: 55 },
  { label: "Jul", value: 85 },
];

const timeline = [
  { time: "2 hours ago", event: "MI vs CSK match completed", type: "match" },
  { time: "4 hours ago", event: "RCB vs KKR went live", type: "live" },
  { time: "6 hours ago", event: "New player registered: Arjun Patel", type: "player" },
  { time: "1 day ago", event: "IPL 2026 tournament completed", type: "tournament" },
  { time: "2 days ago", event: "DC vs RR match completed", type: "match" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AnalyticsPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted">Track your performance and insights</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br", stat.color)}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-success">{stat.change}</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div variants={item} className="glass-card rounded-2xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Match Activity</h2>
            <span className="text-xs text-muted">Last 7 months</span>
          </div>
          <div className="flex items-end gap-3 h-48">
            {barData.map((bar) => (
              <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full flex justify-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${bar.value}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-primary to-accent opacity-80"
                  />
                </div>
                <span className="text-[10px] text-muted">{bar.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card rounded-2xl p-5">
          <h2 className="mb-4 font-semibold text-foreground">Top Performers</h2>
          <div className="space-y-3">
            {topPerformers.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 rounded-xl bg-white/[0.02] p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted">{p.team}</p>
                </div>
                <span className="text-xs font-semibold text-accent">{p.stat}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div variants={item} className="glass-card rounded-2xl p-5">
        <h2 className="mb-4 font-semibold text-foreground">Activity Timeline</h2>
        <div className="space-y-4">
          {timeline.map((event, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="relative mt-1">
                <div className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  event.type === "live" ? "bg-success" : event.type === "match" ? "bg-primary" : event.type === "player" ? "bg-accent" : "bg-warning"
                )} />
                {i < timeline.length - 1 && <div className="absolute left-1/2 top-3 -translate-x-1/2 h-6 w-px bg-white/10" />}
              </div>
              <div>
                <p className="text-sm text-foreground">{event.event}</p>
                <p className="text-xs text-muted">{event.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
