import { describe, expect, it } from "vitest";
import {
  classifyShotLocation,
  normalizeFieldPoint,
  svgFromNormalized,
  bandForDistance,
  flipBattingEnd,
  zoneForAngleBand,
  type BattingEnd,
} from "@/lib/fieldGeometry";

const RHB = { handedness: "RIGHT" as const, battingEnd: "BOTTOM" as const };
const LHB = { handedness: "LEFT" as const, battingEnd: "BOTTOM" as const };
const TOP_RHB = { handedness: "RIGHT" as const, battingEnd: "TOP" as const };
const TOP_LHB = { handedness: "LEFT" as const, battingEnd: "TOP" as const };

describe("classifyShotLocation — right-handed batter, bottom end", () => {
  it("maps the deep left-centre to DEEP COVER", () => {
    const p = classifyShotLocation(5, 50, RHB);
    expect(p.zone).toBe("DEEP_COVER");
    expect(p.band).toBe("DEEP");
    expect(p.angle).toBeGreaterThan(0);
  });

  it("mirrors to DEEP MIDWICKET for a left-hander", () => {
    const p = classifyShotLocation(5, 50, LHB);
    expect(p.zone).toBe("DEEP_MIDWICKET");
    expect(p.angle).toBeLessThan(0);
  });

  it("classifies a wide-behind-square tap as third man", () => {
    const p = classifyShotLocation(40, 97, RHB);
    expect(p.zone).toBe("DEEP_THIRD_MAN");
    expect(Math.abs(p.angle)).toBeGreaterThan(125);
  });

  it("maps the top-centre to STRAIGHT deep", () => {
    const p = classifyShotLocation(50, 15, RHB);
    expect(p.zone).toBe("STRAIGHT");
    expect(p.band).toBe("DEEP");
    expect(Math.abs(p.angle)).toBeLessThan(10);
  });

  it("maps upper off-side to MID_OFF outfield", () => {
    const p = classifyShotLocation(40, 30, RHB);
    expect(p.zone).toBe("MID_OFF");
    expect(p.band).toBe("OUTFIELD");
  });

  it("maps the right mid circle to MIDWICKET outfield", () => {
    const p = classifyShotLocation(75, 55, RHB);
    expect(p.zone).toBe("MIDWICKET");
    expect(p.band).toBe("OUTFIELD");
  });

  it("maps deep right-centre to DEEP_MIDWICKET", () => {
    const p = classifyShotLocation(95, 50, RHB);
    expect(p.zone).toBe("DEEP_MIDWICKET");
    expect(p.band).toBe("DEEP");
  });

  it("maps low-right deep square to DEEP_SQUARE_LEG", () => {
    const p = classifyShotLocation(90, 70, RHB);
    expect(p.zone).toBe("DEEP_SQUARE_LEG");
  });

  it("maps a tap close to the striker into the close-catching ring", () => {
    const p = classifyShotLocation(45, 72, RHB);
    expect(p.band).toBe("CLOSE");
    expect(p.zone).toBe("SHORT_COVER");
  });
});

describe("classifyShotLocation — batting-end rotation", () => {
  it("rotates cover from bottom-left to top-right when the striker is at the top end", () => {
    const bottom = classifyShotLocation(5, 50, RHB);
    const top = classifyShotLocation(95, 50, TOP_RHB);
    expect(top.zone).toBe(bottom.zone);
    expect(top.zone).toBe("DEEP_COVER");
    expect(top.band).toBe("DEEP");
  });

  it("keeps left-hand mirroring under top-end rotation", () => {
    const top = classifyShotLocation(95, 50, TOP_LHB);
    expect(top.zone).toBe("DEEP_MIDWICKET");
    expect(top.angle).toBeLessThan(0);
  });
});

describe("bandForDistance + zoneForAngleBand", () => {
  it("returns band thresholds", () => {
    expect(bandForDistance(0.1)).toBe("CLOSE");
    expect(bandForDistance(0.3)).toBe("INNER");
    expect(bandForDistance(0.6)).toBe("OUTFIELD");
    expect(bandForDistance(0.9)).toBe("DEEP");
  });

  it("uses different zones per band along the same angle", () => {
    expect(zoneForAngleBand(65, "CLOSE")).toBe("SHORT_COVER");
    expect(zoneForAngleBand(65, "INNER")).toBe("COVER");
    expect(zoneForAngleBand(65, "OUTFIELD")).toBe("COVER");
    expect(zoneForAngleBand(65, "DEEP")).toBe("DEEP_COVER");
  });
});

describe("coordinate round-trip", () => {
  it("reconstructs the original tap position from normalized coordinates", () => {
    for (const [x, y, opts] of [
      [5, 50, RHB],
      [40, 90, RHB],
      [75, 55, RHB],
      [95, 50, TOP_LHB],
      [50, 15, TOP_RHB],
    ] as const) {
      const norm = normalizeFieldPoint(x, y, opts);
      const back = svgFromNormalized(norm.x, norm.y, opts);
      expect(back.svgX).toBeCloseTo(x, 3);
      expect(back.svgY).toBeCloseTo(y, 3);
    }
  });

  it("normalized coordinates are unit-distance aware", () => {
    const p = classifyShotLocation(40, 30, RHB);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(p.distance, 5);
    expect(p.distance).toBeGreaterThan(0);
    expect(p.distance).toBeLessThanOrEqual(1);
  });
});

describe("flipBattingEnd", () => {
  it("toggles between TOP and BOTTOM", () => {
    expect(flipBattingEnd("TOP" as BattingEnd)).toBe("BOTTOM");
    expect(flipBattingEnd("BOTTOM" as BattingEnd)).toBe("TOP");
  });
});
