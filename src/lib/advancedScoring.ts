/**
 * Advanced scoring metadata: shot classification, ball placement zones,
 * fielding settings and batter handedness.
 *
 * Placement zones are classified geometrically from an exact tap position by
 * `src/lib/fieldGeometry.ts`. The normalized batter-relative space is:
 * x in -1..1 (positive = OFF side), y in -1..1 (positive = forward, toward
 * the bowler), angle in degrees (0 = straight, positive = off), and distance
 * in 0..1 (1 = boundary). The `x`/`y` viewer coordinates on `ZoneDef` are
 * used only for hints and legacy ring rendering for a right-hander.
 */

export type BattingHand = "RIGHT" | "LEFT";

// ---------------------------------------------------------------------------
// Shot classification
// ---------------------------------------------------------------------------

export type ShotType =
  | "DOT"
  | "DEFENSIVE"
  | "DRIVE"
  | "COVER_DRIVE"
  | "STRAIGHT_DRIVE"
  | "ON_DRIVE"
  | "CUT"
  | "SQUARE_CUT"
  | "LATE_CUT"
  | "PULL"
  | "HOOK"
  | "SWEEP"
  | "REVERSE"
  | "FLICK"
  | "GLANCE"
  | "NUDGE"
  | "UPPER"
  | "LOFTED"
  | "SCOOP"
  | "RAMP"
  | "EDGE"
  | "OTHER";

export interface ShotDef {
  code: ShotType;
  label: string;
  hint: string;
}

export const SHOTS: ShotDef[] = [
  { code: "DOT", label: "Dot", hint: "Leave / defend for no run" },
  { code: "DEFENSIVE", label: "Defensive", hint: "Forward block, no risk" },
  { code: "DRIVE", label: "Drive", hint: "Front-foot drive to straight field" },
  { code: "COVER_DRIVE", label: "Cover Drive", hint: "Driven through the cover region" },
  { code: "STRAIGHT_DRIVE", label: "Straight Drive", hint: "Driven straight past the bowler" },
  { code: "ON_DRIVE", label: "On Drive", hint: "Driven between mid-on and midwicket" },
  { code: "CUT", label: "Cut", hint: "Back-foot cut square of the wicket" },
  { code: "SQUARE_CUT", label: "Square Cut", hint: "Cut square of the wicket" },
  { code: "LATE_CUT", label: "Late Cut", hint: "Cut behind point, played late" },
  { code: "PULL", label: "Pull", hint: "Horizontal bat pull to leg" },
  { code: "HOOK", label: "Hook", hint: "Pull to a short ball behind square" },
  { code: "SWEEP", label: "Sweep", hint: "Kneel-down sweep to spin" },
  { code: "REVERSE", label: "Reverse Sweep", hint: "Reverse sweep / paddle" },
  { code: "FLICK", label: "Flick", hint: "Glance / flick off the pads" },
  { code: "GLANCE", label: "Glance", hint: "Fine deflection to the leg side" },
  { code: "NUDGE", label: "Nudge", hint: "Soft touch for a quick single" },
  { code: "UPPER", label: "Upper Cut", hint: "Upper cut behind point" },
  { code: "LOFTED", label: "Lofted", hint: "Big hit over the top" },
  { code: "SCOOP", label: "Scoop", hint: "Scooped over the keeper / fine" },
  { code: "RAMP", label: "Ramp", hint: "Ramped over the slip cordon" },
  { code: "EDGE", label: "Edge", hint: "Ball flies off the outside edge" },
  { code: "OTHER", label: "Other", hint: "Anything that doesn't fit" },
];

// ---------------------------------------------------------------------------
// Ball placement zones
// ---------------------------------------------------------------------------

export type PlacementZone =
  | "SLIP"
  | "FLY_SLIP"
  | "GULLY"
  | "SILLY_POINT"
  | "BACKWARD_POINT"
  | "DEEP_BACKWARD_POINT"
  | "THIRD_MAN"
  | "DEEP_THIRD_MAN"
  | "POINT"
  | "DEEP_POINT"
  | "SHORT_COVER"
  | "EXTRA_COVER"
  | "DEEP_EXTRA_COVER"
  | "COVER"
  | "DEEP_COVER"
  | "SILLY_MID_OFF"
  | "MID_OFF"
  | "LONG_OFF"
  | "STRAIGHT"
  | "SILLY_MID_ON"
  | "MID_ON"
  | "LONG_ON"
  | "SHORT_LEG"
  | "MIDWICKET"
  | "DEEP_MIDWICKET"
  | "COW_CORNER"
  | "SQUARE_LEG"
  | "DEEP_SQUARE_LEG"
  | "BACKWARD_SQUARE_LEG"
  | "DEEP_BACKWARD_SQUARE_LEG"
  | "LEG_SLIP"
  | "LEG_GULLY"
  | "FINE_LEG"
  | "DEEP_FINE_LEG"
  | "LONG_LEG";

export interface ZoneDef {
  code: PlacementZone;
  label: string;
  side: "OFF" | "STRAIGHT" | "LEG";
  ring: "INNER" | "BOUNDARY";
  /** Viewer x for a right-hander (0 = left = off side). */
  x: number;
  /** Viewer y (0 = top = bowler's end). */
  y: number;
  /** Typical runs for a well-timed ball into this zone. */
  runs: [number, number];
}

export const ZONES: ZoneDef[] = [
  { code: "SLIP", label: "Slip", side: "OFF", ring: "INNER", x: 34, y: 12, runs: [0, 1] },
  { code: "FLY_SLIP", label: "Fly slip", side: "OFF", ring: "INNER", x: 26, y: 12, runs: [1, 2] },
  { code: "GULLY", label: "Gully", side: "OFF", ring: "INNER", x: 30, y: 18, runs: [1, 2] },
  { code: "SILLY_POINT", label: "Silly point", side: "OFF", ring: "INNER", x: 34, y: 28, runs: [0, 1] },
  { code: "BACKWARD_POINT", label: "Backward point", side: "OFF", ring: "INNER", x: 17, y: 28, runs: [1, 2] },
  { code: "DEEP_BACKWARD_POINT", label: "Deep backward point", side: "OFF", ring: "BOUNDARY", x: 7, y: 30, runs: [1, 4] },
  { code: "DEEP_THIRD_MAN", label: "Third man", side: "OFF", ring: "BOUNDARY", x: 8, y: 10, runs: [1, 4] },
  { code: "THIRD_MAN", label: "Third man", side: "OFF", ring: "INNER", x: 18, y: 20, runs: [1, 2] },
  { code: "DEEP_POINT", label: "Deep point", side: "OFF", ring: "BOUNDARY", x: 11, y: 32, runs: [1, 4] },
  { code: "POINT", label: "Point", side: "OFF", ring: "INNER", x: 23, y: 35, runs: [1, 2] },
  { code: "SHORT_COVER", label: "Short cover", side: "OFF", ring: "INNER", x: 28, y: 42, runs: [1, 2] },
  { code: "EXTRA_COVER", label: "Extra cover", side: "OFF", ring: "INNER", x: 22, y: 50, runs: [1, 3] },
  { code: "DEEP_EXTRA_COVER", label: "Deep extra cover", side: "OFF", ring: "BOUNDARY", x: 13, y: 52, runs: [1, 4] },
  { code: "DEEP_COVER", label: "Deep cover", side: "OFF", ring: "BOUNDARY", x: 16, y: 56, runs: [1, 4] },
  { code: "COVER", label: "Cover", side: "OFF", ring: "INNER", x: 29, y: 50, runs: [1, 3] },
  { code: "SILLY_MID_OFF", label: "Silly mid off", side: "OFF", ring: "INNER", x: 42, y: 24, runs: [0, 1] },
  { code: "LONG_OFF", label: "Long off", side: "OFF", ring: "BOUNDARY", x: 30, y: 15, runs: [1, 4] },
  { code: "MID_OFF", label: "Mid off", side: "OFF", ring: "INNER", x: 41, y: 30, runs: [1, 3] },
  { code: "STRAIGHT", label: "Straight", side: "STRAIGHT", ring: "INNER", x: 50, y: 14, runs: [1, 4] },
  { code: "SILLY_MID_ON", label: "Silly mid on", side: "LEG", ring: "INNER", x: 58, y: 24, runs: [0, 1] },
  { code: "LONG_ON", label: "Long on", side: "LEG", ring: "BOUNDARY", x: 70, y: 15, runs: [1, 4] },
  { code: "MID_ON", label: "Mid on", side: "LEG", ring: "INNER", x: 59, y: 30, runs: [1, 3] },
  { code: "SHORT_LEG", label: "Short leg", side: "LEG", ring: "INNER", x: 66, y: 28, runs: [0, 1] },
  { code: "DEEP_MIDWICKET", label: "Deep midwicket", side: "LEG", ring: "BOUNDARY", x: 84, y: 56, runs: [1, 4] },
  { code: "COW_CORNER", label: "Cow corner", side: "LEG", ring: "BOUNDARY", x: 90, y: 45, runs: [1, 6] },
  { code: "MIDWICKET", label: "Midwicket", side: "LEG", ring: "INNER", x: 71, y: 50, runs: [1, 3] },
  { code: "DEEP_SQUARE_LEG", label: "Deep square leg", side: "LEG", ring: "BOUNDARY", x: 89, y: 32, runs: [1, 4] },
  { code: "SQUARE_LEG", label: "Square leg", side: "LEG", ring: "INNER", x: 77, y: 35, runs: [1, 2] },
  { code: "BACKWARD_SQUARE_LEG", label: "Backward square leg", side: "LEG", ring: "INNER", x: 83, y: 30, runs: [1, 2] },
  { code: "DEEP_BACKWARD_SQUARE_LEG", label: "Deep backward square leg", side: "LEG", ring: "BOUNDARY", x: 93, y: 30, runs: [1, 4] },
  { code: "LEG_SLIP", label: "Leg slip", side: "LEG", ring: "INNER", x: 66, y: 12, runs: [0, 1] },
  { code: "LEG_GULLY", label: "Leg gully", side: "LEG", ring: "INNER", x: 70, y: 18, runs: [0, 1] },
  { code: "DEEP_FINE_LEG", label: "Fine leg", side: "LEG", ring: "BOUNDARY", x: 92, y: 10, runs: [1, 4] },
  { code: "FINE_LEG", label: "Fine leg", side: "LEG", ring: "INNER", x: 82, y: 20, runs: [1, 2] },
  { code: "LONG_LEG", label: "Long leg", side: "LEG", ring: "BOUNDARY", x: 78, y: 14, runs: [1, 4] },
];

const ZONE_BY_CODE = new Map<string, ZoneDef>(ZONES.map((z) => [z.code, z]));

export function getZone(code: string | null | undefined): ZoneDef | undefined {
  return code ? ZONE_BY_CODE.get(code) : undefined;
}

export function isBoundaryZone(code: string | null | undefined): boolean {
  return getZone(code)?.ring === "BOUNDARY";
}

export function zoneLabel(code: string | null | undefined): string {
  return getZone(code)?.label ?? "";
}

/**
 * Position of a zone in viewer space, mirroring the field horizontally for a
 * left-handed batter.
 */
export function zonePosition(
  zone: ZoneDef,
  hand: BattingHand
): { x: number; y: number } {
  return hand === "LEFT" ? { x: 100 - zone.x, y: zone.y } : { x: zone.x, y: zone.y };
}

/** Group zones into rings so the field can render them distinctly. */
export function zonesByRing(
  hand: BattingHand
): { boundary: { x: number; y: number; zone: ZoneDef }[]; inner: { x: number; y: number; zone: ZoneDef }[] } {
  const boundary: { x: number; y: number; zone: ZoneDef }[] = [];
  const inner: { x: number; y: number; zone: ZoneDef }[] = [];
  for (const zone of ZONES) {
    const pos = zonePosition(zone, hand);
    if (zone.ring === "BOUNDARY") boundary.push({ ...pos, zone });
    else inner.push({ ...pos, zone });
  }
  return { boundary, inner };
}

/** Inferred batting hand: prefers a normalized field, falls back to battingStyle. */
export function getBattingHand(player: {
  battingHand?: string | null;
  battingStyle?: string | null;
} | null | undefined): BattingHand {
  const hand = player?.battingHand ?? player?.battingStyle ?? "";
  const lower = hand.toLowerCase();
  if (lower.includes("left")) return "LEFT";
  return "RIGHT";
}

// ---------------------------------------------------------------------------
// Fielding positions / field settings
// ---------------------------------------------------------------------------

export interface FieldPositionDef {
  code: string;
  label: string;
}

export const FIELD_POSITIONS: FieldPositionDef[] = [
  { code: "SLIP", label: "Slip" },
  { code: "GULLY", label: "Gully" },
  { code: "SILLY_POINT", label: "Silly point" },
  { code: "SHORT_LEG", label: "Short leg" },
  { code: "LEG_GULLY", label: "Leg gully" },
  { code: "POINT", label: "Point" },
  { code: "COVER", label: "Cover" },
  { code: "EXTRA_COVER", label: "Extra cover" },
  { code: "SHORT_COVER", label: "Short cover" },
  { code: "MID_OFF", label: "Mid off" },
  { code: "MID_ON", label: "Mid on" },
  { code: "MIDWICKET", label: "Midwicket" },
  { code: "SQUARE_LEG", label: "Square leg" },
  { code: "FINE_LEG", label: "Fine leg" },
  { code: "THIRD_MAN", label: "Third man" },
  { code: "LONG_OFF", label: "Long off" },
  { code: "LONG_ON", label: "Long on" },
  { code: "LONG_LEG", label: "Long leg" },
  { code: "STRAIGHT_HIT", label: "Straight hit" },
  { code: "DEEP_COVER", label: "Deep cover" },
  { code: "DEEP_MIDWICKET", label: "Deep midwicket" },
  { code: "DEEP_POINT", label: "Deep point" },
  { code: "DEEP_SQUARE_LEG", label: "Deep square leg" },
  { code: "DEEP_THIRD_MAN", label: "Deep third man" },
  { code: "DEEP_FINE_LEG", label: "Deep fine leg" },
];

export interface FieldPresetDef {
  code: string;
  label: string;
  positions: string[];
}

export const FIELD_PRESETS: FieldPresetDef[] = [
  {
    code: "DEFAULT",
    label: "Standard",
    positions: [
      "SLIP", "GULLY", "POINT", "COVER", "MID_OFF", "MID_ON",
      "MIDWICKET", "SQUARE_LEG", "FINE_LEG",
      "LONG_OFF", "LONG_ON", "DEEP_COVER", "DEEP_MIDWICKET",
      "DEEP_POINT", "DEEP_THIRD_MAN", "DEEP_FINE_LEG",
    ],
  },
  {
    code: "ATTACKING",
    label: "Attacking",
    positions: [
      "SLIP", "GULLY", "SILLY_POINT", "SHORT_LEG", "LEG_GULLY",
      "POINT", "COVER", "EXTRA_COVER", "MID_OFF", "MID_ON",
      "MIDWICKET", "SQUARE_LEG", "FINE_LEG", "THIRD_MAN",
    ],
  },
  {
    code: "DEFENSIVE",
    label: "Defensive",
    positions: [
      "POINT", "COVER", "EXTRA_COVER", "SHORT_COVER", "MID_OFF", "MID_ON",
      "MIDWICKET", "SQUARE_LEG",
      "LONG_OFF", "LONG_ON", "LONG_LEG", "STRAIGHT_HIT",
      "DEEP_COVER", "DEEP_MIDWICKET", "DEEP_POINT",
      "DEEP_SQUARE_LEG", "DEEP_THIRD_MAN", "DEEP_FINE_LEG",
    ],
  },
  {
    code: "CLOSE",
    label: "Close",
    positions: [
      "SLIP", "GULLY", "SILLY_POINT", "SHORT_LEG", "LEG_GULLY",
      "POINT", "COVER", "MID_OFF", "MID_ON", "MIDWICKET",
      "SQUARE_LEG", "FINE_LEG",
    ],
  },
  {
    code: "CLEAR",
    label: "Clear",
    positions: [],
  },
];

export function serializeFieldPositions(codes: string[]): string | null {
  return codes.length ? JSON.stringify(codes) : null;
}

export function parseFieldPositions(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Pending advanced metadata shared between the scoring UI and the ball payload
// ---------------------------------------------------------------------------

export interface AdvancedBallMeta {
  shotType: ShotType | null;
  placementZone: PlacementZone | null;
  /** Normalized batter-relative coordinates of the tap (see fieldGeometry). */
  placementX: number | null;
  placementY: number | null;
  placementAngle: number | null;
  placementDistance: number | null;
  fieldPositions: string[];
  isOverthrow: boolean;
}

export const EMPTY_ADVANCED: AdvancedBallMeta = {
  shotType: null,
  placementZone: null,
  placementX: null,
  placementY: null,
  placementAngle: null,
  placementDistance: null,
  fieldPositions: [],
  isOverthrow: false,
};

/** Pending metadata merged onto a recorded ball. */
export function advancedToBallInput(
  meta: AdvancedBallMeta
): {
  shotType: string | null;
  placementZone: string | null;
  placementX: number | null;
  placementY: number | null;
  placementAngle: number | null;
  placementDistance: number | null;
  fieldPositions: string | null;
  isOverthrow: boolean;
} {
  return {
    shotType: meta.shotType ?? null,
    placementZone: meta.placementZone ?? null,
    placementX: meta.placementX ?? null,
    placementY: meta.placementY ?? null,
    placementAngle: meta.placementAngle ?? null,
    placementDistance: meta.placementDistance ?? null,
    fieldPositions: serializeFieldPositions(meta.fieldPositions),
    isOverthrow: meta.isOverthrow,
  };
}

export function shotLabel(code: string | null | undefined): string {
  return SHOTS.find((s) => s.code === code)?.label ?? "";
}
