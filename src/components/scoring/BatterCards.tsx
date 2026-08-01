"use client";

import { cn } from "@/lib/utils";
import type { BattingCardRef, PlayerRef } from "@/hooks/useMatchLive";
import { initials } from "./scoreUtils";

function BatterCard({
  batter,
  card,
  onStrike,
}: {
  batter: PlayerRef | null;
  card?: BattingCardRef;
  onStrike?: boolean;
}) {
  if (!batter) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-3">
        <p className="text-xs text-muted">Waiting for batter…</p>
      </div>
    );
  }
  const runs = card?.runs ?? 0;
  const balls = card?.balls ?? 0;
  const fours = card?.fours ?? 0;
  const sixes = card?.sixes ?? 0;
  const sr = balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";

  return (
    <div
      className={cn(
        "relative rounded-2xl border p-3",
        onStrike
          ? "border-accent/40 bg-accent/[0.07]"
          : "border-white/10 bg-white/[0.04]"
      )}
    >
      {onStrike && (
        <span className="absolute -top-2 left-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
          On strike
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
          {initials(batter.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {batter.name}
          </p>
          <p className="text-[11px] text-muted">
            {balls} balls · {fours}×4 {sixes}×6
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-2xl font-extrabold tabular-nums text-white">{runs}</p>
        <p className="text-[11px] text-muted">SR {sr}</p>
      </div>
    </div>
  );
}

interface BatterCardsProps {
  striker: PlayerRef | null;
  nonStriker: PlayerRef | null;
  strikerCard?: BattingCardRef;
  nonStrikerCard?: BattingCardRef;
}

export function BatterCards({
  striker,
  nonStriker,
  strikerCard,
  nonStrikerCard,
}: BatterCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <BatterCard batter={striker} card={strikerCard} onStrike />
      <BatterCard batter={nonStriker} card={nonStrikerCard} />
    </div>
  );
}
