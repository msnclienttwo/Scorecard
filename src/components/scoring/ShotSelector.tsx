"use client";

import { cn } from "@/lib/utils";
import { SHOTS, type ShotType } from "@/lib/advancedScoring";

interface ShotSelectorProps {
  selected: ShotType | null;
  onSelect: (shot: ShotType | null) => void;
}

export function ShotSelector({ selected, onSelect }: ShotSelectorProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Shot type
        </h4>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-[11px] text-muted hover:text-white"
          >
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {SHOTS.map((shot) => {
          const active = selected === shot.code;
          return (
            <button
              key={shot.code}
              type="button"
              title={shot.hint}
              onClick={() => onSelect(active ? null : shot.code)}
              className={cn(
                "rounded-lg border px-1 py-1.5 text-[11px] font-semibold transition-colors",
                active
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/10"
              )}
            >
              {shot.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
