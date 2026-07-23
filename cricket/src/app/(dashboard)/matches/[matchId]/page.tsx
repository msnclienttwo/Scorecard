"use client";

import { motion } from "framer-motion";
import {
  Cloud,
  MapPin,
  Trophy,
  Users,
  Wind,
  Zap,
  Timer,
  TrendingUp,
  CircleDot,
  MessageSquare,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const officials = [
  { role: "Umpire", name: "K. Dharmasena" },
  { role: "Umpire", name: "M. Erasmus" },
  { role: "Third Umpire", name: "P. Reiffel" },
  { role: "Match Referee", name: "R. Ramaswamy" },
];

const quickActions = [
  {
    label: "Live Scoring",
    href: "score",
    icon: Zap,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    label: "Full Scorecard",
    href: "scorecard",
    icon: Activity,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Ball-by-Ball",
    href: "ball-by-ball",
    icon: CircleDot,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    label: "Commentary",
    href: "commentary",
    icon: MessageSquare,
    color: "text-warning",
    bg: "bg-warning/10",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function MatchOverviewPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div
        variants={itemVariants}
        className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success bg-success/15 px-3 py-1 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            LIVE
          </span>
          <div className="flex items-center gap-8 mb-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold text-white mb-2">
                MI
              </div>
              <p className="text-sm text-muted">Mumbai Indians</p>
            </div>
            <div className="text-center">
              <p className="text-6xl font-bold gradient-text leading-none mb-1">
                156/4
              </p>
              <p className="text-lg text-white/70">
                <span className="text-muted">Overs:</span>{" "}
                <span className="text-white font-semibold">15.3</span>
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold text-white mb-2">
                CSK
              </div>
              <p className="text-sm text-muted">Chennai Super Kings</p>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-2">
            <div className="text-center">
              <p className="text-xs text-muted">CRR</p>
              <p className="text-accent font-bold">10.06</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted">RRR</p>
              <p className="text-warning font-bold">8.72</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted">Target</p>
              <p className="text-white font-bold">175</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h3 className="text-sm font-medium text-muted mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={`/matches/1/${action.href}`}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center cursor-pointer transition-colors hover:bg-white/8"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2",
                      action.bg
                    )}
                  >
                    <Icon className={cn("w-5 h-5", action.color)} />
                  </div>
                  <p className="text-sm text-white font-medium">
                    {action.label}
                  </p>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-5 h-5 text-warning" />
            <h3 className="text-sm font-medium text-white">Toss</h3>
          </div>
          <p className="text-white font-semibold">
            Mumbai Indians won the toss
          </p>
          <p className="text-sm text-muted mt-1">Elected to bat first</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-medium text-white">Venue</h3>
          </div>
          <p className="text-white font-semibold">Wankhede Stadium</p>
          <p className="text-sm text-muted mt-1">Mumbai, Maharashtra</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <Cloud className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-medium text-white">Weather</h3>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-white font-semibold">28°C</p>
              <p className="text-sm text-muted">Humidity 72%</p>
            </div>
            <Wind className="w-4 h-4 text-white/30" />
            <div>
              <p className="text-sm text-white">Partly Cloudy</p>
              <p className="text-sm text-muted">Wind: 12 km/h</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <Timer className="w-5 h-5 text-danger" />
            <h3 className="text-sm font-medium text-white">Pitch Report</h3>
          </div>
          <p className="text-sm text-white">
            Flat track with good pace and bounce. Expecting high scores. Spin
            may come into play in the second innings.
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:col-span-2"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-success" />
            <h3 className="text-sm font-medium text-white">Officials</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {officials.map((o) => (
              <div key={o.name} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs text-muted font-medium">
                  {o.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-xs text-muted">{o.role}</p>
                  <p className="text-sm text-white">{o.name}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
