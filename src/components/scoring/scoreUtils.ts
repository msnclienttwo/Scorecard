import type { BallRef } from "@/hooks/useMatchLive";

export const WICKET_TYPES = [
  { value: "BOWLED", label: "Bowled" },
  { value: "CAUGHT", label: "Caught" },
  { value: "LBW", label: "LBW" },
  { value: "STUMPED", label: "Stumped" },
  { value: "RUN_OUT", label: "Run Out" },
  { value: "HIT_WICKET", label: "Hit Wicket" },
  { value: "OBSTRUCTING_FIELD", label: "Obstructing" },
  { value: "RETIRED_HURT", label: "Retired Hurt" },
  { value: "TIMED_OUT", label: "Timed Out" },
] as const;

export type WicketTypeValue = (typeof WICKET_TYPES)[number]["value"];

export const EXTRA_TYPES = [
  { value: "WIDE", label: "Wide" },
  { value: "NO_BALL", label: "No Ball" },
  { value: "BYE", label: "Bye" },
  { value: "LEG_BYE", label: "Leg Bye" },
] as const;

export function getBallColor(
  ball: Pick<BallRef, "isWicket" | "extraType" | "runs" | "isExtra">
): string {
  if (ball.isWicket) return "bg-danger text-white";
  if (ball.extraType === "WIDE") return "bg-warning text-black";
  if (ball.extraType === "NO_BALL") return "bg-orange-500 text-white";
  if (ball.extraType === "BYE" || ball.extraType === "LEG_BYE")
    return "bg-white/15 text-white";
  if (ball.runs === 6) return "bg-accent text-black";
  if (ball.runs === 4) return "bg-primary text-white";
  if (ball.runs === 0 && !ball.isExtra) return "bg-white/10 text-muted";
  return "bg-success/20 text-success";
}

export function getBallDisplay(
  ball: Pick<BallRef, "isWicket" | "extraType" | "runs">
): string {
  if (ball.isWicket) return "W";
  if (ball.extraType === "WIDE") return "WD";
  if (ball.extraType === "NO_BALL") return "NB";
  if (ball.extraType === "BYE") return "B";
  if (ball.extraType === "LEG_BYE") return "LB";
  return String(ball.runs);
}

export function formatBallSummary(ball: BallRef): string {
  const total = ball.runs + ball.extraRuns;
  if (ball.isWicket) return "Wicket";
  if (ball.extraType === "WIDE") return total > 1 ? `${total} wides` : "Wide";
  if (ball.extraType === "NO_BALL")
    return ball.runs > 0 ? `No ball + ${ball.runs}` : "No ball";
  if (ball.extraType === "BYE") return `${total} byes`;
  if (ball.extraType === "LEG_BYE") return `${total} leg byes`;
  if (ball.runs === 0) return "Dot ball";
  return `${ball.runs} run${ball.runs > 1 ? "s" : ""}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
