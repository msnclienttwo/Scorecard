/**
 * Advanced scoring metadata: shot classification, ball placement zones,
 * fielding settings and batter handedness.
 *
 * All placement zones are defined in a 0–100 coordinate space with the
 * batsman at the bottom-centre facing the bowler (top-centre). For a
 * right-handed batter the OFF side is the viewer's left and the LEG side is
 * the viewer's right; positions are mirrored horizontally for left-handers.
 */

export type BattingHand = "RIGHT" | "LEFT";

// ---------------------------------------------------------------------------
// Shot classification
// ---------------------------------------------------------------------------

export type ShotType =
  | "DOT"
  | "DEFENSIVE"
  | "DRIVE"
  | "CUT"
  | "PULL"
  | "HOOK"
  | "SWEEP"
  | "LOFTED"
  | "REVERSE"
  | "FLICK"
  | "NUDGE"
  | "UPPER";

export interface ShotDef {
  code: ShotType;
  label: string;
  hint: string;
}

export const SHOTS: ShotDef[] = [
  { code: "DOT", label: "Dot", hint: "Leave / defend for no run" },
  { code: "DEFENSIVE", label: "Defensive", hint: "Forward block, no risk" },
  { code: "DRIVE", label: "Drive", hint: "Front-foot drive to straight field" },
  { code: "CUT", label: "Cut", hint: "Back-foot cut square of the wicket" },
  { code: "PULL", label: "Pull", hint: "Horizontal bat pull to leg" },
  { code: "HOOK", label: "Hook", hint: "Pull to a short ball behind square" },
  { code: "SWEEP", label: "Sweep", hint: "Kneel-down sweep to spin" },
  { code: "LOFTED", label: "Lofted", hint: "Big hit over the top" },
  { code: "REVERSE", label: "Reverse", hint: "Reverse sweep / paddle" },
  { code: "FLICK", label: "Flick", hint: "Glance / flick off the pads" },
  { code: "NUDGE", label: "Nudge", hint: "Soft touch for a quick single" },
  { code: "UPPER", label: "Upper", hint: "Upper cut behind point" },
];

// ---------------------------------------------------------------------------
// Ball placement zones
// ---------------------------------------------------------------------------

export type PlacementZone =
  | "THIRD_MAN"
  | "DEEP_THIRD_MAN"
  | "POINT"
  | "DEEP_POINT"
  | "COVER"
  | "DEEP_COVER"
  | "MID_OFF"
  | "LONG_OFF"
  | "STRAIGHT"
  | "LONG_ON"
  | "MID_ON"
  | "MIDWICKET"
  | "DEEP_MIDWICKET"
  | "SQUARE_LEG"
  | "DEEP_SQUARE_LEG"
  | "FINE_LEG"
  | "DEEP_FINE_LEG";

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
  { code: "DEEP_THIRD_MAN", label: "Third man", side: "OFF", ring: "BOUNDARY", x: 8, y: 10, runs: [1, 4] },
  { code: "THIRD_MAN", label: "Third man", side: "OFF", ring: "INNER", x: 18, y: 20, runs: [1, 2] },
  { code: "DEEP_POINT", label: "Deep point", side: "OFF", ring: "BOUNDARY", x: 11, y: 32, runs: [1, 4] },
  { code: "POINT", label: "Point", side: "OFF", ring: "INNER", x: 23, y: 35, runs: [1, 2] },
  { code: "DEEP_COVER", label: "Deep cover", side: "OFF", ring: "BOUNDARY", x: 16, y: 56, runs: [1, 4] },
  { code: "COVER", label: "Cover", side: "OFF", ring: "INNER", x: 29, y: 50, runs: [1, 3] },
  { code: "LONG_OFF", label: "Long off", side: "OFF", ring: "BOUNDARY", x: 30, y: 15, runs: [1, 4] },
  { code: "MID_OFF", label: "Mid off", side: "OFF", ring: "INNER", x: 41, y: 30, runs: [1, 3] },
  { code: "STRAIGHT", label: "Straight", side: "STRAIGHT", ring: "INNER", x: 50, y: 14, runs: [1, 4] },
  { code: "LONG_ON", label: "Long on", side: "LEG", ring: "BOUNDARY", x: 70, y: 15, runs: [1, 4] },
  { code: "MID_ON", label: "Mid on", side: "LEG", ring: "INNER", x: 59, y: 30, runs: [1, 3] },
  { code: "DEEP_MIDWICKET", label: "Deep midwicket", side: "LEG", ring: "BOUNDARY", x: 84, y: 56, runs: [1, 4] },
  { code: "MIDWICKET", label: "Midwicket", side: "LEG", ring: "INNER", x: 71, y: 50, runs: [1, 3] },
  { code: "DEEP_SQUARE_LEG", label: "Deep square leg", side: "LEG", ring: "BOUNDARY", x: 89, y: 32, runs: [1, 4] },
  { code: "SQUARE_LEG", label: "Square leg", side: "LEG", ring: "INNER", x: 77, y: 35, runs: [1, 2] },
  { code: "DEEP_FINE_LEG", label: "Fine leg", side: "LEG", ring: "BOUNDARY", x: 92, y: 10, runs: [1, 4] },
  { code: "FINE_LEG", label: "Fine leg", side: "LEG", ring: "INNER", x: 82, y: 20, runs: [1, 2] },
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
  fieldPositions: string[];
  isOverthrow: boolean;
}

export const EMPTY_ADVANCED: AdvancedBallMeta = {
  shotType: null,
  placementZone: null,
  fieldPositions: [],
  isOverthrow: false,
};

/** Pending metadata merged onto a recorded ball. */
export function advancedToBallInput(
  meta: AdvancedBallMeta
): {
  shotType: string | null;
  placementZone: string | null;
  fieldPositions: string | null;
  isOverthrow: boolean;
} {
  return {
    shotType: meta.shotType ?? null,
    placementZone: meta.placementZone ?? null,
    fieldPositions: serializeFieldPositions(meta.fieldPositions),
    isOverthrow: meta.isOverthrow,
  };
}

export function shotLabel(code: string | null | undefined): string {
  return SHOTS.find((s) => s.code === code)?.label ?? "";
}
