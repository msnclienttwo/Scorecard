"use client";

import { formatStoredOvers } from "@/lib/utils";
import type { FallOfWicketRef } from "@/hooks/useMatchLive";

interface PartnershipPanelProps {
  runs: number;
  balls: number;
  fallOfWickets: FallOfWicketRef[];
}

export function PartnershipPanel({
  runs,
  balls,
  fallOfWickets,
}: PartnershipPanelProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
        Partnership
      </h3>
      <p className="mt-1 text-lg font-bold tabular-nums text-white">
        {runs}{" "}
        <span className="text-xs font-normal text-muted">({balls} balls)</span>
      </p>
      {fallOfWickets.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-white/10 pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Fall of wickets
          </p>
          {fallOfWickets.map((f) => (
            <div key={f.id} className="flex justify-between text-xs">
              <span className="truncate text-white">{f.batterName}</span>
              <span className="shrink-0 tabular-nums text-muted">
                {f.runs}/{f.wicketNumber} · {formatStoredOvers(f.overs)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
