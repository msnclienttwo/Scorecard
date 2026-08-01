"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, cubicBezier } from "framer-motion";
import {
  Check,
  Coins,
  RotateCw,
  SlidersHorizontal,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type CoinSide = "heads" | "tails";
type TossDecision = "bat" | "bowl";

interface CoinTossProps {
  teamA: string;
  teamB: string;
  teamAName: string;
  teamBName: string;
  tossWinner?: string;
  tossDecision?: TossDecision;
  onAccept: (tossWinner: string, tossDecision: TossDecision) => void;
  onUseManual: () => void;
  onSkip: () => void;
}

const FLIP_ROTATIONS = 10;
const FLIP_DURATION = 2.4;
const FLIP_EASE = cubicBezier(0.16, 1, 0.3, 1);

const FRONT_BG =
  "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9), rgba(255,255,255,0) 44%), linear-gradient(150deg, #FFF6CE 0%, #F9CE4F 24%, #E9A63E 46%, #C87C1B 72%, #8A4E08 100%)";
const BACK_BG =
  "radial-gradient(circle at 68% 74%, rgba(255,255,255,0.9), rgba(255,255,255,0) 44%), linear-gradient(150deg, #EAF0FB 0%, #BFCDE6 24%, #8BA0C6 46%, #56678F 72%, #2E3A55 100%)";

const COIN_SHADOW =
  "inset 0 3px 8px rgba(255,255,255,0.7), inset 0 -8px 16px rgba(0,0,0,0.35), 0 14px 34px rgba(0,0,0,0.45)";

export default function CoinToss({
  teamA,
  teamB,
  teamAName,
  teamBName,
  tossWinner,
  tossDecision,
  onAccept,
  onUseManual,
  onSkip,
}: CoinTossProps) {
  const [phase, setPhase] = useState<"idle" | "flipping" | "result">("idle");
  const [side, setSide] = useState<CoinSide | null>(null);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string>(tossWinner ?? "");
  const [decision, setDecision] = useState<TossDecision | null>(
    tossDecision ?? null
  );
  const [accepted, setAccepted] = useState(Boolean(tossWinner));

  useEffect(() => {
    if (winner && winner !== teamA && winner !== teamB) {
      setWinner("");
    }
  }, [teamA, teamB, winner]);

  const handleFlip = () => {
    if (phase === "flipping") return;
    const next: CoinSide = Math.random() < 0.5 ? "heads" : "tails";
    setSide(next);
    setPhase("flipping");
    setRotation(
      (prev) => prev + FLIP_ROTATIONS * 360 + (next === "tails" ? 180 : 0)
    );
  };

  const handleFlipAgain = () => {
    setAccepted(false);
    handleFlip();
  };

  const handleAccept = () => {
    if (!winner || !decision) return;
    onAccept(winner, decision);
    setAccepted(true);
  };

  const coinWrapperAnimate = useMemo(() => {
    if (phase === "flipping") {
      return {
        y: [0, -120, -35, 0] as number[],
        scale: [1, 1.12, 1.02, 1] as number[],
      };
    }
    if (phase === "result") {
      return { y: [0, -24, 0, -10, 0] as number[] };
    }
    return { y: 0, scale: 1 };
  }, [phase]);

  const coinWrapperTransition = useMemo(() => {
    if (phase === "flipping") {
      return {
        duration: FLIP_DURATION,
        times: [0, 0.35, 0.7, 1],
        ease: "easeInOut" as const,
      };
    }
    if (phase === "result") {
      return {
        duration: 0.75,
        times: [0, 0.2, 0.5, 0.8, 1],
        ease: "easeOut" as const,
      };
    }
    return { duration: 0.3 };
  }, [phase]);

  const shadowAnimate = useMemo(
    () =>
      phase === "flipping"
        ? { scale: 0.65, opacity: 0.3 }
        : { scale: 1, opacity: 0.6 },
    [phase]
  );

  const shadowTransition = {
    duration: phase === "flipping" ? FLIP_DURATION : 0.4,
    ease: "easeOut" as const,
  };

  const canAccept = Boolean(winner) && Boolean(decision);
  const resultLabel = side === "heads" ? "Heads" : "Tails";

  const renderCoin = () => (
    <div className="relative pt-6 pb-10">
      <motion.div
        animate={coinWrapperAnimate}
        transition={coinWrapperTransition}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="relative" style={{ perspective: 1200 }}>
          <motion.div
            className="relative w-36 h-36 md:w-44 md:h-44 mx-auto"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: rotation }}
            transition={{ duration: FLIP_DURATION, ease: FLIP_EASE }}
            onAnimationComplete={() => {
              if (phase === "flipping") setPhase("result");
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: FRONT_BG,
                backfaceVisibility: "hidden",
                transform: "translateZ(4px)",
                boxShadow: COIN_SHADOW,
              }}
            >
              <div className="absolute inset-[7%] rounded-full border-2 border-white/50 flex items-center justify-center">
                <span
                  className="font-black text-lg md:text-xl tracking-[0.35em] pl-[0.35em] text-center text-amber-950"
                  style={{ textShadow: "0 1px 2px rgba(255,255,255,0.4)" }}
                >
                  HEADS
                </span>
              </div>
            </div>
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: BACK_BG,
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg) translateZ(4px)",
                boxShadow: COIN_SHADOW,
              }}
            >
              <div className="absolute inset-[7%] rounded-full border-2 border-white/40 flex items-center justify-center">
                <span
                  className="font-black text-lg md:text-xl tracking-[0.35em] pl-[0.35em] text-center text-slate-900"
                  style={{ textShadow: "0 1px 2px rgba(255,255,255,0.4)" }}
                >
                  TAILS
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      <motion.div
        animate={shadowAnimate}
        transition={shadowTransition}
        className="absolute left-0 right-0 mx-auto -bottom-0.5 w-32 h-4 md:w-36 rounded-full bg-black/50 blur-lg"
      />
    </div>
  );

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-white">Toss</h3>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted bg-white/5 border border-white/10 rounded-full px-3 py-1">
          Optional
        </span>
      </div>

      {renderCoin()}

      <div className="flex items-center justify-center gap-3 mb-5">
        <span
          className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
            side === "heads"
              ? "bg-amber-400/20 border-amber-400/50 text-amber-300"
              : "bg-white/5 border-white/10 text-muted"
          )}
        >
          Heads
        </span>
        <span className="text-muted/50 text-xs">vs</span>
        <span
          className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
            side === "tails"
              ? "bg-cyan-400/20 border-cyan-400/50 text-cyan-300"
              : "bg-white/5 border-white/10 text-muted"
          )}
        >
          Tails
        </span>
      </div>

      <div className="min-h-16 text-center">
        <AnimatePresence mode="wait">
          {accepted ? (
            <motion.div
              key="accepted"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/15 border border-success/40 text-success">
                <Check className="w-4 h-4" />
                Toss recorded
              </div>
              <p className="text-lg font-semibold text-white">
                {winner === teamA ? teamAName : teamBName}
                <span className="text-muted font-normal"> will </span>
                {decision === "bat" ? "Bat First" : "Bowl First"}
              </p>
              <p className="text-sm text-muted">
                {resultLabel} won the toss
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button variant="outline" onClick={handleFlipAgain}>
                  <RotateCw className="w-4 h-4" />
                  Flip Again
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted">
                {phase === "flipping"
                  ? "Flipping the coin..."
                  : side
                  ? `${resultLabel} won. Choose which team called it:`
                  : "Waiting... tap Flip Coin to start."}
              </p>

              {!side && (
                <Button onClick={handleFlip} disabled={phase === "flipping"}>
                  <Trophy className="w-4 h-4" />
                  Flip Coin
                </Button>
              )}

              {side && phase === "result" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                    {[teamA, teamB].map((id, i) => {
                      const name = i === 0 ? teamAName : teamBName;
                      const isSelected = winner === id;
                      return (
                        <motion.button
                          key={id}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setWinner(id)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                            isSelected
                              ? "bg-primary/20 border-primary text-white"
                              : "bg-white/5 border-white/10 text-muted hover:bg-white/10"
                          )}
                        >
                          <span
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                              isSelected
                                ? "border-primary bg-primary"
                                : "border-white/25"
                            )}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </span>
                          {name}
                        </motion.button>
                      );
                    })}
                  </div>

                  {winner && (
                    <div className="flex gap-3 max-w-md mx-auto">
                      {(["bat", "bowl"] as const).map((d) => (
                        <motion.button
                          key={d}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setDecision(d)}
                          className={cn(
                            "flex-1 py-3 rounded-xl border text-sm font-medium transition-all capitalize",
                            decision === d
                              ? "bg-primary/20 border-primary text-white"
                              : "bg-white/5 border-white/10 text-muted hover:bg-white/10"
                          )}
                        >
                          {d === "bat" ? "Bat First" : "Bowl First"}
                        </motion.button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Button onClick={handleAccept} disabled={!canAccept}>
                      <Trophy className="w-4 h-4" />
                      Accept Toss
                    </Button>
                    <Button variant="outline" onClick={handleFlip}>
                      <RotateCw className="w-4 h-4" />
                      Flip Again
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 pt-4 mt-5 border-t border-white/5">
        <Button variant="ghost" size="sm" onClick={onUseManual}>
          <SlidersHorizontal className="w-4 h-4" />
          Use Manual Selection
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip Toss
        </Button>
      </div>
    </div>
  );
}
