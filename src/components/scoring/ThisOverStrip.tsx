"use client";

import { cn } from "@/lib/utils";
import type { BallRef, OverRef } from "@/hooks/useMatchLive";
import { formatBallSummary, getBallColor, getBallDisplay } from "./scoreUtils";
import { shotLabel, zoneLabel } from "@/lib/advancedScoring";

interface ThisOverStripProps {
  over: OverRef | null;
  lastBall: BallRef | null;
}

export function ThisOverStrip({ over, lastBall }: ThisOverStripProps) {
  const balls = over?.balls ?? [];
  const overNumber = over?.overNumber;
  const lastBallNote =
    lastBall && (lastBall.shotType || lastBall.placementZone)
      ? ` · ${[shotLabel(lastBall.shotType), zoneLabel(lastBall.placementZone)]
          .filter(Boolean)
          .join(" to ")}${lastBall.isOverthrow ? " + overthrow" : ""}`
      : "";

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
          This Over{overNumber ? ` · Over ${overNumber}` : ""}
        </h3>
        {lastBall && (
          <span className="truncate text-[11px] text-muted">
            Last ball: {formatBallSummary(lastBall)}
            {lastBallNote}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {balls.length === 0 && (
          <p className="text-xs text-muted">No balls bowled yet.</p>
        )}
        {balls.map((b) => (
          <span
            key={b.id}
            title={[shotLabel(b.shotType), zoneLabel(b.placementZone)]
              .filter(Boolean)
              .join(" · ") || undefined}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
              getBallColor(b)
            )}
          >
            {getBallDisplay(b)}
          </span>
        ))}
      </div>
    </section>
  );
}
