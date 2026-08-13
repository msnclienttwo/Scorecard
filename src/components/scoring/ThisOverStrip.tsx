"use client";

import { cn } from "@/lib/utils";
import type { BallRef, OverRef } from "@/hooks/useMatchLive";
import { formatBallSummary, getBallColor, getBallDisplay } from "./scoreUtils";
import { shotLabel, zoneLabel } from "@/lib/advancedScoring";

interface ThisOverStripProps {
  over: OverRef | null;
  lastBall: BallRef | null;
  onBallClick?: (ballId: string) => void;
  selectedBallId?: string | null;
}

export function ThisOverStrip({
  over,
  lastBall,
  onBallClick,
  selectedBallId,
}: ThisOverStripProps) {
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
        {balls.map((b) => {
          const selected = b.id === selectedBallId;
          const clickable = !!onBallClick;
          const ball = (
            <>
              {getBallDisplay(b)}
              {selected && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0d1320] bg-accent" />
              )}
            </>
          );
          return (
            <span
              key={b.id}
              title={[
                shotLabel(b.shotType),
                zoneLabel(b.placementZone),
                onBallClick ? "Click to link commentary" : null,
              ]
                .filter(Boolean)
                .join(" · ") || undefined}
              onClick={clickable ? () => onBallClick(b.id) : undefined}
              className={cn(
                "relative flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                getBallColor(b),
                clickable && "cursor-pointer transition-transform hover:scale-110"
              )}
            >
              {ball}
            </span>
          );
        })}
      </div>
    </section>
  );
}
