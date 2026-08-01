"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn, formatOvers } from "@/lib/utils";
import type { InningsDetail, MatchDetail } from "@/hooks/useMatchLive";

interface CompactScorePillProps {
  visible: boolean;
  match: MatchDetail;
  currentInnings: InningsDetail | null;
  legalBalls: number;
  isPaused: boolean;
}

/**
 * Minimal floating score bar shown only while the main scoreboard is scrolled
 * out of view. Keeps the essential LIVE / team / score / overs visible without
 * stealing vertical space from the batter/bowler cards or scoring controls.
 */
export function CompactScorePill({
  visible,
  match,
  currentInnings,
  legalBalls,
  isPaused,
}: CompactScorePillProps) {
  const battingTeamId = currentInnings?.battingTeam ?? match.homeTeamId;
  const battingTeam =
    battingTeamId === match.homeTeamId ? match.homeTeam : match.awayTeam;
  const shortName = battingTeam.shortName ?? battingTeam.name.slice(0, 4).toUpperCase();
  const runs = currentInnings?.totalRuns ?? 0;
  const wickets = currentInnings?.totalWickets ?? 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="compact-score"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f1a]/95 backdrop-blur"
        >
          <div className="mx-auto flex h-11 max-w-6xl items-center gap-2 px-3 md:px-4">
            <span
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                isPaused
                  ? "bg-warning/15 text-warning"
                  : "bg-success/15 text-success"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full animate-pulse",
                  isPaused ? "bg-warning" : "bg-success"
                )}
              />
              {isPaused ? "Paused" : "Live"}
            </span>
            <span className="truncate text-sm font-bold text-white">
              {shortName}
            </span>
            <span className="ml-auto text-lg font-extrabold tabular-nums text-white">
              {runs}/{wickets}
            </span>
            <span className="shrink-0 text-xs font-medium tabular-nums text-muted">
              {formatOvers(legalBalls)} ov
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
