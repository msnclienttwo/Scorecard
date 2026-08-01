"use client";

import { cn } from "@/lib/utils";
import type { PlacementZone } from "@/lib/advancedScoring";

/**
 * Compact 3x3 scoring-region grid. Cells mirror the visual field: top row is
 * behind square, middle is square of the wicket, bottom is in front; off side
 * is the left column, leg side the right. The centre cell is the pitch.
 */
const GRID: { zone: PlacementZone | null; label: string; runs: string }[][] = [
  [
    { zone: "THIRD_MAN", label: "Third man", runs: "1-2" },
    { zone: "STRAIGHT", label: "Straight", runs: "1-4" },
    { zone: "FINE_LEG", label: "Fine leg", runs: "1-2" },
  ],
  [
    { zone: "POINT", label: "Point", runs: "1-2" },
    { zone: null, label: "Pitch", runs: "" },
    { zone: "SQUARE_LEG", label: "Sq. leg", runs: "1-2" },
  ],
  [
    { zone: "COVER", label: "Cover", runs: "1-3" },
    { zone: "MID_ON", label: "Mid on", runs: "1-3" },
    { zone: "MIDWICKET", label: "Midwk", runs: "1-3" },
  ],
];

interface SectorFieldSelectorProps {
  selectedZone: PlacementZone | null;
  onSelect: (zone: PlacementZone) => void;
}

export function SectorFieldSelector({
  selectedZone,
  onSelect,
}: SectorFieldSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {GRID.flatMap((row, r) =>
        row.map((cell, c) => {
          const key = `${r}-${c}`;
          if (!cell.zone) {
            return (
              <div
                key={key}
                className="flex items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] py-2 text-[10px] uppercase tracking-wider text-muted/60"
              >
                Pitch
              </div>
            );
          }
          const active = selectedZone === cell.zone;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(cell.zone as PlacementZone)}
              className={cn(
                "rounded-lg border px-1 py-2 text-center transition-colors",
                active
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-white/10 bg-white/[0.04] hover:bg-white/10"
              )}
            >
              <span className="block text-[11px] font-semibold leading-tight">
                {cell.label}
              </span>
              <span className="mt-0.5 block text-[9px] tabular-nums text-muted">
                {cell.runs} runs
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
