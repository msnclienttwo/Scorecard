"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Undo2,
  RefreshCw,
  ArrowLeftRight,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { cn, formatOvers } from "@/lib/utils";

interface BallEvent {
  id: number;
  runs: number;
  extras: string | null;
  isWicket: boolean;
  over: number;
  ball: number;
}

const initialBalls: BallEvent[] = [
  { id: 1, runs: 1, extras: null, isWicket: false, over: 0, ball: 1 },
  { id: 2, runs: 0, extras: null, isWicket: false, over: 0, ball: 2 },
  { id: 3, runs: 4, extras: null, isWicket: false, over: 0, ball: 3 },
  { id: 4, runs: 2, extras: null, isWicket: false, over: 0, ball: 4 },
  { id: 5, runs: 0, extras: null, isWicket: false, over: 0, ball: 5 },
  { id: 6, runs: 1, extras: null, isWicket: false, over: 0, ball: 6 },
  { id: 7, runs: 6, extras: null, isWicket: false, over: 1, ball: 1 },
  { id: 8, runs: 1, extras: null, isWicket: false, over: 1, ball: 2 },
  { id: 9, runs: 0, extras: null, isWicket: true, over: 1, ball: 3 },
  { id: 10, runs: 2, extras: null, isWicket: false, over: 1, ball: 4 },
  { id: 11, runs: 4, extras: null, isWicket: false, over: 1, ball: 5 },
  { id: 12, runs: 0, extras: "wd", isWicket: false, over: 1, ball: 5 },
  { id: 13, runs: 1, extras: null, isWicket: false, over: 1, ball: 6 },
  { id: 14, runs: 0, extras: null, isWicket: false, over: 2, ball: 1 },
  { id: 15, runs: 3, extras: null, isWicket: false, over: 2, ball: 2 },
];

function getBallColor(ball: BallEvent): string {
  if (ball.isWicket) return "bg-danger text-white";
  if (ball.extras === "wd") return "bg-warning text-black";
  if (ball.extras === "nb") return "bg-orange-500 text-white";
  if (ball.runs === 6) return "bg-accent text-black";
  if (ball.runs === 4) return "bg-primary text-white";
  if (ball.runs === 0) return "bg-white/10 text-muted";
  return "bg-success/20 text-success";
}

export default function LiveScoringPage() {
  const [balls, setBalls] = useState<BallEvent[]>(initialBalls);
  const [currentOver, setCurrentOver] = useState(2);
  const [currentBall, setCurrentBall] = useState(3);
  const [totalRuns, setTotalRuns] = useState(28);
  const [wickets, setWickets] = useState(1);
  const [batsman1] = useState({
    name: "Rohit Sharma",
    runs: 18,
    balls: 12,
    onStrike: true,
  });
  const [batsman2] = useState({
    name: "Virat Kohli",
    runs: 8,
    balls: 7,
    onStrike: false,
  });
  const [bowler] = useState({
    name: "Jasprit Bumrah",
    overs: 1.3,
    runs: 12,
    wickets: 1,
  });
  const [partnership] = useState({ runs: 14, balls: 10 });

  const addBall = useCallback(
    (runs: number, extras?: string, isWicket?: boolean) => {
      const newBall: BallEvent = {
        id: balls.length + 1,
        runs,
        extras: extras || null,
        isWicket: isWicket || false,
        over: currentOver,
        ball: currentBall,
      };

      setBalls((prev) => [...prev, newBall]);
      setTotalRuns((prev) => prev + runs + (extras === "wd" || extras === "nb" ? 1 : 0));

      if (isWicket) {
        setWickets((prev) => prev + 1);
      }

      if (currentBall >= 6) {
        setCurrentOver((prev) => prev + 1);
        setCurrentBall(1);
      } else {
        setCurrentBall((prev) => prev + 1);
      }
    },
    [balls, currentOver, currentBall]
  );

  const undoLastBall = useCallback(() => {
    if (balls.length === 0) return;
    const lastBall = balls[balls.length - 1];
    setBalls((prev) => prev.slice(0, -1));
    setTotalRuns((prev) => prev - lastBall.runs - (lastBall.extras === "wd" || lastBall.extras === "nb" ? 1 : 0));
    if (lastBall.isWicket) setWickets((prev) => prev - 1);
    if (lastBall.ball === 1 && lastBall.over > 0) {
      setCurrentOver((prev) => prev - 1);
      setCurrentBall(6);
    } else {
      setCurrentBall((prev) => prev - 1);
    }
  }, [balls]);

  return (
    <div className="space-y-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-success bg-success/15 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              LIVE
            </span>
            <span className="text-sm text-muted">
              IPL 2025 &middot; Match 45
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={undoLastBall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-muted hover:text-white transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </motion.button>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative">
          <p className="text-sm text-muted mb-1">
            MI vs CSK &middot; 1st Innings
          </p>
          <motion.p
            key={totalRuns}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-7xl font-bold gradient-text leading-none my-4"
          >
            {totalRuns}/{wickets}
          </motion.p>
          <p className="text-lg text-white/70">
            <span className="text-muted">Overs:</span>{" "}
            <span className="text-white font-semibold">
              {formatOvers(currentOver * 6 + currentBall)}
            </span>{" "}
            <span className="text-muted">/ 20</span>
          </p>
          <div className="flex items-center justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-xs text-muted">CRR</p>
              <p className="text-accent font-bold">
                {(
                  totalRuns /
                  Math.max((currentOver * 6 + currentBall) / 6, 0.1)
                ).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted">Partnership</p>
              <p className="text-white font-bold">
                {partnership.runs}({partnership.balls})
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={cn(
            "bg-white/5 backdrop-blur-xl border rounded-2xl p-4",
            batsman1.onStrike
              ? "border-accent/50 glow-accent"
              : "border-white/10"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">Batsman 1</span>
            {batsman1.onStrike && (
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            )}
          </div>
          <p className="text-white font-semibold">{batsman1.name}</p>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-2xl font-bold text-white">{batsman1.runs}</p>
            <p className="text-sm text-muted">({batsman1.balls} balls)</p>
            <p className="text-sm text-accent font-medium">
              SR {((batsman1.runs / batsman1.balls) * 100).toFixed(1)}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "bg-white/5 backdrop-blur-xl border rounded-2xl p-4",
            batsman2.onStrike
              ? "border-accent/50 glow-accent"
              : "border-white/10"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">Batsman 2</span>
            {batsman2.onStrike && (
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            )}
          </div>
          <p className="text-white font-semibold">{batsman2.name}</p>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-2xl font-bold text-white">{batsman2.runs}</p>
            <p className="text-sm text-muted">({batsman2.balls} balls)</p>
            <p className="text-sm text-accent font-medium">
              SR {((batsman2.runs / batsman2.balls) * 100).toFixed(1)}
            </p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">Bowler</span>
          </div>
          <p className="text-white font-semibold">{bowler.name}</p>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-sm text-white">
              <span className="text-muted">O:</span> {formatOvers(bowler.overs * 6)}
            </p>
            <p className="text-sm text-white">
              <span className="text-muted">R:</span> {bowler.runs}
            </p>
            <p className="text-sm text-white">
              <span className="text-muted">W:</span> {bowler.wickets}
            </p>
            <p className="text-sm text-accent font-medium">
              Econ: {bowler.overs > 0 ? (bowler.runs / bowler.overs).toFixed(1) : "0.0"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <h3 className="text-xs font-medium text-muted mb-3">
          This Over
        </h3>
        <div className="flex gap-2 flex-wrap">
          <AnimatePresence>
            {balls
              .filter(
                (b) =>
                  b.over === currentOver ||
                  (b.over === currentOver - 1 && b.ball === 6)
              )
              .map((ball) => (
                <motion.div
                  key={ball.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                    getBallColor(ball)
                  )}
                >
                  {ball.isWicket
                    ? "W"
                    : ball.extras === "wd"
                    ? "WD"
                    : ball.extras === "nb"
                    ? "NB"
                    : ball.runs}
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <h3 className="text-xs font-medium text-muted mb-3">Score</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "0", runs: 0, className: "bg-white/5 text-muted hover:bg-white/10" },
            { label: "1", runs: 1, className: "bg-success/10 text-success hover:bg-success/20" },
            { label: "2", runs: 2, className: "bg-success/15 text-success hover:bg-success/25" },
            { label: "3", runs: 3, className: "bg-success/20 text-success hover:bg-success/30" },
            {
              label: "4",
              runs: 4,
              className: "bg-primary/20 text-primary hover:bg-primary/30 shadow-[0_0_20px_rgba(37,99,235,0.15)]",
            },
            {
              label: "6",
              runs: 6,
              className: "bg-accent/20 text-accent hover:bg-accent/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]",
            },
          ].map((btn) => (
            <motion.button
              key={btn.label}
              whileTap={{ scale: 0.9 }}
              onClick={() => addBall(btn.runs)}
              className={cn(
                "py-4 rounded-xl text-xl font-bold transition-all",
                btn.className
              )}
            >
              {btn.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <h3 className="text-xs font-medium text-muted mb-3">Extras & Wicket</h3>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => addBall(0, "wd")}
            className="py-3 rounded-xl bg-warning/10 text-warning text-sm font-medium hover:bg-warning/20 transition-all"
          >
            Wide
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => addBall(0, "nb")}
            className="py-3 rounded-xl bg-orange-500/10 text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-all"
          >
            No Ball
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => addBall(0)}
            className="py-3 rounded-xl bg-white/5 text-muted text-sm font-medium hover:bg-white/10 transition-all"
          >
            Bye
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => addBall(0)}
            className="py-3 rounded-xl bg-white/5 text-muted text-sm font-medium hover:bg-white/10 transition-all"
          >
            Leg Bye
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => addBall(0, undefined, true)}
            className="py-3 rounded-xl bg-danger/15 text-danger text-sm font-medium hover:bg-danger/25 transition-all col-span-2 md:col-span-1"
          >
            WICKET
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="py-3 rounded-xl bg-white/5 text-muted text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-1"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            End Over
          </motion.button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
        <h3 className="text-xs font-medium text-muted mb-3">
          Quick Actions
        </h3>
        <div className="flex gap-3 flex-wrap">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted hover:text-white transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Change Batsman
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Change Bowler
          </motion.button>
        </div>
      </div>
    </div>
  );
}
