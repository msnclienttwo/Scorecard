import {
  getZone,
  parseFieldPositions,
  shotLabel,
  zoneLabel,
} from "@/lib/advancedScoring";
import { bandForDistance } from "@/lib/fieldGeometry";

export interface CommentaryBallContext {
  runs: number;
  extraRuns: number;
  extraType?: string | null;
  isWicket: boolean;
  wicketType?: string | null;
  ballResult?: string | null;
  shotType?: string | null;
  placementZone?: string | null;
  /** Normalized 0..1 distance of the placement tap (see fieldGeometry). */
  placementDistance?: number | null;
  fieldPositions?: string | null;
  isFreeHit: boolean;
  isOverthrow: boolean;
}

export interface DeterministicContext {
  ball: CommentaryBallContext;
  striker: string;
  bowler: string;
  fielder?: string;
  overNumber?: number;
  ballNumber?: number;
  inningsNumber?: number;
  matchFormat?: string;
  currentRuns?: number;
  currentWickets?: number;
  target?: number | null;
  overRuns?: number;
}

function zoneOf(ctx: DeterministicContext): string {
  return zoneLabel(ctx.ball.placementZone);
}

function shotOf(ctx: DeterministicContext): string {
  return ctx.ball.shotType ?? "";
}

function shotWords(ctx: DeterministicContext): string {
  const label = shotLabel(ctx.ball.shotType);
  return label ? label.toLowerCase() : "";
}

function boundarySuffix(ctx: DeterministicContext): string {
  if (ctx.ball.isOverthrow) return " (overthrow)";
  return "";
}

function chaseState(ctx: DeterministicContext): string {
  if (
    ctx.target == null ||
    ctx.currentRuns == null ||
    ctx.currentWickets == null
  ) {
    return "";
  }
  if (ctx.target - ctx.currentRuns === 1) return " One to win!";
  if (ctx.target - ctx.currentRuns === 2) return " Two needed for victory.";
  if (ctx.currentRuns >= ctx.target) return " That's the winning hit!";
  return "";
}

// ---------------------------------------------------------------------------
// Wicket lines
// ---------------------------------------------------------------------------

function wicketLine(ctx: DeterministicContext): string {
  const type = ctx.ball.wicketType;
  const striker = ctx.striker;
  const bowler = ctx.bowler;
  const fielder = ctx.fielder;

  switch (type) {
    case "BOWLED":
      return `OUT! ${striker} is castled by ${bowler}. Timber!`;
    case "CAUGHT":
      return `OUT! Caught${fielder ? ` beautifully by ${fielder}` : " in the deep"}! ${bowler} strikes.`;
    case "LBW":
      return `OUT! Trapped plumb LBW by ${bowler}. Big appeal, finger goes up.`;
    case "STUMPED":
      return `OUT! Stumped${fielder ? ` by ${fielder}` : ""}! ${bowler} foxes ${striker}.`;
    case "RUN_OUT":
      return `OUT! Run out${fielder ? ` by ${fielder}` : ""}! A direct hit.`;
    case "HIT_WICKET":
      return `OUT! Hit wicket! ${striker} steps back onto the stumps.`;
    case "RETIRED_HURT":
      return `${striker} has to retire hurt.`;
    case "TIMED_OUT":
      return `OUT! Timed out. Unusual dismissal.`;
    case "OBSTRUCTING_FIELD":
      return `OUT! Obstructing the field. Rare dismissal for ${striker}.`;
    default:
      return `OUT! ${striker} departs${bowler ? `, bowled by ${bowler}` : ""}.`;
  }
}

// ---------------------------------------------------------------------------
// Boundary lines (FOUR / SIX)
// ---------------------------------------------------------------------------

const FOUR_PHRASES: Record<string, (ctx: DeterministicContext, zone: string) => string> = {
  DRIVE: (ctx, zone) =>
    zone
      ? `Glorious ${shotWords(ctx)} through ${zone}! The ball races to the boundary.`
      : `Glorious ${shotWords(ctx)} from ${ctx.striker}! Boundary.`,
  CUT: (ctx, zone) =>
    `Superb ${shotWords(ctx)}${zone ? ` through ${zone}` : ""}! No fielder could get there.`,
  PULL: (ctx, zone) =>
    `Pulled away${zone ? ` through ${zone}` : ""} with immense power! Four more.`,
  HOOK: (ctx, zone) =>
    `Hooked viciously${zone ? ` over ${zone}` : ""} for a boundary!`,
  SWEEP: (ctx, zone) =>
    `Swept${zone ? ` into ${zone}` : ""} hard and fine for a boundary.`,
  LOFTED: (ctx, zone) =>
    `Lofted cleanly${zone ? ` over ${zone}` : ""} and it crashes into the fence.`,
  FLICK: (ctx, zone) =>
    `Flicked off the pads${zone ? ` through ${zone}` : ""}! Beautiful placement for four.`,
  NUDGE: (ctx, zone) =>
    `Nudged away${zone ? ` past ${zone}` : ""} and it beats the chase. Four runs.`,
  UPPER: (ctx, zone) =>
    `Upper cut${zone ? ` over ${zone}` : ""}! It flies away to the boundary.`,
  REVERSE: (ctx, zone) =>
    `Reverse swept${zone ? ` to ${zone}` : ""}! Brilliant innovation, four runs.`,
};

const SIX_PHRASES: Record<string, (ctx: DeterministicContext, zone: string) => string> = {
  LOFTED: (ctx, zone) =>
    `Landed${zone ? ` over ${zone}` : ""} — MAXIMUM! Clean strike from ${ctx.striker}.`,
  PULL: (ctx, zone) =>
    `Pulled magnificently${zone ? ` over ${zone}` : ""}! SIX!`,
  HOOK: (ctx, zone) =>
    `Hooked over the rope${zone ? ` at ${zone}` : ""}! Huge hit.`,
  SWEEP: (ctx, zone) =>
    `Swept flat${zone ? ` over ${zone}` : ""} for a maximum!`,
  DRIVE: (ctx, zone) =>
    `Driven out of the ground${zone ? ` over ${zone}` : ""}! SIX!`,
  UPPER: (ctx, zone) =>
    `Upper cut${zone ? ` over ${zone}` : ""} and it's gone all the way! SIX!`,
  REVERSE: (ctx) => `Reverse paddled over the keeper for a maximum!`,
  FLICK: (ctx, zone) =>
    `Flicked over the boundary${zone ? ` at ${zone}` : ""}! SIX runs!`,
};

function boundaryLine(ctx: DeterministicContext): string {
  const isSix = ctx.ball.runs === 6;
  const zone = zoneOf(ctx);
  const phraseMap = isSix ? SIX_PHRASES : FOUR_PHRASES;
  const phrase = phraseMap[shotOf(ctx)];
  const body = phrase ? phrase(ctx, zone) : null;

  if (body) return `${isSix ? "SIX!" : "FOUR!"} ${body}${boundarySuffix(ctx)}${chaseState(ctx)}`;

  if (isSix) {
    return `SIX! ${ctx.striker} launches it over the ropes${zone ? ` into ${zone}` : ""}.${boundarySuffix(ctx)}${chaseState(ctx)}`;
  }
  return `FOUR! ${ctx.striker} finds the boundary${zone ? ` through ${zone}` : ""}.${boundarySuffix(ctx)}${chaseState(ctx)}`;
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export function buildDeterministicCommentary(ctx: DeterministicContext): string {
  const { ball, striker, bowler } = ctx;
  const runs = ball.runs + ball.extraRuns;
  const extraType = ball.extraType;
  const zone = zoneOf(ctx);

  if (ball.isWicket) {
    return wicketLine(ctx);
  }

  if (extraType === "WIDE") {
    const extra = ball.extraRuns - 1;
    const wides = ball.extraRuns;
    return `Too wide outside off, the umpire signals wide${wides > 1 ? ` and ${extra} run${extra > 1 ? "s" : ""} added` : ""}.`;
  }

  if (extraType === "NO_BALL") {
    if (ball.isFreeHit) {
      return ball.runs > 0
        ? `Free hit! ${striker} scores ${ball.runs} run${ball.runs > 1 ? "s" : ""}.`
        : `Free hit and ${striker} can't take advantage — dot ball.`;
    }
    return ball.runs > 0
      ? `No ball! ${striker} cashes in with ${ball.runs} run${ball.runs > 1 ? "s" : ""}.`
      : `No ball called${zone ? `, ${zone}` : ""}.`;
  }

  if (extraType === "BYE") {
    return `Byes ${runs} — the keeper can't gather it.`;
  }

  if (extraType === "LEG_BYE") {
    return `Leg byes ${runs}.`;
  }

  if (runs === 4 || runs === 6) {
    return boundaryLine(ctx);
  }

  if (runs === 0) {
    const shot = shotWords(ctx);
    if (shot === "defensive") return `Solid defence${zone ? ` to ${zone}` : ""}. No run.`;
    if (shot === "drive") return `Driven firmly${zone ? ` into ${zone}` : ""} but the fielder cuts it off. No run.`;
    if (shot === "cut") return `Cut hard${zone ? ` to ${zone}` : ""} — straight to the fielder. Dot.`;
    return `Dot ball, well bowled by ${bowler}.`;
  }

  if (runs === 1) {
    if (shotOf(ctx) === "NUDGE") return `Softly nudged${zone ? ` into ${zone}` : ""} for a quick single.`;
    if (zone) return `Worked into ${zone} for one.`;
    return `${striker} takes a single${zone ? ` through ${zone}` : ""}.`;
  }

  if (runs === 2) {
    if (zone) return `Pushed into ${zone} for a couple.`;
    return `${striker} scores a couple of runs.`;
  }

  if (runs === 3) {
    if (zone) return `Driven ${zone} — ${striker} scurries three runs!`;
    return `${striker} takes three runs.`;
  }

  return `${striker} scores ${runs} runs.`;
}

// ---------------------------------------------------------------------------
// Context helpers used by the studio / AI route
// ---------------------------------------------------------------------------

export function fieldPositionsLabel(ctx: CommentaryBallContext): string {
  const codes = parseFieldPositions(ctx.fieldPositions);
  if (codes.length === 0) return "";
  return codes.join(", ");
}

export function describeBallContext(ctx: DeterministicContext): string {
  const parts: string[] = [];
  if (ctx.ball.shotType) parts.push(`shot: ${shotLabel(ctx.ball.shotType).toLowerCase()}`);
  if (ctx.ball.placementZone) {
    let placement = `placement: ${zoneLabel(ctx.ball.placementZone).toLowerCase()}`;
    if (typeof ctx.ball.placementDistance === "number") {
      const band = bandForDistance(ctx.ball.placementDistance);
      placement += ` (${band === "CLOSE" ? "close catching" : band === "INNER" ? "inner ring" : band === "OUTFIELD" ? "outfield" : "deep boundary"})`;
      placement += `, depth ${ctx.ball.placementDistance.toFixed(2)} of boundary`;
    }
    parts.push(placement);
  }
  const field = fieldPositionsLabel(ctx.ball);
  if (field) parts.push(`field placement: ${field.toLowerCase()}`);
  if (ctx.ball.isFreeHit) parts.push("free hit");
  if (ctx.ball.isOverthrow) parts.push("overthrow");
  if (ctx.ball.isWicket) parts.push(`wicket type: ${(ctx.ball.wicketType ?? "unknown").replace(/_/g, " ").toLowerCase()}`);
  return parts.join(", ");
}

export function overLabel(overNumber?: number, ballNumber?: number): string {
  if (overNumber != null && ballNumber != null) {
    return `${overNumber}.${((ballNumber - 1) % 6) + 1}`;
  }
  if (overNumber != null) return `${overNumber}`;
  return "";
}
