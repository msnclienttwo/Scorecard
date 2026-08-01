"use client";

import { cn, formatOvers } from "@/lib/utils";
import type { InningsDetail, MatchDetail } from "@/hooks/useMatchLive";

function Chip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "accent" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums",
        tone === "neutral" && "bg-white/5 text-muted",
        tone === "accent" && "bg-accent/15 text-accent",
        tone === "warning" && "bg-warning/15 text-warning"
      )}
    >
      {label}
    </span>
  );
}

function StatusBadge({
  status,
  isPaused,
}: {
  status: string;
  isPaused: boolean;
}) {
  if (isPaused && status === "LIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
        Paused
      </span>
    );
  }
  const styles: Record<string, string> = {
    SCHEDULED: "bg-accent/15 text-accent",
    READY: "bg-warning/15 text-warning",
    LIVE: "bg-success/15 text-success",
    INNINGS_BREAK: "bg-warning/15 text-warning",
    COMPLETED: "bg-primary/15 text-primary",
    ARCHIVED: "bg-white/10 text-muted",
    ABANDONED: "bg-danger/15 text-danger",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        styles[status] ?? "bg-white/10 text-muted"
      )}
    >
      {status === "LIVE" && (
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
      )}
      {status.replace(/_/g, " ")}
    </span>
  );
}

interface ScoreboardProps {
  match: MatchDetail;
  currentInnings: InningsDetail | null;
  legalBalls: number;
  crr: string;
  requiredRunRate: string | null;
  onSetup?: () => void;
  showSetupButton?: boolean;
}

export function Scoreboard({
  match,
  currentInnings,
  legalBalls,
  crr,
  requiredRunRate,
  onSetup,
  showSetupButton,
}: ScoreboardProps) {
  const battingTeamId = currentInnings?.battingTeam ?? match.homeTeamId;
  const battingTeam =
    battingTeamId === match.homeTeamId ? match.homeTeam : match.awayTeam;
  const bowlingTeam =
    battingTeamId === match.homeTeamId ? match.awayTeam : match.homeTeam;

  const runs = currentInnings?.totalRuns ?? 0;
  const wickets = currentInnings?.totalWickets ?? 0;
  const overs = formatOvers(legalBalls);
  const target = currentInnings?.targetScore ?? null;
  const ballsLeft = match.totalOvers * 6 - legalBalls;
  const needed = target != null ? target - runs : null;

  return (
    <div className="border-b border-white/10 bg-[#0a0f1a]/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-3 py-2.5 md:px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] text-muted">
              {match.name} · {match.format}
            </p>
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-white">
                {battingTeam.name}
              </span>
              <span className="text-xl font-extrabold tabular-nums text-white">
                {runs}/{wickets}
              </span>
              <span className="text-sm text-muted tabular-nums">
                ({overs} ov)
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {showSetupButton && onSetup && (
              <button
                onClick={onSetup}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/15"
              >
                Set Openers
              </button>
            )}
            <StatusBadge status={match.status} isPaused={match.isPaused} />
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Chip label={`CRR ${crr}`} />
          {target != null &&
            (needed != null && needed > 0 ? (
              <Chip tone="accent" label={`Need ${needed} off ${Math.max(ballsLeft, 0)}`} />
            ) : (
              <Chip tone="accent" label={`Target ${target}`} />
            ))}
          {requiredRunRate && <Chip tone="warning" label={`RRR ${requiredRunRate}`} />}
          <Chip label={`Extras ${currentInnings?.extras ?? 0}`} />
          <span className="ml-auto hidden text-[11px] text-muted sm:block">
            vs {bowlingTeam.name}
          </span>
        </div>
      </div>
    </div>
  );
}
