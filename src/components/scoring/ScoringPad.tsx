"use client";

import { cn } from "@/lib/utils";
import type { ExtraKind } from "@/hooks/useLiveScoring";

interface ScoringPadProps {
  submitting: boolean;
  onRuns: (runs: number) => void;
  onWicket: () => void;
  onExtras: (kind: ExtraKind) => void;
}

const RUN_BUTTONS = [0, 1, 2, 3, 4, 5, 6] as const;

const runButtonClass = (r: number): string => {
  if (r === 0)
    return "bg-white/[0.06] border-white/10 text-white hover:bg-white/10";
  if (r === 4) return "bg-primary/20 border-primary/40 text-primary hover:bg-primary/30";
  if (r === 6) return "bg-accent/20 border-accent/40 text-accent hover:bg-accent/30";
  return "bg-success/15 border-success/30 text-success hover:bg-success/25";
};

const EXTRAS: { kind: ExtraKind; label: string }[] = [
  { kind: "WIDE", label: "WD" },
  { kind: "NO_BALL", label: "NB" },
  { kind: "BYE", label: "B" },
  { kind: "LEG_BYE", label: "LB" },
];

export function ScoringPad({
  submitting,
  onRuns,
  onWicket,
  onExtras,
}: ScoringPadProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {RUN_BUTTONS.map((r) => (
          <button
            key={r}
            type="button"
            disabled={submitting}
            onClick={() => onRuns(r)}
            className={cn(
              "h-14 select-none rounded-xl border text-2xl font-extrabold tabular-nums transition-colors active:scale-95 disabled:pointer-events-none disabled:opacity-50",
              runButtonClass(r)
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={submitting}
        onClick={onWicket}
        className="h-12 w-full select-none rounded-xl border border-danger/40 bg-danger/15 text-base font-bold uppercase tracking-wide text-danger transition-colors hover:bg-danger/25 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
      >
        Wicket
      </button>
      <div className="grid grid-cols-4 gap-2">
        {EXTRAS.map(({ kind, label }) => (
          <button
            key={kind}
            type="button"
            disabled={submitting}
            onClick={() => onExtras(kind)}
            className="h-11 select-none rounded-xl border border-white/10 bg-white/[0.06] text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/10 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
