"use client";

import { cn } from "@/lib/utils";
import {
  type BattingHand,
  type PlacementZone,
  zonesByRing,
  getZone,
} from "@/lib/advancedScoring";

const ZONE_SHORT: Record<string, string> = {
  THIRD_MAN: "3rd",
  DEEP_THIRD_MAN: "3rd",
  POINT: "Pt",
  DEEP_POINT: "Pt",
  COVER: "Cv",
  DEEP_COVER: "Cv",
  MID_OFF: "MO",
  LONG_OFF: "LO",
  STRAIGHT: "St",
  LONG_ON: "LOn",
  MID_ON: "MOn",
  MIDWICKET: "Mw",
  DEEP_MIDWICKET: "Mw",
  SQUARE_LEG: "SL",
  DEEP_SQUARE_LEG: "SL",
  FINE_LEG: "FL",
  DEEP_FINE_LEG: "FL",
};

interface CricketFieldProps {
  battingHand: BattingHand;
  selectedZone: PlacementZone | null;
  onSelect: (zone: PlacementZone) => void;
  className?: string;
}

export function CricketField({
  battingHand,
  selectedZone,
  onSelect,
  className,
}: CricketFieldProps) {
  const { boundary, inner } = zonesByRing(battingHand);
  const offLeft = battingHand === "RIGHT";

  return (
    <div className={cn("relative aspect-square w-full select-none", className)}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {/* outfield */}
        <ellipse cx="50" cy="50" rx="48" ry="48" fill="#1c5a3a" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
        <ellipse cx="50" cy="50" rx="41" ry="41" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
        {/* 30-yard circle */}
        <ellipse cx="50" cy="50" rx="26" ry="26" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.7" strokeDasharray="2 1.5" />
        {/* pitch */}
        <rect x="49.2" y="26" width="1.6" height="48" fill="#d9b873" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" />
        {/* stumps */}
        <g stroke="#f5f5f5" strokeWidth="0.9">
          <line x1="48.4" y1="27.5" x2="51.6" y2="27.5" />
          <line x1="48.4" y1="72.5" x2="51.6" y2="72.5" />
        </g>
        {/* batsman at the bottom, bowler at the top */}
        <circle cx="50" cy="79" r="1.6" fill="#fff" />
        <circle cx="50" cy="20" r="1.3" fill="rgba(255,255,255,0.8)" />
        {/* side labels (not mirrored with the field art) */}
        <text x={offLeft ? "8" : "92"} y="6" textAnchor={offLeft ? "start" : "end"} fill="rgba(255,255,255,0.45)" fontSize="3.4" fontWeight="700">
          OFF SIDE
        </text>
        <text x={offLeft ? "92" : "8"} y="6" textAnchor={offLeft ? "end" : "start"} fill="rgba(255,255,255,0.45)" fontSize="3.4" fontWeight="700">
          LEG SIDE
        </text>
      </svg>

      {[...boundary, ...inner].map(({ x, y, zone }) => {
        const active = selectedZone === zone.code;
        const boundaryZone = zone.ring === "BOUNDARY";
        return (
          <button
            key={zone.code}
            type="button"
            title={`${zone.label}${zone.ring === "BOUNDARY" ? " (boundary)" : ""}`}
            onClick={() => onSelect(zone.code)}
            style={{ left: `${x}%`, top: `${y}%` }}
            className={cn(
              "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 text-center font-bold transition-all",
              "flex h-8 w-8 items-center justify-center text-[9px] leading-none",
              boundaryZone ? "opacity-90" : "opacity-100",
              active
                ? "scale-110 border-accent bg-accent text-black shadow-[0_0_0_3px_rgba(0,212,255,0.35)]"
                : boundaryZone
                  ? "border-white/20 bg-black/40 text-white hover:border-accent/60 hover:bg-black/60"
                  : "border-white/25 bg-white/10 text-white hover:border-accent/60 hover:bg-white/20"
            )}
          >
            {ZONE_SHORT[zone.code] ?? zone.label}
          </button>
        );
      })}

      {/* selected zone legend */}
      {selectedZone && (
        <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold text-accent">
          {getZone(selectedZone)?.label}
          {getZone(selectedZone)?.ring === "BOUNDARY" ? " · boundary" : ""}
        </div>
      )}
    </div>
  );
}
