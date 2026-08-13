"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { type BattingHand, ZONES, getZone, zonePosition } from "@/lib/advancedScoring";
import {
  type BattingEnd,
  type FieldPoint,
  classifyShotLocation,
  sectorWedgePath,
  FIELD_CENTER_X,
  FIELD_CENTER_Y,
  BOUNDARY_RADIUS,
} from "@/lib/fieldGeometry";

const ZONE_HINT: Record<string, string> = {
  THIRD_MAN: "3rd",
  DEEP_THIRD_MAN: "3rd",
  POINT: "Pt",
  DEEP_POINT: "Pt",
  COVER: "Cv",
  DEEP_COVER: "Cv",
  DEEP_EXTRA_COVER: "XC",
  EXTRA_COVER: "XC",
  MID_OFF: "MO",
  LONG_OFF: "LO",
  STRAIGHT: "St",
  LONG_ON: "LOn",
  MID_ON: "MOn",
  MIDWICKET: "Mw",
  DEEP_MIDWICKET: "Mw",
  COW_CORNER: "CC",
  SQUARE_LEG: "SL",
  DEEP_SQUARE_LEG: "SL",
  FINE_LEG: "FL",
  DEEP_FINE_LEG: "FL",
  LONG_LEG: "LL",
};

interface CricketFieldProps {
  battingHand: BattingHand;
  battingEnd: BattingEnd;
  selected: FieldPoint | null;
  onSelect: (point: FieldPoint) => void;
  className?: string;
}

export function CricketField({
  battingHand,
  battingEnd,
  selected,
  onSelect,
  className,
}: CricketFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<FieldPoint | null>(null);

  const offLeft = battingHand === "RIGHT";
  const selectedPath = selected ? sectorWedgePath(selected, { handedness: battingHand, battingEnd }) : null;
  const hoverPath = hover ? sectorWedgePath(hover, { handedness: battingHand, battingEnd }) : null;

  const toSvgPoint = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const el = containerRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      return {
        x: ((clientX - rect.left) / rect.width) * 100,
        y: ((clientY - rect.top) / rect.height) * 100,
      };
    },
    []
  );

  const classifyAt = useCallback(
    (clientX: number, clientY: number): FieldPoint | null => {
      const p = toSvgPoint(clientX, clientY);
      if (!p) return null;
      const dx = p.x - FIELD_CENTER_X;
      const dy = p.y - FIELD_CENTER_Y;
      if (dx * dx + dy * dy > BOUNDARY_RADIUS * BOUNDARY_RADIUS) return null;
      return classifyShotLocation(p.x, p.y, { handedness: battingHand, battingEnd });
    },
    [toSvgPoint, battingHand, battingEnd]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setHover(classifyAt(e.clientX, e.clientY));
    },
    [classifyAt]
  );

  const handlePointerLeave = useCallback(() => setHover(null), []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const point = classifyAt(e.clientX, e.clientY);
      if (!point) return;
      if (point.zone) onSelect(point);
    },
    [classifyAt, onSelect]
  );

  const active = selected ?? hover;

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      className={cn("relative aspect-square w-full cursor-crosshair select-none touch-none", className)}
    >
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 h-full w-full"
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
        {/* batsman at the bottom, bowler at the top (canonical orientation) */}
        <circle cx="50" cy="79" r="1.6" fill="#fff" />
        <circle cx="50" cy="20" r="1.3" fill="rgba(255,255,255,0.8)" />
        {/* side labels */}
        <text x={offLeft ? "8" : "92"} y="6" textAnchor={offLeft ? "start" : "end"} fill="rgba(255,255,255,0.45)" fontSize="3.4" fontWeight="700">
          OFF SIDE
        </text>
        <text x={offLeft ? "92" : "8"} y="6" textAnchor={offLeft ? "end" : "start"} fill="rgba(255,255,255,0.45)" fontSize="3.4" fontWeight="700">
          LEG SIDE
        </text>

        {/* hover band highlight */}
        {hoverPath && hover && hover !== selected && (
          <path d={hoverPath} fill="rgba(0,212,255,0.12)" stroke="rgba(0,212,255,0.4)" strokeWidth="0.4" />
        )}
        {/* selected band highlight */}
        {selectedPath && selected && (
          <path d={selectedPath} fill="rgba(0,212,255,0.22)" stroke="rgba(0,212,255,0.7)" strokeWidth="0.6" />
        )}

        {/* selected tap marker (exact position, never snapped) */}
        {selected && (
          <g>
            <circle cx={selected.svgX} cy={selected.svgY} r="3.2" fill="rgba(0,212,255,0.25)">
              <animate attributeName="r" values="2.5;4.5;2.5" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={selected.svgX} cy={selected.svgY} r="1.5" fill="#00d4ff" stroke="#041e12" strokeWidth="0.3" />
          </g>
        )}
        {/* hover marker */}
        {hover && hover !== selected && (
          <circle cx={hover.svgX} cy={hover.svgY} r="1.2" fill="rgba(255,255,255,0.6)" />
        )}

        {/* subtle non-interactive zone hints (mirrored for LHB, rotated with end) */}
        {ZONES.map((zone) => {
          const pos = zonePosition(zone, battingHand);
          const x = battingEnd === "TOP" ? 100 - pos.x : pos.x;
          const y = battingEnd === "TOP" ? 100 - pos.y : pos.y;
          return (
            <text
              key={zone.code}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="2.6"
              fill="rgba(255,255,255,0.28)"
              fontWeight="600"
            >
              {ZONE_HINT[zone.code]}
            </text>
          );
        })}
      </svg>

      {/* detected zone legend */}
      {active && active.zone && (
        <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold text-accent">
          {getZone(active.zone)?.label}
          {active.band === "DEEP" ? " · deep" : active.band === "OUTFIELD" ? " · outfield" : active.band === "CLOSE" ? " · close" : ""}
        </div>
      )}
    </div>
  );
}
