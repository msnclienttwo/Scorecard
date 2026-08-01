"use client";

import type { BowlingCardRef, PlayerRef } from "@/hooks/useMatchLive";
import { formatStoredOvers } from "@/lib/utils";
import { initials } from "./scoreUtils";

interface BowlerCardProps {
  bowler: PlayerRef | null;
  card?: BowlingCardRef;
}

export function BowlerCard({ bowler, card }: BowlerCardProps) {
  if (!bowler) {
    return (
      <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-3">
        <p className="text-xs text-muted">Waiting for bowler…</p>
      </section>
    );
  }

  const overs = formatStoredOvers(card?.overs ?? 0);
  const maidens = card?.maidens ?? 0;
  const runs = card?.runs ?? 0;
  const wickets = card?.wickets ?? 0;
  const economy = card?.economy ?? 0;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-xs font-bold text-white">
          {initials(bowler.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {bowler.name}
          </p>
          <p className="text-[11px] text-muted">Bowling</p>
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-1 text-center">
        <div>
          <p className="text-sm font-bold tabular-nums text-white">{overs}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted">O</p>
        </div>
        <div>
          <p className="text-sm font-bold tabular-nums text-white">{runs}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted">R</p>
        </div>
        <div>
          <p className="text-sm font-bold tabular-nums text-white">{wickets}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted">W</p>
        </div>
        <div>
          <p className="text-sm font-bold tabular-nums text-white">
            {economy.toFixed(1)}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted">
            Econ{maidens > 0 ? ` · ${maidens}M` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
