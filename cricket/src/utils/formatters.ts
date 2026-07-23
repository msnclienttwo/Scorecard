export function formatScore(runs: number, wickets: number): string {
  return `${runs}/${wickets}`;
}

export function formatOversDisplay(totalBalls: number): string {
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  if (balls === 0) {
    return overs === 1 ? "1 over" : `${overs} overs`;
  }
  return `${overs}.${balls}`;
}

export function formatOversFull(totalBalls: number): string {
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${overs}.${balls} ov`;
}

export function formatBalls(balls: number): string {
  const overs = Math.floor(balls / 6);
  const remaining = balls % 6;
  return `${overs}.${remaining}`;
}

export function calculateRequiredRunRate(
  target: number,
  currentScore: number,
  totalBalls: number,
  maxOvers: number
): number {
  const ballsBowled = totalBalls;
  const totalBallsInInnings = maxOvers * 6;
  const ballsRemaining = totalBallsInInnings - ballsBowled;
  const runsRequired = target - currentScore;

  if (ballsRemaining <= 0 || runsRequired <= 0) return 0;
  return (runsRequired / ballsRemaining) * 6;
}

export function calculateNetRunRate(
  runsFor: number,
  oversFor: number,
  runsAgainst: number,
  oversAgainst: number
): number {
  if (oversFor === 0 || oversAgainst === 0) return 0;
  const runRateFor = runsFor / oversFor;
  const runRateAgainst = runsAgainst / oversAgainst;
  return Math.round((runRateFor - runRateAgainst) * 1000) / 1000;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}

export function formatRunsDisplay(
  runs: number,
  balls: number,
  fours: number,
  sixes: number
): string {
  const sr = balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";
  return `${runs}(${balls}b ${fours}x4 ${sixes}x6 SR:${sr})`;
}

export function formatBowlingFigure(
  overs: number,
  maidens: number,
  runs: number,
  wickets: number
): string {
  return `${overs}-${maidens}-${runs}-${wickets}`;
}

export function formatOversBowled(balls: number): string {
  const overs = Math.floor(balls / 6);
  const remaining = balls % 6;
  if (remaining === 0) return overs.toString();
  return `${overs}.${remaining}`;
}

export function calculateProjectedScore(
  currentRuns: number,
  currentBalls: number,
  totalBalls: number
): number {
  if (currentBalls === 0) return 0;
  return Math.round((currentRuns / currentBalls) * totalBalls);
}

export function formatMatchTime(
  scheduledAt: string | Date,
  status: string
): string {
  if (status === "LIVE") return "LIVE";
  if (status === "COMPLETED") return "Finished";

  const date =
    typeof scheduledAt === "string" ? new Date(scheduledAt) : scheduledAt;
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}
