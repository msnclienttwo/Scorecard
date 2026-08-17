import { describe, expect, it, afterEach, beforeEach } from "vitest";
import {
  detectHighlightEvent,
  computeHighlightExpiry,
  getHighlightConfig,
} from "@/lib/video/highlights";
import type { Ball, Innings } from "@prisma/client";

function fakeBall(overrides: Partial<Ball> = {}): Ball {
  return {
    id: "b1",
    inningsId: "i1",
    overId: "o1",
    ballNumber: 25,
    isWicket: false,
    wicketType: null,
    runs: 0,
    isLegal: true,
    isNoBall: false,
    isWide: false,
    isByes: false,
    isLegByes: false,
    ballResult: null,
    batsmanId: null,
    bowlerId: null,
    nonStrikerId: null,
    wicketPlayerId: null,
    fielderIds: [],
    dismissalType: null,
    shotType: null,
    placementZone: null,
    createdAt: new Date(),
    ...overrides,
  } as Ball;
}

function fakeInnings(): Innings {
  return {
    id: "i1",
    matchId: "m1",
    inningsNumber: 1,
    battingTeamId: "t1",
    bowlingTeamId: "t2",
    totalRuns: 0,
    totalWickets: 0,
    totalExtras: 0,
    overs: 0,
    legalDeliveries: 0,
    inningsStarted: false,
    inningsEnded: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Innings;
}

describe("detectHighlightEvent", () => {
  it("detects FOUR from runs", () => {
    expect(detectHighlightEvent(fakeBall({ runs: 4 }))).toBe("FOUR");
  });
  it("detects SIX from runs", () => {
    expect(detectHighlightEvent(fakeBall({ runs: 6 }))).toBe("SIX");
  });
  it("detects WICKET ahead of runs", () => {
    expect(detectHighlightEvent(fakeBall({ runs: 6, isWicket: true }))).toBe("WICKET");
  });
  it("returns null for a dot ball", () => {
    expect(detectHighlightEvent(fakeBall())).toBeNull();
  });
});

describe("computeHighlightExpiry", () => {
  it("adds retention hours to the given time", () => {
    const now = new Date("2026-08-14T12:00:00Z");
    const expiry = computeHighlightExpiry(now, 12);
    expect(expiry.toISOString()).toBe("2026-08-15T00:00:00.000Z");
  });
  it("uses the configured retention hours by default", () => {
    process.env.VIDEO_HIGHLIGHT_RETENTION_HOURS = "24";
    const now = new Date("2026-08-14T12:00:00Z");
    expect(computeHighlightExpiry(now, 24).toISOString()).toBe("2026-08-15T12:00:00.000Z");
    delete process.env.VIDEO_HIGHLIGHT_RETENTION_HOURS;
  });
});

describe("getHighlightConfig", () => {
  const KEYS = [
    "VIDEO_HIGHLIGHT_PRE_ROLL_SECONDS",
    "VIDEO_HIGHLIGHT_POST_ROLL_SECONDS",
    "VIDEO_HIGHLIGHT_RETENTION_HOURS",
    "HIGHLIGHT_PRE_ROLL_SECONDS",
    "HIGHLIGHT_POST_ROLL_SECONDS",
  ] as const;

  beforeEach(() => {
    for (const k of KEYS) delete process.env[k];
  });

  afterEach(() => {
    for (const k of KEYS) delete process.env[k];
  });

  it("uses sane defaults", () => {
    const cfg = getHighlightConfig();
    expect(cfg).toEqual({ preRollSeconds: 10, postRollSeconds: 5, retentionHours: 12 });
  });

  it("reads the VIDEO_HIGHLIGHT_* names", () => {
    process.env.VIDEO_HIGHLIGHT_PRE_ROLL_SECONDS = "8";
    process.env.VIDEO_HIGHLIGHT_POST_ROLL_SECONDS = "4";
    process.env.VIDEO_HIGHLIGHT_RETENTION_HOURS = "48";
    expect(getHighlightConfig()).toEqual({
      preRollSeconds: 8,
      postRollSeconds: 4,
      retentionHours: 48,
    });
  });

  it("falls back to legacy HIGHLIGHT_* names", () => {
    process.env.HIGHLIGHT_PRE_ROLL_SECONDS = "12";
    process.env.HIGHLIGHT_POST_ROLL_SECONDS = "3";
    expect(getHighlightConfig().preRollSeconds).toBe(12);
    expect(getHighlightConfig().postRollSeconds).toBe(3);
  });

  it("clamps out-of-range values", () => {
    process.env.VIDEO_HIGHLIGHT_PRE_ROLL_SECONDS = "200";
    process.env.VIDEO_HIGHLIGHT_RETENTION_HOURS = "9999";
    const cfg = getHighlightConfig();
    expect(cfg.preRollSeconds).toBe(60);
    expect(cfg.retentionHours).toBe(7 * 24);
  });
});
