"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  type AdvancedBallMeta,
  type BattingHand,
  shotLabel,
  zoneLabel,
} from "@/lib/advancedScoring";
import {
  type BattingEnd,
  type FieldPoint,
  svgFromNormalized,
  bandForDistance,
} from "@/lib/fieldGeometry";
import { CricketField } from "./CricketField";
import { SectorFieldSelector } from "./SectorFieldSelector";
import { ShotSelector } from "./ShotSelector";
import { FieldSettings } from "./FieldSettings";

interface AdvancedScoringPanelProps {
  battingHand: BattingHand;
  battingEnd: BattingEnd;
  freeHit: boolean;
  submitting: boolean;
  meta: AdvancedBallMeta;
  onChange: (meta: AdvancedBallMeta) => void;
  onRunOut: () => void;
}

export function AdvancedScoringPanel({
  battingHand,
  battingEnd,
  freeHit,
  submitting,
  meta,
  onChange,
  onRunOut,
}: AdvancedScoringPanelProps) {
  const hasAny =
    meta.shotType !== null ||
    meta.placementZone !== null ||
    meta.fieldPositions.length > 0 ||
    meta.isOverthrow;

  const summary = [
    meta.shotType ? shotLabel(meta.shotType) : null,
    meta.placementZone ? zoneLabel(meta.placementZone) : null,
    meta.fieldPositions.length > 0
      ? `field ${meta.fieldPositions.length}`
      : null,
    meta.isOverthrow ? "overthrow" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  /** Rebuild the tap point from the stored normalized coordinates. */
  const selectedPoint = useCallback((): FieldPoint | null => {
    if (
      !meta.placementZone ||
      meta.placementX === null ||
      meta.placementY === null ||
      meta.placementAngle === null ||
      meta.placementDistance === null
    ) {
      return null;
    }
    const { svgX, svgY } = svgFromNormalized(
      meta.placementX,
      meta.placementY,
      { handedness: battingHand, battingEnd }
    );
    return {
      svgX,
      svgY,
      x: meta.placementX,
      y: meta.placementY,
      angle: meta.placementAngle,
      distance: meta.placementDistance,
      zone: meta.placementZone,
      band: bandForDistance(meta.placementDistance),
    };
  }, [meta, battingHand, battingEnd]);

  const handleFieldSelect = useCallback(
    (point: FieldPoint) => {
      onChange({
        ...meta,
        placementZone: point.zone,
        placementX: point.x,
        placementY: point.y,
        placementAngle: point.angle,
        placementDistance: point.distance,
      });
    },
    [meta, onChange]
  );

  const handleClear = useCallback(() => {
    onChange({
      ...meta,
      shotType: null,
      placementZone: null,
      placementX: null,
      placementY: null,
      placementAngle: null,
      placementDistance: null,
      fieldPositions: [],
      isOverthrow: false,
    });
  }, [meta, onChange]);

  return (
    <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
          Advanced Scoring
        </h3>
        <div className="flex items-center gap-2">
          {freeHit && (
            <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
              Free hit
            </span>
          )}
          {hasAny && (
            <span className="max-w-[45vw] truncate rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] text-muted">
              {summary}
            </span>
          )}
          <button
            type="button"
            disabled={submitting || !hasAny}
            onClick={handleClear}
            className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted hover:text-white disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <CricketField
          battingHand={battingHand}
          battingEnd={battingEnd}
          selected={selectedPoint()}
          onSelect={handleFieldSelect}
        />
        <div className="flex flex-col justify-center gap-3">
          <SectorFieldSelector
            selectedZone={meta.placementZone}
            onSelect={(zone) =>
              onChange({
                ...meta,
                placementZone: meta.placementZone === zone ? null : zone,
                placementX: null,
                placementY: null,
                placementAngle: null,
                placementDistance: null,
              })
            }
          />
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => onChange({ ...meta, isOverthrow: !meta.isOverthrow })}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                meta.isOverthrow
                  ? "border-warning/60 bg-warning/15 text-warning"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10"
              )}
            >
              Overthrow {meta.isOverthrow ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={onRunOut}
              className="flex-1 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger/20"
            >
              Run out?
            </button>
          </div>
          <p className="text-[10px] leading-relaxed text-muted">
            Tap where the ball went on the field. The region is detected from
            the exact spot — tap deeper for the deep field. Pick the shot, and
            the details are attached to the next ball you record.
          </p>
        </div>
      </div>

      <ShotSelector
        selected={meta.shotType}
        onSelect={(shot) => onChange({ ...meta, shotType: shot })}
      />

      <details className="group rounded-xl border border-white/10 bg-white/[0.02]">
        <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs font-semibold text-white/80">
          Field settings
          <span className="text-[10px] text-muted">
            {meta.fieldPositions.length} positions · tap to expand
          </span>
        </summary>
        <div className="p-3">
          <FieldSettings
            positions={meta.fieldPositions}
            onChange={(positions) => onChange({ ...meta, fieldPositions: positions })}
          />
        </div>
      </details>
    </div>
  );
}
