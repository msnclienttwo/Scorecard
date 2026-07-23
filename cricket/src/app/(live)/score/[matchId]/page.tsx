"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Copy,
  MessageCircle,
  Twitter,
  RefreshCw,
  Wifi,
} from "lucide-react";
import { cn, formatOvers } from "@/lib/utils";

interface BallEvent {
  id: number;
  runs: number;
  extras: string | null;
  isWicket: boolean;
}

const recentBalls: BallEvent[] = [
  { id: 1, runs: 1, extras: null, isWicket: false },
  { id: 2, runs: 6, extras: null, isWicket: false },
  { id: 3, runs: 0, extras: null, isWicket: false },
  { id: 4, runs: 4, extras: null, isWicket: false },
  { id: 5, runs: 2, extras: null, isWicket: false },
  { id: 6, runs: 1, extras: null, isWicket: false },
  { id: 7, runs: 0, extras: "wd", isWicket: false },
  { id: 8, runs: 0, extras: null, isWicket: true },
  { id: 9, runs: 1, extras: null, isWicket: false },
  { id: 10, runs: 4, extras: null, isWicket: false },
  { id: 11, runs: 0, extras: null, isWicket: false },
  { id: 12, runs: 2, extras: null, isWicket: false },
  { id: 13, runs: 6, extras: null, isWicket: false },
  { id: 14, runs: 1, extras: null, isWicket: false },
  { id: 15, runs: 0, extras: null, isWicket: false },
];

function getBallColor(runs: number, extras: string | null, isWicket: boolean): string {
  if (isWicket) return "bg-danger text-white";
  if (extras === "wd") return "bg-warning text-black";
  if (extras === "nb") return "bg-orange-500 text-white";
  if (runs === 6) return "bg-accent text-black";
  if (runs === 4) return "bg-primary text-white";
  if (runs === 0) return "bg-white/10 text-muted";
  return "bg-success/20 text-success";
}

export default function PublicLiveScorePage() {
  const [copied, setCopied] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold gradient-text">ScoreCast</span>
            <span className="text-[10px] text-success bg-success/15 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setLastRefresh(new Date())}
              className="p-2 rounded-lg bg-white/5 text-muted hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
            <span className="text-[10px] text-muted hidden sm:block">
              Auto-refresh: 30s
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <div className="relative">
              <p className="text-sm text-muted mb-6">IPL 2025 &middot; Match 45</p>

              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 flex items-center justify-center text-3xl md:text-4xl font-bold text-white mb-3 mx-auto">
                    MI
                  </div>
                  <p className="text-xs md:text-sm text-white font-medium">
                    Mumbai Indians
                  </p>
                </div>

                <div className="text-center">
                  <motion.p
                    key={Math.random()}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    className="text-7xl md:text-8xl font-bold gradient-text leading-none"
                  >
                    156/4
                  </motion.p>
                  <p className="text-lg md:text-xl text-white/60 mt-2">
                    <span className="text-muted">Overs:</span>{" "}
                    <span className="text-white font-semibold">15.3</span>
                    <span className="text-muted"> / 20</span>
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 flex items-center justify-center text-3xl md:text-4xl font-bold text-white mb-3 mx-auto">
                    CSK
                  </div>
                  <p className="text-xs md:text-sm text-white font-medium">
                    Chennai Super Kings
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-8 md:gap-12">
                <div className="text-center">
                  <p className="text-xs text-muted mb-0.5">CRR</p>
                  <p className="text-lg md:text-xl font-bold text-accent">
                    10.06
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted mb-0.5">RRR</p>
                  <p className="text-lg md:text-xl font-bold text-warning">
                    8.72
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted mb-0.5">Target</p>
                  <p className="text-lg md:text-xl font-bold text-white">
                    175
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
          >
            <p className="text-xs text-muted mb-3 text-center">
              Recent Balls
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <AnimatePresence>
                {recentBalls.map((ball, i) => (
                  <motion.div
                    key={ball.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={cn(
                      "w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-xs md:text-sm font-bold",
                      getBallColor(ball.runs, ball.extras, ball.isWicket)
                    )}
                  >
                    {ball.isWicket
                      ? "W"
                      : ball.extras === "wd"
                      ? "WD"
                      : ball.runs}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted mb-1">Batsman</p>
                <p className="text-sm text-white font-medium">
                  Rohit Sharma *
                </p>
                <p className="text-xs text-accent">48(32) SR 150.00</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted mb-1">Bowler</p>
                <p className="text-sm text-white font-medium">
                  J. Bumrah
                </p>
                <p className="text-xs text-danger">4-0-34-2</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={copyLink}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                copied
                  ? "bg-success/20 text-success border border-success/30"
                  : "bg-white/5 border border-white/10 text-muted hover:text-white"
              )}
            >
              {copied ? (
                <>
                  <Wifi className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(
                    `Check the live score: ${window.location.href}`
                  )}`,
                  "_blank"
                )
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-medium hover:bg-success/20 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Live Cricket Score: ${window.location.href}`
                  )}`,
                  "_blank"
                )
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-all"
            >
              <Twitter className="w-4 h-4" />
              Twitter
            </motion.button>
          </motion.div>
        </div>
      </main>

      <footer className="text-center py-4 border-t border-white/5">
        <p className="text-[10px] text-muted/50">
          Powered by ScoreCast &middot; Auto-refreshes every 30 seconds
        </p>
      </footer>
    </div>
  );
}
