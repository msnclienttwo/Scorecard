"use client";

import { cn } from "@/lib/utils";
import {
  FIELD_POSITIONS,
  FIELD_PRESETS,
} from "@/lib/advancedScoring";

interface FieldSettingsProps {
  positions: string[];
  onChange: (positions: string[]) => void;
}

export function FieldSettings({ positions, onChange }: FieldSettingsProps) {
  const positionSet = new Set(positions);

  const toggle = (code: string) => {
    const next = positionSet.has(code)
      ? positions.filter((p) => p !== code)
      : [...positions, code];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="mb-1 flex flex-wrap gap-1.5">
        {FIELD_PRESETS.map((preset) => {
          const active =
            preset.positions.length > 0 &&
            preset.positions.length === positions.length &&
            preset.positions.every((p) => positionSet.has(p));
          return (
            <button
              key={preset.code}
              type="button"
              onClick={() => onChange(preset.positions)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                active
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10"
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <div className="grid max-h-40 grid-cols-3 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-4">
        {FIELD_POSITIONS.map((pos) => {
          const active = positionSet.has(pos.code);
          return (
            <button
              key={pos.code}
              type="button"
              onClick={() => toggle(pos.code)}
              className={cn(
                "rounded-lg border px-1 py-1.5 text-[10px] font-medium transition-colors",
                active
                  ? "border-success/50 bg-success/15 text-success"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/10"
              )}
            >
              {pos.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
