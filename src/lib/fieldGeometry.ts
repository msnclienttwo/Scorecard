/**
 * Cricket field geometry: whole-ground tap classification.
 *
 * The scorer taps anywhere on the field art. A tap is converted from raw SVG
 * coordinates into a batter-relative coordinate, then classified into a
 * fielding region using ANGLE (direction) + DISTANCE (how far from the
 * striker). The striker's physical end and handedness are treated as two
 * independent transformations so Cover can never be confused with Mid-wicket
 * or Third Man with Fine Leg.
 *
 * Coordinate pipeline:
 *
 *   physical SVG click
 *       -> rotate 180° if the striker bats from the TOP end
 *       -> translate so the striker's crease is the origin
 *       -> mirror X if the batter is left-handed
 *       -> batter-relative (x, y, angle, distance)
 *       -> fielding region
 *
 * Normalized batter-relative space (used for storage + wagon wheels):
 *   x  in -1..1, positive = OFF side
 *   y  in -1..1, positive = forward (toward the bowler / straight hit)
 *   angle in degrees: 0 = straight, positive = off side
 *   distance in 0..1: 1 = boundary
 */

import type { BattingHand, PlacementZone, ShotType } from "@/lib/advancedScoring";

export type BattingEnd = "TOP" | "BOTTOM";

export type DistanceBand = "CLOSE" | "INNER" | "OUTFIELD" | "DEEP";

export interface FieldPoint {
  /** Physical tap position inside the 0..100 SVG viewBox (for the marker). */
  svgX: number;
  svgY: number;
  /** Normalized batter-relative coordinates (-1..1, +x = off side). */
  x: number;
  y: number;
  /** Degrees, 0 = straight, positive = off side. */
  angle: number;
  /** 0..1 normalized to the boundary along the tap's ray. */
  distance: number;
  zone: PlacementZone | null;
  band: DistanceBand;
}

export interface ClassifyOptions {
  handedness: BattingHand;
  battingEnd: BattingEnd;
}

// ---------------------------------------------------------------------------
// SVG geometry constants (viewBox "0 0 100 100")
// ---------------------------------------------------------------------------

export const FIELD_CENTER_X = 50;
export const FIELD_CENTER_Y = 50;
export const BOUNDARY_RADIUS = 48;
export const STRIKER_Y_BOTTOM = 80;
export const STRIKER_Y_TOP = 20;

// Distance bands (0..1, normalized to the boundary along the tap ray).
// Tuned to the SVG: the 30-yard ring crosses the straight line at ~0.72 and
// the close-catching ring (roughly the inner 20m) at ~0.20.
export const DISTANCE_BANDS = [
  { band: "CLOSE" as const, min: 0, max: 0.2 },
  { band: "INNER" as const, min: 0.2, max: 0.48 },
  { band: "OUTFIELD" as const, min: 0.48, max: 0.72 },
  { band: "DEEP" as const, min: 0.72, max: 1 },
];

export const STRAIGHT_HALF_ANGLE = 10;

// ---------------------------------------------------------------------------
// Angular sectors. Angles are measured from straight (0°) with positive
// angles on the OFF side. Each sector yields a different zone per distance
// band, so tapping deeper in the same direction produces DEEP_* zones.
// ---------------------------------------------------------------------------

export interface FieldSector {
  min: number;
  max: number;
  side: "OFF" | "LEG";
  close: PlacementZone;
  inner: PlacementZone;
  outfield: PlacementZone;
  deep: PlacementZone;
}

export const OFF_SECTORS: FieldSector[] = [
  { min: 10, max: 32, side: "OFF", close: "SILLY_MID_OFF", inner: "MID_OFF", outfield: "MID_OFF", deep: "LONG_OFF" },
  { min: 32, max: 55, side: "OFF", close: "SHORT_COVER", inner: "EXTRA_COVER", outfield: "EXTRA_COVER", deep: "DEEP_EXTRA_COVER" },
  { min: 55, max: 80, side: "OFF", close: "SHORT_COVER", inner: "COVER", outfield: "COVER", deep: "DEEP_COVER" },
  { min: 80, max: 100, side: "OFF", close: "SILLY_POINT", inner: "POINT", outfield: "POINT", deep: "DEEP_POINT" },
  { min: 100, max: 125, side: "OFF", close: "SILLY_POINT", inner: "BACKWARD_POINT", outfield: "BACKWARD_POINT", deep: "DEEP_BACKWARD_POINT" },
  { min: 125, max: 150, side: "OFF", close: "GULLY", inner: "GULLY", outfield: "THIRD_MAN", deep: "DEEP_THIRD_MAN" },
  { min: 150, max: 180, side: "OFF", close: "SLIP", inner: "FLY_SLIP", outfield: "THIRD_MAN", deep: "DEEP_THIRD_MAN" },
];

export const LEG_SECTORS: FieldSector[] = [
  { min: 10, max: 32, side: "LEG", close: "SILLY_MID_ON", inner: "MID_ON", outfield: "MID_ON", deep: "LONG_ON" },
  { min: 32, max: 55, side: "LEG", close: "SHORT_LEG", inner: "MIDWICKET", outfield: "MIDWICKET", deep: "COW_CORNER" },
  { min: 55, max: 75, side: "LEG", close: "SHORT_LEG", inner: "MIDWICKET", outfield: "MIDWICKET", deep: "DEEP_MIDWICKET" },
  { min: 75, max: 100, side: "LEG", close: "SHORT_LEG", inner: "SQUARE_LEG", outfield: "SQUARE_LEG", deep: "DEEP_SQUARE_LEG" },
  { min: 100, max: 125, side: "LEG", close: "SHORT_LEG", inner: "BACKWARD_SQUARE_LEG", outfield: "BACKWARD_SQUARE_LEG", deep: "DEEP_BACKWARD_SQUARE_LEG" },
  { min: 125, max: 150, side: "LEG", close: "LEG_GULLY", inner: "BACKWARD_SQUARE_LEG", outfield: "LONG_LEG", deep: "DEEP_FINE_LEG" },
  { min: 150, max: 180, side: "LEG", close: "LEG_SLIP", inner: "FINE_LEG", outfield: "FINE_LEG", deep: "DEEP_FINE_LEG" },
];

export const ALL_SECTORS: FieldSector[] = [...OFF_SECTORS, ...LEG_SECTORS];

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Distance from the striker to the boundary circle along a ray given in
 * SCREEN space (dx, dy) relative to the striker, in viewBox units. The
 * striker's crease is at (50, 80); screen +y points down the field art.
 */
export function boundaryDistanceAlongRay(dx: number, dy: number): number {
  const a = dx * dx + dy * dy;
  if (a < 1e-9) return 1;
  // Point on the ray: (50 + t*dx, 80 + t*dy). Boundary circle centred at
  // (50, 50) with radius 48 → (t*dx)^2 + (30 + t*dy)^2 = 48^2.
  const b = 60 * dy;
  const c = 30 * 30 - BOUNDARY_RADIUS * BOUNDARY_RADIUS;
  const t = (-b + Math.sqrt(Math.max(b * b - 4 * a * c, 0))) / (2 * a);
  return t * Math.sqrt(a);
}

/**
 * Convert a raw SVG tap into normalized batter-relative coordinates.
 * Applies the batting-end rotation first, then the handedness mirror.
 */
export function normalizeFieldPoint(
  svgX: number,
  svgY: number,
  opts: ClassifyOptions
): { x: number; y: number; angle: number; distance: number } {
  const { handedness, battingEnd } = opts;

  // 1. Rotate 180° around the field centre when the striker bats from the
  //    TOP end, so the coordinate system always originates at the striker.
  const cx = battingEnd === "TOP" ? 100 - svgX : svgX;
  const cy = battingEnd === "TOP" ? 100 - svgY : svgY;

  // 2. Translate so the striker's crease is the origin. Forward (toward the
  //    bowler) is +y in canonical space.
  const relX = cx - FIELD_CENTER_X;
  const relY = STRIKER_Y_BOTTOM - cy;

  // 3. Mirror X for a left-handed batter. +x is always the OFF side.
  const off = handedness === "LEFT" ? relX : -relX;
  const fwd = relY;

  const angle = (Math.atan2(off, fwd) * 180) / Math.PI;
  const boundary = boundaryDistanceAlongRay(relX, -relY);
  const dist = Math.hypot(off, fwd);
  const distance = boundary > 0 ? Math.min(dist / boundary, 1) : 0;
  const norm = distance === 0 ? 0 : Math.hypot(off, fwd);

  return {
    x: norm === 0 ? 0 : (off / norm) * distance,
    y: norm === 0 ? 0 : (fwd / norm) * distance,
    angle,
    distance,
  };
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

export function bandForDistance(distance: number): DistanceBand {
  for (const b of DISTANCE_BANDS) {
    if (distance >= b.min && distance < b.max) return b.band;
  }
  return distance >= DISTANCE_BANDS[DISTANCE_BANDS.length - 1].max
    ? "DEEP"
    : "CLOSE";
}

export function zoneForAngleBand(angle: number, band: DistanceBand): PlacementZone {
  const abs = Math.abs(angle);
  if (abs < STRAIGHT_HALF_ANGLE) return "STRAIGHT";
  const sectors = angle >= 0 ? OFF_SECTORS : LEG_SECTORS;
  for (const s of sectors) {
    if (abs >= s.min && abs < s.max) {
      if (band === "CLOSE") return s.close;
      if (band === "INNER") return s.inner;
      if (band === "OUTFIELD") return s.outfield;
      return s.deep;
    }
  }
  // Beyond the widest sector (e.g. exactly 180°) fall back to the last band.
  const last = sectors[sectors.length - 1];
  if (band === "CLOSE") return last.close;
  if (band === "INNER") return last.inner;
  if (band === "OUTFIELD") return last.outfield;
  return last.deep;
}

/** Find the angular sector a classified zone belongs to (used for highlights). */
export function zoneSector(zone: PlacementZone | null): FieldSector | null {
  if (!zone) return null;
  if (zone === "STRAIGHT") return null;
  return ALL_SECTORS.find(
    (s) => s.close === zone || s.inner === zone || s.outfield === zone || s.deep === zone
  ) ?? null;
}

/**
 * Classify a raw SVG tap into a batter-relative fielding region.
 * This is the primary entry point used by the scoring UI.
 */
export function classifyShotLocation(
  svgX: number,
  svgY: number,
  opts: ClassifyOptions
): FieldPoint {
  const norm = normalizeFieldPoint(svgX, svgY, opts);
  const band = bandForDistance(norm.distance);
  const zone = zoneForAngleBand(norm.angle, band);
  return {
    svgX,
    svgY,
    x: norm.x,
    y: norm.y,
    angle: norm.angle,
    distance: norm.distance,
    zone: norm.distance < 1e-6 ? null : zone,
    band,
  };
}

// ---------------------------------------------------------------------------
// Shot suggestions (zone alone never selects the shot — only suggests it)
// ---------------------------------------------------------------------------

export function suggestShotForZone(zone: PlacementZone | null): ShotType | null {
  if (!zone) return null;
  const OFF_CUT: PlacementZone[] = ["POINT", "DEEP_POINT", "BACKWARD_POINT", "DEEP_BACKWARD_POINT", "GULLY", "THIRD_MAN", "DEEP_THIRD_MAN", "SILLY_POINT"];
  const OFF_DRIVE: PlacementZone[] = ["COVER", "DEEP_COVER", "EXTRA_COVER", "DEEP_EXTRA_COVER", "MID_OFF", "LONG_OFF", "STRAIGHT", "MID_ON", "LONG_ON", "SHORT_COVER"];
  const LEG_PULL: PlacementZone[] = ["SQUARE_LEG", "DEEP_SQUARE_LEG", "BACKWARD_SQUARE_LEG", "DEEP_BACKWARD_SQUARE_LEG", "DEEP_MIDWICKET", "COW_CORNER"];
  const LEG_FLICK: PlacementZone[] = ["FINE_LEG", "DEEP_FINE_LEG", "LONG_LEG", "MIDWICKET"];
  const EDGE_ZONES: PlacementZone[] = ["SLIP", "FLY_SLIP", "LEG_SLIP", "LEG_GULLY"];
  if (EDGE_ZONES.includes(zone)) return "EDGE";
  if (OFF_CUT.includes(zone)) return "CUT";
  if (OFF_DRIVE.includes(zone)) return "DRIVE";
  if (LEG_PULL.includes(zone)) return "PULL";
  if (LEG_FLICK.includes(zone)) return "FLICK";
  return "DEFENSIVE";
}

// ---------------------------------------------------------------------------
// Batting-end helpers
// ---------------------------------------------------------------------------

export function flipBattingEnd(end: BattingEnd): BattingEnd {
  return end === "TOP" ? "BOTTOM" : "TOP";
}

// ---------------------------------------------------------------------------
// SVG wedge rendering (band highlight for the detected zone)
// ---------------------------------------------------------------------------

export const BAND_NORMALIZED_RANGE: Record<DistanceBand, [number, number]> = {
  CLOSE: [0, 0.2],
  INNER: [0.2, 0.48],
  OUTFIELD: [0.48, 0.72],
  DEEP: [0.72, 1],
};

/** Physical viewBox point for a canonical (off-side positive) angle + distance. */
function wedgePoint(
  angleDeg: number,
  distNorm: number,
  opts: ClassifyOptions
): { x: number; y: number } {
  const theta = (angleDeg * Math.PI) / 180;
  const xNorm = Math.sin(theta);
  const yNorm = Math.cos(theta);
  const boundary = boundaryDistanceAlongRay(-xNorm, -yNorm);
  const d = distNorm * boundary;
  const xM = opts.handedness === "LEFT" ? -xNorm : xNorm;
  let x = FIELD_CENTER_X - xM * d;
  let y = STRIKER_Y_BOTTOM - yNorm * d;
  if (opts.battingEnd === "TOP") {
    x = 100 - x;
    y = 100 - y;
  }
  return { x, y };
}

/**
 * Inverse of `normalizeFieldPoint`: reconstruct the physical viewBox tap
 * position from stored normalized batter-relative coordinates.
 */
export function svgFromNormalized(
  x: number,
  y: number,
  opts: ClassifyOptions
): { svgX: number; svgY: number } {
  const dist = Math.hypot(x, y);
  const unitX = dist > 1e-6 ? x / dist : 0;
  const unitY = dist > 1e-6 ? y / dist : 0;
  const boundary = boundaryDistanceAlongRay(-unitX, -unitY);
  const d = dist * boundary;
  const xM = opts.handedness === "LEFT" ? -unitX : unitX;
  let svgX = FIELD_CENTER_X - xM * d;
  let svgY = STRIKER_Y_BOTTOM - unitY * d;
  if (opts.battingEnd === "TOP") {
    svgX = 100 - svgX;
    svgY = 100 - svgY;
  }
  return { svgX, svgY };
}

/**
 * SVG path string for the annular sector of a detected zone's distance band,
 * drawn in the field's physical viewBox coordinates. Returns null when the
 * zone has no angular sector (e.g. straight).
 */
export function sectorWedgePath(
  point: FieldPoint,
  opts: ClassifyOptions
): string | null {
  const sector = zoneSector(point.zone);
  if (!sector) return null;
  const [r0, r1] = BAND_NORMALIZED_RANGE[point.band];
  const from = sector.min;
  const to = sector.max;
  const steps = 24;
  const s = Math.sign(point.angle >= 0 ? 1 : -1);
  const outer: string[] = [];
  const inner: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = from + ((to - from) * i) / steps;
    const pOuter = wedgePoint(s * a, r1, opts);
    const pInner = wedgePoint(s * a, r0, opts);
    outer.push(`${i === 0 ? "M" : "L"} ${pOuter.x.toFixed(3)} ${pOuter.y.toFixed(3)}`);
    inner.push(`${i === 0 ? "M" : "L"} ${pInner.x.toFixed(3)} ${pInner.y.toFixed(3)}`);
  }
  return [...outer, ...inner.slice(1).reverse(), `L ${outer[0].split(" ")[1]} ${outer[0].split(" ")[2]}`, "Z"].join(" ");
}
