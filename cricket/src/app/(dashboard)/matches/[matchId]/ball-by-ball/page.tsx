"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Ball {
  id: number;
  over: number;
  ball: number;
  runs: number;
  extras: string | null;
  isWicket: boolean;
  batsman: string;
  bowler: string;
  description: string;
}

const allBalls: Ball[] = [
  { id: 1, over: 0, ball: 1, runs: 1, extras: null, isWicket: false, batsman: "Rohit Sharma", bowler: "Bumrah", description: "Rohit Sharma drives to mid-off, takes a quick single" },
  { id: 2, over: 0, ball: 2, runs: 0, extras: null, isWicket: false, batsman: "Ishan Kishan", bowler: "Bumrah", description: "Good length outside off, left alone" },
  { id: 3, over: 0, ball: 3, runs: 4, extras: null, isWicket: false, batsman: "Ishan Kishan", bowler: "Bumrah", description: "FOUR! Short and pulled over mid-wicket" },
  { id: 4, over: 0, ball: 4, runs: 2, extras: null, isWicket: false, batsman: "Ishan Kishan", bowler: "Bumrah", description: "Flicked off the pads for two runs" },
  { id: 5, over: 0, ball: 5, runs: 0, extras: null, isWicket: false, batsman: "Ishan Kishan", bowler: "Bumrah", description: "Full delivery, defended solidly" },
  { id: 6, over: 0, ball: 6, runs: 1, extras: null, isWicket: false, batsman: "Ishan Kishan", bowler: "Bumrah", description: "Pushed to covers for a single" },
  { id: 7, over: 1, ball: 1, runs: 6, extras: null, isWicket: false, batsman: "Rohit Sharma", bowler: "Chahar", description: "SIX! Massive hit over long-on!" },
  { id: 8, over: 1, ball: 2, runs: 1, extras: null, isWicket: false, batsman: "Rohit Sharma", bowler: "Chahar", description: "Dabbed to third man for one" },
  { id: 9, over: 1, ball: 3, runs: 0, extras: null, isWicket: true, batsman: "Rohit Sharma", bowler: "Chahar", description: "WICKET! Caught behind! Rohit goes for 48" },
  { id: 10, over: 1, ball: 4, runs: 2, extras: null, isWicket: false, batsman: "Suryakumar Yadav", bowler: "Chahar", description: "Inside edge past the stumps for two" },
  { id: 11, over: 1, ball: 5, runs: 4, extras: null, isWicket: false, batsman: "Suryakumar Yadav", bowler: "Chahar", description: "FOUR! Cover drive, pristine timing" },
  { id: 12, over: 1, ball: 5, runs: 0, extras: "wd", isWicket: false, batsman: "Suryakumar Yadav", bowler: "Chahar", description: "Wide ball down the leg side" },
  { id: 13, over: 1, ball: 6, runs: 1, extras: null, isWicket: false, batsman: "Suryakumar Yadav", bowler: "Chahar", description: "Worked to leg side for a single" },
  { id: 14, over: 2, ball: 1, runs: 0, extras: null, isWicket: false, batsman: "Tilak Varma", bowler: "Jadeja", description: "Defended back to the bowler" },
  { id: 15, over: 2, ball: 2, runs: 3, extras: null, isWicket: false, batsman: "Tilak Varma", bowler: "Jadeja", description: "Thick outside edge, races to third man" },
  { id: 16, over: 2, ball: 3, runs: 1, extras: null, isWicket: false, batsman: "Suryakumar Yadav", bowler: "Jadeja", description: "Turned to mid-wicket for one" },
  { id: 17, over: 2, ball: 4, runs: 6, extras: null, isWicket: false, batsman: "Suryakumar Yadav", bowler: "Jadeja", description: "SIX! Sky pulls it over cow corner!" },
  { id: 18, over: 2, ball: 5, runs: 1, extras: null, isWicket: false, batsman: "Suryakumar Yadav", bowler: "Jadeja", description: "Quick single, good running" },
  { id: 19, over: 2, ball: 6, runs: 0, extras: null, isWicket: false, batsman: "Tilak Varma", bowler: "Jadeja", description: "Dot ball, defended solidly on off stump" },
];

function getBallChipColor(ball: Ball): string {
  if (ball.isWicket) return "bg-danger text-white";
  if (ball.extras === "wd") return "bg-warning text-black";
  if (ball.extras === "nb") return "bg-orange-500 text-white";
  if (ball.runs === 6) return "bg-accent text-black";
  if (ball.runs === 4) return "bg-primary text-white";
  if (ball.runs === 0) return "bg-white/10 text-muted";
  return "bg-success/20 text-success";
}

export default function BallByBallPage() {
  const [hoveredBall, setHoveredBall] = useState<number | null>(null);

  const overs = Array.from(new Set(allBalls.map((b) => b.over)));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-1">Ball-by-Ball</h2>
        <p className="text-sm text-muted">
          MI 187/6 (20 overs) &middot; CSK 156/4 (15.3 overs)
        </p>
      </div>

      <div className="space-y-4">
        {overs.map((overNum) => {
          const overBalls = allBalls.filter((b) => b.over === overNum);
          const overRuns = overBalls.reduce(
            (sum, b) => sum + b.runs + (b.extras === "wd" || b.extras === "nb" ? 1 : 0),
            0
          );
          const overWickets = overBalls.filter((b) => b.isWicket).length;
          return (
            <motion.div
              key={overNum}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: overNum * 0.05 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-white">
                    Over {overNum + 1}
                  </span>
                  <span className="text-sm text-accent font-medium">
                    {overRuns} runs
                  </span>
                  {overWickets > 0 && (
                    <span className="text-sm text-danger font-medium">
                      {overWickets} wkt
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted">
                  {overBalls[0]?.bowler}
                </span>
              </div>

              <div className="flex gap-2 flex-wrap mb-3">
                {overBalls.map((ball) => (
                  <div key={ball.id} className="relative">
                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      onMouseEnter={() => setHoveredBall(ball.id)}
                      onMouseLeave={() => setHoveredBall(null)}
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold cursor-default transition-all",
                        getBallChipColor(ball)
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
                    {hoveredBall === ball.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-3 w-64 z-50"
                      >
                        <p className="text-xs text-white font-medium mb-1">
                          {ball.batsman} vs {ball.bowler}
                        </p>
                        <p className="text-xs text-muted">{ball.description}</p>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                {overBalls.map((ball) => (
                  <p
                    key={ball.id}
                    className="text-xs text-muted/70 leading-relaxed"
                  >
                    <span className="text-white/50 font-mono">
                      {overNum + 1}.{ball.ball}
                    </span>{" "}
                    {ball.description}
                  </p>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
