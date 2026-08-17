import prisma from "@/lib/prisma";
import type { AuthPayload } from "@/lib/auth";
import {
  notifyInningsEnded,
  notifyMatchCompleted,
  notifyMatchStarted,
  type MatchNotificationContext,
} from "@/lib/notifications";
import { buildDeterministicCommentary } from "@/lib/commentaryTemplates";
import { maybeAutoGenerateAICommentary } from "@/lib/aiCommentary";
import { maybeAutoRecordHighlight } from "@/lib/video/highlights";
import { getSignalingServerUrl } from "@/lib/video/signaling-url";
import { Prisma } from "@prisma/client";
import type {
  Ball,
  BallType,
  Innings,
  Match,
  Over,
  TossDecision,
  WicketType,
} from "@prisma/client";

type MatchWithTeams = Pick<Match, "id" | "name" | "homeTeamId" | "awayTeamId"> & {
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
};

const MAX_WICKETS = 10;

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------

export interface ScoringAccess {
  allowed: boolean;
  reason?: string;
  isAdmin: boolean;
  isCreator: boolean;
  isAssigned: boolean;
  hasAssignedScorers: boolean;
}

export function getScoringAccess(
  match: { createdBy: string; matchScorers: { userId: string }[] },
  user?: Pick<AuthPayload, "sub" | "role"> | null
): ScoringAccess {
  if (!user) {
    return {
      allowed: false,
      reason: "Authentication required.",
      isAdmin: false,
      isCreator: false,
      isAssigned: false,
      hasAssignedScorers: (match.matchScorers?.length ?? 0) > 0,
    };
  }

  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "TOURNAMENT_ADMIN";
  const scorerIds = (match.matchScorers ?? []).map((s) => s.userId);
  const hasAssignedScorers = scorerIds.length > 0;
  const isAssigned = scorerIds.includes(user.sub);
  const isCreator = match.createdBy === user.sub;
  const allowed = isAdmin || (hasAssignedScorers ? isAssigned : isCreator);

  return {
    allowed,
    isAdmin,
    isCreator,
    isAssigned,
    hasAssignedScorers,
    reason: allowed
      ? undefined
      : hasAssignedScorers
        ? "Only assigned scorers and admins can score this match."
        : "Only the match creator can score this match.",
  };
}

export async function requireScorerMatch(matchId: string, user: AuthPayload) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      matchScorers: true,
      homeTeam: { select: { id: true, name: true, shortName: true } },
      awayTeam: { select: { id: true, name: true, shortName: true } },
    },
  });
  if (!match) throw new Error("Match not found");
  const access = getScoringAccess(match, user);
  if (!access.allowed) throw new Error(access.reason);
  return match;
}

function notifContext(match: {
  id: string;
  name: string;
  createdBy: string;
  matchScorers: { userId: string }[];
}): MatchNotificationContext {
  return {
    matchId: match.id,
    matchName: match.name,
    creatorId: match.createdBy,
    scorerIds: match.matchScorers.map((s) => s.userId),
  };
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

export function isLegalDelivery(extraType?: BallType | null): boolean {
  return extraType !== "WIDE" && extraType !== "NO_BALL";
}

export function parseOversToBalls(overs: number): number {
  const full = Math.floor(overs);
  const rem = Math.round((overs - full) * 10);
  return full * 6 + rem;
}

export function formatOversFromBalls(balls: number): number {
  return Math.floor(balls / 6) + (balls % 6) / 10;
}

export function emitToMatch(matchId: string, event: string, data: Record<string, unknown>): void {
  try {
    const io = (global as unknown as {
      io?: { to: (room: string) => { emit: (e: string, d: unknown) => void } };
    }).io;
    if (io) {
      io.to(`match:${matchId}`).emit(event, { matchId, ...data });
      return;
    }
  } catch {
    // local io unavailable — try relay
  }

  // Serverless fallback: forward to the standalone signaling server.
  const signalingUrl = getSignalingServerUrl();
  if (signalingUrl && typeof globalThis.fetch === "function") {
    const relaySecret = process.env.SIGNALING_RELAY_SECRET || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (relaySecret) headers["Authorization"] = `Bearer ${relaySecret}`;
    globalThis
      .fetch(`${signalingUrl}/relay`, {
        method: "POST",
        headers,
        body: JSON.stringify({ room: `match:${matchId}`, event, data: { matchId, ...data } }),
        signal: AbortSignal.timeout(3000),
      })
      .catch(() => {});
  }
}

// Single consistent scoring event contract. Every ball mutation (record,
// edit, undo, delete) emits exactly this event with enough information for
// any subscribed client to identify matchId + inningsId + ball and refetch.
export function emitScoringUpdate(
  matchId: string,
  data: { inningsId: string; ball: Ball }
): void {
  emitToMatch(matchId, "score:updated", data);
}

function mapBallResult(runs: number, extraType: BallType | null): Ball["ballResult"] {
  if (extraType === "WIDE") return "WIDE";
  if (extraType === "NO_BALL") return "NO_BALL";
  if (extraType === "BYE") return "BYE";
  if (extraType === "LEG_BYE") return "LEG_BYE";
  if (runs === 0) return "DOT";
  if (runs === 1) return "ONE";
  if (runs === 2) return "TWO";
  if (runs === 3) return "THREE";
  if (runs === 4) return "FOUR";
  if (runs === 6) return "SIX";
  return "DOT";
}

// ---------------------------------------------------------------------------
// Lifecycle transitions
// ---------------------------------------------------------------------------

export async function startMatch(matchId: string, user: AuthPayload) {
  const match = await requireScorerMatch(matchId, user);

  if (match.status !== "SCHEDULED") {
    throw new Error("Only scheduled matches can be started.");
  }
  if (!match.tossWinner || !match.tossDecision) {
    throw new Error("Set the toss result before starting the match.");
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { status: "READY" },
  });

  await prisma.matchEvent.create({
    data: {
      matchId,
      type: "MATCH_READY",
      description: "The match is ready to begin.",
      data: { by: user.sub },
    },
  });

  emitToMatch(matchId, "match:updated", { status: updated.status });
  return updated;
}

export async function startInnings(matchId: string, user: AuthPayload) {
  const match = await requireScorerMatch(matchId, user);

  if (match.status !== "READY" && match.status !== "INNINGS_BREAK") {
    throw new Error("The match must be ready or in the innings break to start an innings.");
  }

  const inningsCount = await prisma.innings.count({ where: { matchId } });
  if (inningsCount >= 2) {
    throw new Error("This match already has two completed innings.");
  }

  const innings1 = inningsCount === 1
    ? await prisma.innings.findFirst({ where: { matchId, inningsNumber: 1 } })
    : null;

  const [homeTeam, awayTeam] = await Promise.all([
    prisma.team.findUnique({ where: { id: match.homeTeamId }, select: { id: true, name: true } }),
    prisma.team.findUnique({ where: { id: match.awayTeamId }, select: { id: true, name: true } }),
  ]);
  if (!homeTeam || !awayTeam) throw new Error("Teams not found.");

  let battingTeamId: string;
  if (inningsCount === 0) {
    if (match.tossWinner && match.tossDecision) {
      battingTeamId =
        match.tossDecision === "BAT"
          ? match.tossWinner
          : match.tossWinner === match.homeTeamId
            ? match.awayTeamId
            : match.homeTeamId;
    } else {
      battingTeamId = match.homeTeamId;
    }
  } else if (innings1) {
    battingTeamId = innings1.battingTeam === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
  } else {
    throw new Error("Could not determine the batting team.");
  }

  const bowlingTeamId = battingTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
  const inningsNumber = inningsCount + 1;
  const targetScore = innings1 ? innings1.totalRuns + 1 : null;

  const innings = await prisma.$transaction(async (tx) => {
    const created = await tx.innings.create({
      data: {
        matchId,
        inningsNumber,
        battingTeam: battingTeamId,
        bowlingTeam: bowlingTeamId,
        targetScore,
      },
    });

    await tx.match.update({
      where: { id: matchId },
      data: { status: "LIVE", startedAt: match.startedAt ?? new Date(), isPaused: false },
    });

    return created;
  });

  const battingName = battingTeamId === match.homeTeamId ? homeTeam.name : awayTeam.name;
  const bowlingName = bowlingTeamId === match.homeTeamId ? homeTeam.name : awayTeam.name;

  await prisma.matchEvent.create({
    data: {
      matchId,
      type: "INNINGS_STARTED",
      description: `Innings ${inningsNumber}: ${battingName} are batting.`,
      inningsNumber,
      data: { battingTeam: battingTeamId, bowlingTeam: bowlingTeamId, targetScore },
    },
  });

  await prisma.commentary.create({
    data: {
      matchId,
      inningsNumber,
      isAutomatic: true,
      isHighlight: true,
      eventType: "INNINGS_START",
      content:
        inningsNumber === 1
          ? `${battingName} to bat first against ${bowlingName}.`
          : `Chase time! ${battingName} need ${targetScore} runs to win.`,
    },
  });

  if (inningsNumber === 1) {
    try {
      await notifyMatchStarted(notifContext(match));
    } catch (e) {
      console.error("Error creating match-started notification:", e);
    }
  }

  emitToMatch(matchId, "innings:started", { innings, inningsNumber });
  emitToMatch(matchId, "match:updated", { status: "LIVE" });
  return innings;
}

export async function endInnings(matchId: string, user: AuthPayload) {
  const match = await requireScorerMatch(matchId, user);

  if (match.status !== "LIVE") {
    throw new Error("The match is not in progress.");
  }

  const innings = await prisma.innings.findFirst({
    where: { matchId, endedAt: null },
    orderBy: { inningsNumber: "desc" },
  });
  if (!innings) throw new Error("No active innings to end.");

  await prisma.$transaction(async (tx) => {
    await tx.innings.update({
      where: { id: innings.id },
      data: { endedAt: new Date() },
    });
    await finalizeInnings(tx, matchId, innings);
  });

  if (innings.inningsNumber === 1) {
    try {
      await notifyInningsEnded(notifContext(match), 1);
    } catch (e) {
      console.error("Error creating innings-break notification:", e);
    }
  } else {
    const updatedMatch = await prisma.match.findUnique({ where: { id: matchId } });
    if (updatedMatch?.status === "COMPLETED") {
      try {
        await notifyMatchCompleted(notifContext(match), updatedMatch.result);
      } catch (e) {
        console.error("Error creating match-completed notification:", e);
      }
    }
  }

  emitToMatch(matchId, "innings:ended", { inningsNumber: innings.inningsNumber });
  emitToMatch(matchId, "match:updated", {});
  return innings;
}

export async function finishMatch(
  matchId: string,
  user: AuthPayload,
  input: { winningTeamId?: string | null; result?: string | null } = {}
) {
  const match = await requireScorerMatch(matchId, user);

  if (match.status !== "LIVE") {
    throw new Error("Only a live match can be finished.");
  }

  const [innings1, innings2] = await Promise.all([
    prisma.innings.findFirst({ where: { matchId, inningsNumber: 1 } }),
    prisma.innings.findFirst({ where: { matchId, inningsNumber: 2 } }),
  ]);

  let result = input.result;
  let winningTeamId = input.winningTeamId;

  if (innings1 && innings2 && !result) {
    const computed = computeResult(match, innings1, innings2);
    result = computed.result;
    winningTeamId = computed.winningTeamId;
  }

  if (!result) {
    throw new Error("A result is required to finish the match.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedMatch = await tx.match.update({
      where: { id: matchId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        result,
        winningTeamId: winningTeamId ?? null,
        isPaused: false,
      },
    });

    if (innings2) {
      await tx.innings.update({ where: { id: innings2.id }, data: { endedAt: new Date() } });
    }

    await tx.matchEvent.create({
      data: {
        matchId,
        type: "MATCH_COMPLETED",
        description: result,
        data: { winningTeamId, result },
      },
    });

    await tx.commentary.create({
      data: {
        matchId,
        isAutomatic: true,
        isHighlight: true,
        eventType: "RESULT",
        content: result,
      },
    });

    return updatedMatch;
  });

  try {
    await notifyMatchCompleted(notifContext(match), result);
  } catch (e) {
    console.error("Error creating match-completed notification:", e);
  }

  emitToMatch(matchId, "match:completed", { result, winningTeamId });
  emitToMatch(matchId, "match:updated", { status: "COMPLETED", result });
  return updated;
}

export async function archiveMatch(matchId: string, user: AuthPayload) {
  const match = await requireScorerMatch(matchId, user);

  if (match.status !== "COMPLETED") {
    throw new Error("Only completed matches can be archived.");
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { status: "ARCHIVED" },
  });

  await prisma.matchEvent.create({
    data: {
      matchId,
      type: "MATCH_ARCHIVED",
      description: "This match has been archived.",
      data: { by: user.sub },
    },
  });

  emitToMatch(matchId, "match:updated", { status: "ARCHIVED" });
  return updated;
}

export async function setToss(
  matchId: string,
  user: AuthPayload,
  input: { tossWinner: string; tossDecision: TossDecision }
) {
  const match = await requireScorerMatch(matchId, user);

  if (match.status !== "SCHEDULED" && match.status !== "READY") {
    throw new Error("The toss can only be set before play begins.");
  }
  if (input.tossWinner !== match.homeTeamId && input.tossWinner !== match.awayTeamId) {
    throw new Error("The toss winner must be one of the two teams playing.");
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { tossWinner: input.tossWinner, tossDecision: input.tossDecision },
  });

  await prisma.matchEvent.create({
    data: {
      matchId,
      type: "TOSS",
      description:
        input.tossDecision === "BAT"
          ? "won the toss and elected to bat."
          : "won the toss and elected to bowl.",
      data: { tossWinner: input.tossWinner, tossDecision: input.tossDecision },
    },
  });

  emitToMatch(matchId, "match:updated", { toss: true });
  return updated;
}

// ---------------------------------------------------------------------------
// Match controls
// ---------------------------------------------------------------------------

async function matchControl(matchId: string, user: AuthPayload, action: string) {
  const match = await requireScorerMatch(matchId, user);

  if (match.status === "COMPLETED" || match.status === "ARCHIVED") {
    throw new Error("This match has already finished.");
  }

  const updates: { isPaused?: boolean } = {};
  const eventMap: Record<string, { type: string; description: string }> = {
    pause: { type: "MATCH_PAUSED", description: "The match has been paused." },
    resume: { type: "MATCH_RESUMED", description: "The match has resumed." },
    "rain-delay": { type: "RAIN_DELAY", description: "Rain delay — play has been suspended." },
    "drinks-break": { type: "DRINKS_BREAK", description: "Drinks break." },
  };

  if (action === "pause" || action === "rain-delay") updates.isPaused = true;
  if (action === "resume") updates.isPaused = false;

  const event = eventMap[action];
  const updated = await prisma.match.update({ where: { id: matchId }, data: updates });

  if (event) {
    await prisma.matchEvent.create({
      data: { matchId, type: event.type, description: event.description, data: { by: user.sub } },
    });
  }

  emitToMatch(matchId, "match:updated", { action });
  return updated;
}

export function pauseMatch(matchId: string, user: AuthPayload) {
  return matchControl(matchId, user, "pause");
}

export function resumeMatch(matchId: string, user: AuthPayload) {
  return matchControl(matchId, user, "resume");
}

export function rainDelay(matchId: string, user: AuthPayload) {
  return matchControl(matchId, user, "rain-delay");
}

export function drinksBreak(matchId: string, user: AuthPayload) {
  return matchControl(matchId, user, "drinks-break");
}

// ---------------------------------------------------------------------------
// Ball recording
// ---------------------------------------------------------------------------

export interface BallInput {
  inningsId: string;
  batsmanId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs?: number;
  extraType?: BallType | null;
  extraRuns?: number;
  isWicket?: boolean;
  wicketType?: WicketType | null;
  dismissedPlayerId?: string | null;
  fielderId?: string | null;
  description?: string | null;
  shotType?: string | null;
  placementZone?: string | null;
  /** Normalized batter-relative placement coordinates (see fieldGeometry). */
  placementX?: number | null;
  placementY?: number | null;
  placementAngle?: number | null;
  placementDistance?: number | null;
  /** Physical end the striker faces from: "TOP" | "BOTTOM". */
  strikerEnd?: string | null;
  fieldPositions?: string | null;
  isFreeHit?: boolean;
  isOverthrow?: boolean;
}

async function assertPlayersInTeam(
  tx: Prisma.TransactionClient,
  match: Match,
  innings: Innings
) {
  const [battingSquad, bowlingSquad] = await Promise.all([
    tx.matchPlayer.findMany({
      where: { matchId: match.id, teamId: innings.battingTeam },
      select: { playerId: true },
    }),
    tx.matchPlayer.findMany({
      where: { matchId: match.id, teamId: innings.bowlingTeam },
      select: { playerId: true },
    }),
  ]);

  const batIds = new Set(battingSquad.map((s) => s.playerId));
  const bowlIds = new Set(bowlingSquad.map((s) => s.playerId));

  const inBattingTeam = async (playerId: string) => {
    if (batIds.size > 0) return batIds.has(playerId);
    const p = await tx.player.findFirst({ where: { id: playerId, teamId: innings.battingTeam } });
    return !!p;
  };
  const inBowlingTeam = async (playerId: string) => {
    if (bowlIds.size > 0) return bowlIds.has(playerId);
    const p = await tx.player.findFirst({ where: { id: playerId, teamId: innings.bowlingTeam } });
    return !!p;
  };

  return { inBattingTeam, inBowlingTeam };
}

async function validateBallPlayers(
  tx: Prisma.TransactionClient,
  match: Match,
  innings: Innings,
  input: BallInput,
  opts: { checkConsecutiveBowler?: boolean; checkBowler?: boolean } = {}
) {
  const { inBattingTeam, inBowlingTeam } = await assertPlayersInTeam(tx, match, innings);

  const [batsmanOk, nonStrikerOk] = await Promise.all([
    inBattingTeam(input.batsmanId),
    inBattingTeam(input.nonStrikerId),
  ]);

  if (!batsmanOk || !nonStrikerOk) {
    throw new Error("Both batsmen must belong to the batting team.");
  }
  if (input.batsmanId === input.nonStrikerId) {
    throw new Error("The striker and non-striker must be different players.");
  }

  if (opts.checkBowler ?? true) {
    const bowlerOk = await inBowlingTeam(input.bowlerId);
    if (!bowlerOk) throw new Error("The bowler must belong to the bowling team.");
    if (
      input.batsmanId === input.bowlerId ||
      input.nonStrikerId === input.bowlerId
    ) {
      throw new Error("Batsmen and bowler must be different players.");
    }

    if (opts.checkConsecutiveBowler ?? true) {
      const lastOver = await tx.over.findFirst({
        where: { inningsId: innings.id },
        orderBy: { overNumber: "desc" },
      });
      if (lastOver && lastOver.isCompleted && lastOver.bowlerId === input.bowlerId) {
        throw new Error("A bowler cannot bowl two consecutive overs.");
      }
    }
  }

  const dismissedCount = await tx.battingScorecard.count({
    where: {
      inningsId: innings.id,
      playerId: { in: [input.batsmanId, input.nonStrikerId] },
      isNotOut: false,
    },
  });
  if (dismissedCount > 0) {
    throw new Error("One of the selected batsmen is already out.");
  }
}

async function getOrCreateOverForBall(
  tx: Prisma.TransactionClient,
  innings: Innings,
  legalBallsBefore: number,
  bowlerId: string
) {
  const overIndex = Math.floor(legalBallsBefore / 6);
  const overNumber = overIndex + 1;

  const existing = await tx.over.findFirst({ where: { inningsId: innings.id, overNumber } });
  if (existing) return existing;

  try {
    return await tx.over.create({
      data: {
        inningsId: innings.id,
        overNumber,
        bowlerId,
        totalRuns: 0,
        totalWickets: 0,
        ballsCount: 0,
        extras: 0,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const raced = await tx.over.findFirst({ where: { inningsId: innings.id, overNumber } });
      if (raced) return raced;
    }
    throw err;
  }
}

export async function recordBall(
  matchId: string,
  user: AuthPayload,
  input: BallInput
): Promise<{ ball: Ball; innings: Innings; detail: InningsDetailPayload | null }> {
  const match = await requireScorerMatch(matchId, user);

  if (match.status !== "LIVE") {
    throw new Error("The match is not in progress.");
  }
  if (match.isPaused) {
    throw new Error("The match is paused. Resume play before scoring.");
  }

  const innings = await prisma.innings.findUnique({ where: { id: input.inningsId } });
  if (!innings || innings.matchId !== matchId) {
    throw new Error("Invalid innings for this match.");
  }
  if (innings.endedAt) {
    throw new Error("This innings has already ended.");
  }

  const runs = input.runs ?? 0;
  const extraType = input.extraType ?? null;
  const extraRuns = input.extraRuns ?? 0;
  const isWicket = input.isWicket ?? false;
  const legal = isLegalDelivery(extraType);

  if ((extraType === "WIDE" || extraType === "NO_BALL") && extraRuns < 1) {
    throw new Error("A wide or no-ball must carry at least one run.");
  }

  const legalBalls = await prisma.ball.count({
    where: {
      inningsId: innings.id,
      OR: [{ extraType: null }, { extraType: { notIn: ["WIDE", "NO_BALL"] } }],
    },
  });

  if (legalBalls >= match.totalOvers * 6) {
    throw new Error("Overs are complete for this innings.");
  }
  if (innings.totalWickets >= MAX_WICKETS) {
    throw new Error("All wickets are down for this innings.");
  }

  // A delivery bowled immediately after a no-ball is a free hit.
  const previousBall = await prisma.ball.findFirst({
    where: { inningsId: innings.id },
    orderBy: { ballNumber: "desc" },
    select: { extraType: true },
  });
  const isFreeHit = input.isFreeHit ?? previousBall?.extraType === "NO_BALL";

  const result = await prisma.$transaction(async (tx) => {
    await validateBallPlayers(tx, match, innings, input);

    const over = await getOrCreateOverForBall(tx, innings, legalBalls, input.bowlerId);
    const totalBalls = await tx.ball.count({ where: { inningsId: innings.id } });

    const ball = await tx.ball.create({
      data: {
        inningsId: innings.id,
        overId: over.id,
        ballNumber: totalBalls + 1,
        bowlerId: input.bowlerId,
        batsmanId: input.batsmanId,
        nonStrikerId: input.nonStrikerId,
        runs,
        isExtra: extraType !== null,
        extraType,
        extraRuns: extraType !== null ? extraRuns : 0,
        isWicket,
        wicketType: isWicket ? input.wicketType ?? null : null,
        dismissedPlayerId: isWicket ? input.dismissedPlayerId ?? input.batsmanId : null,
        fielderId: input.fielderId ?? null,
        description: input.description ?? null,
        ballResult: mapBallResult(runs, extraType),
        shotType: input.shotType ?? null,
        placementZone: input.placementZone ?? null,
        placementX: input.placementX ?? null,
        placementY: input.placementY ?? null,
        placementAngle: input.placementAngle ?? null,
        placementDistance: input.placementDistance ?? null,
        strikerEnd: input.strikerEnd ?? innings.strikerEnd ?? "BOTTOM",
        fieldPositions: input.fieldPositions ?? null,
        isFreeHit,
        isOverthrow: input.isOverthrow ?? false,
        recordedById: user.sub,
      },
    });

    // Normal ball entry uses the incremental fast path (O(1) per delivery)
    // instead of rebuilding every derived row from the full ball record.
    await applyBallIncremental(tx, match, innings, ball, legalBalls, over);
    return ball;
  });

  const detail = await getInningsDetail(innings.id);
  const updatedInnings = detail;

  // fire notifications if the ball ended the innings / match
  if (updatedInnings?.endedAt) {
    const freshMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: { matchScorers: true },
    });
    if (freshMatch) {
      if (freshMatch.status === "INNINGS_BREAK") {
        try {
          await notifyInningsEnded(notifContext(freshMatch), 1);
        } catch (e) {
          console.error("Error creating innings-break notification:", e);
        }
      } else if (freshMatch.status === "COMPLETED") {
        try {
          await notifyMatchCompleted(notifContext(freshMatch), freshMatch.result);
        } catch (e) {
          console.error("Error creating match-completed notification:", e);
        }
      }
    }
  }

  if (updatedInnings) {
    emitScoringUpdate(matchId, { inningsId: innings.id, ball: result });
  }

  // Fire-and-forget AI commentary generation. Never blocks score entry and
  // never surfaces errors to the scorer — the background job is self-contained.
  void maybeAutoGenerateAICommentary(matchId, result.id, user.sub);

  // Fire-and-forget automatic highlight clipping (FOUR/SIX/WICKET) — runs
  // detached exactly like AI commentary so scoring can never be held up or
  // rolled back by video processing.
  void maybeAutoRecordHighlight(matchId, result.id);

  return { ball: result, innings: updatedInnings!, detail };
}

async function revertMatchCompletion(match: Match) {
  await prisma.match.update({
    where: { id: match.id },
    data: {
      status: "LIVE",
      isPaused: false,
      completedAt: match.status === "COMPLETED" ? null : undefined,
      result: match.status === "COMPLETED" ? null : undefined,
      winningTeamId: match.status === "COMPLETED" ? null : undefined,
    },
  });
}

export async function undoLastBall(
  matchId: string,
  user: AuthPayload
): Promise<{ ball: Ball; innings: Innings | null; detail: InningsDetailPayload | null }> {
  const match = await requireScorerMatch(matchId, user);

  const innings = await prisma.innings.findFirst({
    where: { matchId },
    orderBy: { inningsNumber: "desc" },
  });
  if (!innings) throw new Error("No innings found.");

  const lastBall = await prisma.ball.findFirst({
    where: { inningsId: innings.id },
    orderBy: { ballNumber: "desc" },
  });
  if (!lastBall) throw new Error("No balls to undo.");

  await prisma.$transaction(async (tx) => {
    await tx.ball.delete({ where: { id: lastBall.id } });
    await tx.commentary.deleteMany({ where: { ballId: lastBall.id } });
    await tx.innings.update({ where: { id: innings.id }, data: { endedAt: null } });
    await tx.match.update({
      where: { id: matchId },
      data: {
        status: "LIVE",
        isPaused: false,
        completedAt: null,
        result: null,
        winningTeamId: null,
      },
    });
    await recomputeInnings(tx, innings.id, match);
  });

  const updatedInnings = await prisma.innings.findUnique({ where: { id: innings.id } });
  const detail = updatedInnings ? await getInningsDetail(innings.id) : null;

  emitScoringUpdate(matchId, { inningsId: innings.id, ball: lastBall });
  emitToMatch(matchId, "match:updated", {});
  return { ball: lastBall, innings: updatedInnings, detail };
}

export async function editBall(
  matchId: string,
  user: AuthPayload,
  ballId: string,
  patch: Partial<BallInput>
): Promise<{ ball: Ball; innings: Innings | null; detail: InningsDetailPayload | null }> {
  const match = await requireScorerMatch(matchId, user);

  const existing = await prisma.ball.findUnique({ where: { id: ballId } });
  if (!existing) throw new Error("Ball not found.");

  const innings = await prisma.innings.findUnique({ where: { id: existing.inningsId } });
  if (!innings || innings.matchId !== matchId) throw new Error("Invalid ball for this match.");

  await prisma.$transaction(async (tx) => {
    const runs = patch.runs ?? existing.runs;
    const extraType = patch.extraType === undefined ? existing.extraType : patch.extraType;
    const extraRuns = patch.extraRuns ?? existing.extraRuns;
    const isWicket = patch.isWicket ?? existing.isWicket;
    const batsmanId = patch.batsmanId ?? existing.batsmanId;
    const nonStrikerId = patch.nonStrikerId ?? existing.nonStrikerId;
    const bowlerId = patch.bowlerId ?? existing.bowlerId;

    await tx.ball.update({
      where: { id: ballId },
      data: {
        batsmanId,
        nonStrikerId,
        bowlerId,
        runs,
        isExtra: extraType !== null,
        extraType,
        extraRuns: extraType !== null ? extraRuns : 0,
        isWicket,
        wicketType: isWicket ? patch.wicketType ?? existing.wicketType : null,
        dismissedPlayerId: isWicket
          ? patch.dismissedPlayerId ?? existing.dismissedPlayerId ?? batsmanId
          : null,
        fielderId: patch.fielderId === undefined ? existing.fielderId : patch.fielderId,
        description: patch.description === undefined ? existing.description : patch.description,
        ballResult: mapBallResult(runs, extraType),
        shotType: patch.shotType === undefined ? existing.shotType : patch.shotType,
        placementZone:
          patch.placementZone === undefined
            ? existing.placementZone
            : patch.placementZone,
        placementX:
          patch.placementX === undefined ? existing.placementX : patch.placementX,
        placementY:
          patch.placementY === undefined ? existing.placementY : patch.placementY,
        placementAngle:
          patch.placementAngle === undefined
            ? existing.placementAngle
            : patch.placementAngle,
        placementDistance:
          patch.placementDistance === undefined
            ? existing.placementDistance
            : patch.placementDistance,
        strikerEnd:
          patch.strikerEnd === undefined ? existing.strikerEnd : patch.strikerEnd,
        fieldPositions:
          patch.fieldPositions === undefined
            ? existing.fieldPositions
            : patch.fieldPositions,
        isFreeHit:
          patch.isFreeHit === undefined ? existing.isFreeHit : patch.isFreeHit,
        isOverthrow:
          patch.isOverthrow === undefined
            ? existing.isOverthrow
            : patch.isOverthrow,
        updatedById: user.sub,
      },
    });

    // The delivery changed, so any commentary (deterministic, AI or manual)
    // linked to it is stale. Deterministic rows are rebuilt by recompute.
    await tx.commentary.deleteMany({ where: { ballId } });

    await recomputeInnings(tx, innings.id, match);
  });

  const updatedBall = await prisma.ball.findUnique({ where: { id: ballId } });
  const updatedInnings = await prisma.innings.findUnique({ where: { id: innings.id } });
  const detail = updatedInnings ? await getInningsDetail(innings.id) : null;

  emitScoringUpdate(matchId, { inningsId: innings.id, ball: updatedBall ?? existing });

  // The delivery changed, so any AI line for it was removed above. Regenerate
  // it in the background so the commentary matches the edited ball. Never
  // blocks the edit and never surfaces errors to the scorer.
  void maybeAutoGenerateAICommentary(matchId, ballId, user.sub);

  return { ball: updatedBall ?? existing, innings: updatedInnings, detail };
}

export async function deleteBall(
  matchId: string,
  user: AuthPayload,
  ballId: string
): Promise<{ ball: Ball; innings: Innings | null; detail: InningsDetailPayload | null }> {
  const match = await requireScorerMatch(matchId, user);

  const existing = await prisma.ball.findUnique({ where: { id: ballId } });
  if (!existing) throw new Error("Ball not found.");

  const innings = await prisma.innings.findUnique({ where: { id: existing.inningsId } });
  if (!innings || innings.matchId !== matchId) throw new Error("Invalid ball for this match.");

  await prisma.$transaction(async (tx) => {
    await tx.ball.delete({ where: { id: ballId } });
    await tx.commentary.deleteMany({ where: { ballId } });
    await tx.innings.update({ where: { id: innings.id }, data: { endedAt: null } });
    await tx.match.update({
      where: { id: matchId },
      data: {
        status: "LIVE",
        isPaused: false,
        completedAt: null,
        result: null,
        winningTeamId: null,
      },
    });
    await recomputeInnings(tx, innings.id, match);
  });

  const updatedInnings = await prisma.innings.findUnique({ where: { id: innings.id } });
  const detail = updatedInnings ? await getInningsDetail(innings.id) : null;

  emitScoringUpdate(matchId, { inningsId: innings.id, ball: existing });
  return { ball: existing, innings: updatedInnings, detail };
}

// ---------------------------------------------------------------------------
// Live state helpers
// ---------------------------------------------------------------------------

async function activeInnings(matchId: string) {
  return prisma.innings.findFirst({
    where: { matchId, endedAt: null },
    orderBy: { inningsNumber: "desc" },
  });
}

// Authoritative, fully-hydrated innings used to seed the React Query cache
// from mutation responses. Overs are explicitly ordered by overNumber ASC and
// balls by ballNumber ASC so the current/latest over is deterministic.
export async function getInningsDetail(inningsId: string) {
  return prisma.innings.findUnique({
    where: { id: inningsId },
    include: {
      battingCard: {
        include: { player: { select: { id: true, name: true } } },
        orderBy: { runs: "desc" },
      },
      bowlingCard: {
        include: { player: { select: { id: true, name: true } } },
        orderBy: { wickets: "desc" },
      },
      overs: {
        orderBy: { overNumber: "asc" },
        include: {
          balls: { orderBy: { ballNumber: "asc" }, include: { over: true } },
        },
      },
      fallOfWickets: { orderBy: { wicketNumber: "asc" } },
    },
  });
}

export type InningsDetailPayload = NonNullable<
  Awaited<ReturnType<typeof getInningsDetail>>
>;

export async function setOpeners(
  matchId: string,
  user: AuthPayload,
  input: { strikerId: string; nonStrikerId: string; bowlerId: string }
) {
  const match = await requireScorerMatch(matchId, user);
  if (match.status !== "LIVE") throw new Error("The match is not live.");

  const innings = await activeInnings(matchId);
  if (!innings) throw new Error("No active innings.");
  const ballCount = await prisma.ball.count({ where: { inningsId: innings.id } });
  if (ballCount > 0) {
    throw new Error("Openers can only be selected before the first ball.");
  }

  await validateBallPlayers(prisma, match, innings, {
    inningsId: innings.id,
    batsmanId: input.strikerId,
    nonStrikerId: input.nonStrikerId,
    bowlerId: input.bowlerId,
  });

  const updated = await prisma.innings.update({
    where: { id: innings.id },
    data: {
      strikerId: input.strikerId,
      nonStrikerId: input.nonStrikerId,
      currentBowlerId: input.bowlerId,
      battingOrderCount: 2,
    },
  });

  emitToMatch(matchId, "innings:updated", { innings: updated });
  return updated;
}

export async function setBowler(matchId: string, user: AuthPayload, bowlerId: string) {
  const match = await requireScorerMatch(matchId, user);
  if (match.status !== "LIVE") throw new Error("The match is not live.");

  const innings = await activeInnings(matchId);
  if (!innings) throw new Error("No active innings.");

  const { inBowlingTeam } = await assertPlayersInTeam(prisma, match, innings);
  if (!(await inBowlingTeam(bowlerId))) {
    throw new Error("The bowler must belong to the bowling team.");
  }

  const lastOver = await prisma.over.findFirst({
    where: { inningsId: innings.id },
    orderBy: { overNumber: "desc" },
  });
  if (lastOver && lastOver.isCompleted && lastOver.bowlerId === bowlerId) {
    throw new Error("A bowler cannot bowl two consecutive overs.");
  }

  const updated = await prisma.innings.update({
    where: { id: innings.id },
    data: { currentBowlerId: bowlerId },
  });

  emitToMatch(matchId, "innings:updated", { innings: updated });
  return updated;
}

export async function setBatsmen(
  matchId: string,
  user: AuthPayload,
  input: { strikerId: string; nonStrikerId: string }
) {
  const match = await requireScorerMatch(matchId, user);
  if (match.status !== "LIVE") throw new Error("The match is not live.");

  const innings = await activeInnings(matchId);
  if (!innings) throw new Error("No active innings.");

  const { inBattingTeam } = await assertPlayersInTeam(prisma, match, innings);
  if (!(await inBattingTeam(input.strikerId)) || !(await inBattingTeam(input.nonStrikerId))) {
    throw new Error("Both batsmen must belong to the batting team.");
  }
  if (input.strikerId === input.nonStrikerId) {
    throw new Error("The striker and non-striker must be different players.");
  }

  const updated = await prisma.innings.update({
    where: { id: innings.id },
    data: { strikerId: input.strikerId, nonStrikerId: input.nonStrikerId },
  });

  emitToMatch(matchId, "innings:updated", { innings: updated });
  return updated;
}

export async function swapStrike(matchId: string, user: AuthPayload) {
  const match = await requireScorerMatch(matchId, user);
  if (match.status !== "LIVE") throw new Error("The match is not live.");

  const innings = await activeInnings(matchId);
  if (!innings) throw new Error("No active innings.");
  if (!innings.strikerId || !innings.nonStrikerId) throw new Error("Both batsmen must be set.");

  const updated = await prisma.innings.update({
    where: { id: innings.id },
    data: { strikerId: innings.nonStrikerId, nonStrikerId: innings.strikerId },
  });

  emitToMatch(matchId, "strike:swapped", { innings: updated });
  return updated;
}

// ---------------------------------------------------------------------------
// Incremental ball application — O(1) fast path for recordBall
// ---------------------------------------------------------------------------

/**
 * Applies the derived-state deltas for a single newly created delivery without
 * replaying the whole innings. Every aggregate here mirrors what
 * `recomputeInnings` produces, so the incremental and full-rebuild paths stay
 * consistent. Undo / edit / delete still call `recomputeInnings`.
 */
async function applyBallIncremental(
  tx: Prisma.TransactionClient,
  match: Pick<Match, "id" | "totalOvers" | "format">,
  innings: Innings,
  ball: Ball,
  legalBallsBefore: number,
  over: Over
) {
  const legal = isLegalDelivery(ball.extraType);
  const newLegalCount = legalBallsBefore + (legal ? 1 : 0);
  const overComplete = legal && legalBallsBefore % 6 === 5;
  const outId = ball.isWicket ? ball.dismissedPlayerId ?? ball.batsmanId : null;

  // --- over aggregate ---
  const newOverBalls = over.ballsCount + (legal ? 1 : 0);
  const newOverRuns = over.totalRuns + ball.runs + ball.extraRuns;
  const newOverWickets = over.totalWickets + (ball.isWicket ? 1 : 0);
  const newOverCompleted = newOverBalls >= 6;
  const newOverIsMaiden = newOverCompleted && newOverRuns === 0 && newOverWickets === 0;
  const overCompletedNow = !over.isCompleted && newOverCompleted;

  await tx.over.update({
    where: { id: over.id },
    data: {
      totalRuns: newOverRuns,
      totalWickets: newOverWickets,
      ballsCount: newOverBalls,
      extras: over.extras + ball.extraRuns,
      isCompleted: newOverCompleted,
      isMaiden: newOverIsMaiden,
    },
  });

  // --- player names for commentary + fall of wicket (single lookup) ---
  const nameIds = [
    ...new Set([
      ball.batsmanId,
      ball.bowlerId,
      ...(ball.fielderId ? [ball.fielderId] : []),
      ...(outId ? [outId] : []),
    ]),
  ];
  const named = await tx.player.findMany({
    where: { id: { in: nameIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(named.map((p) => [p.id, p.name]));

  // --- batting cards ---
  const batPlayerIds = [
    ...new Set([ball.batsmanId, ball.nonStrikerId, ...(outId ? [outId] : [])]),
  ];
  const existingBat = await tx.battingScorecard.findMany({
    where: { inningsId: innings.id, playerId: { in: batPlayerIds } },
    select: {
      playerId: true,
      batPosition: true,
      runs: true,
      balls: true,
      fours: true,
      sixes: true,
    },
  });
  const batById = new Map(existingBat.map((c) => [c.playerId, c]));
  let battingOrder = innings.battingOrderCount;
  const nextBatPosition = () => ++battingOrder;

  // Runs credited to the striker on this delivery (drives the batting card,
  // fours/sixes and milestone detection). Mirrors recomputeInnings exactly.
  const batRuns =
    ball.extraType === "NO_BALL"
      ? ball.runs
      : ball.extraType === "BYE" ||
          ball.extraType === "LEG_BYE" ||
          ball.extraType === "WIDE"
        ? 0
        : ball.runs;

  for (const pid of batPlayerIds) {
    const old = batById.get(pid);
    const isStriker = pid === ball.batsmanId;
    const runs = (old?.runs ?? 0) + (isStriker ? batRuns : 0);
    const ballsFaced =
      (old?.balls ?? 0) + (isStriker && legal && ball.extraType !== "NO_BALL" ? 1 : 0);
    const fours = (old?.fours ?? 0) + (isStriker && batRuns === 4 ? 1 : 0);
    const sixes = (old?.sixes ?? 0) + (isStriker && batRuns === 6 ? 1 : 0);
    const isDismissed = outId === pid;
    const batPosition = old?.batPosition ?? nextBatPosition();
    const isNotOut = !isDismissed;

    await tx.battingScorecard.upsert({
      where: { inningsId_playerId: { inningsId: innings.id, playerId: pid } },
      update: {
        runs,
        balls: ballsFaced,
        fours,
        sixes,
        isNotOut,
        battingOrder: batPosition,
        strikeRate:
          ballsFaced > 0 ? parseFloat(((runs / ballsFaced) * 100).toFixed(2)) : 0,
        ...(isDismissed
          ? {
              dismissalType: ball.wicketType ?? null,
              bowlerId: ball.bowlerId,
              fielderId: ball.fielderId ?? null,
            }
          : {}),
      },
      create: {
        inningsId: innings.id,
        playerId: pid,
        batPosition,
        runs,
        balls: ballsFaced,
        fours,
        sixes,
        isNotOut,
        dismissalType: isDismissed ? ball.wicketType ?? null : null,
        bowlerId: isDismissed ? ball.bowlerId : null,
        fielderId: isDismissed ? ball.fielderId ?? null : null,
        strikeRate:
          ballsFaced > 0 ? parseFloat(((runs / ballsFaced) * 100).toFixed(2)) : 0,
        battingOrder: batPosition,
      },
    });
  }

  // --- bowling card ---
  const existingBowl = await tx.bowlingScorecard.findUnique({
    where: { inningsId_playerId: { inningsId: innings.id, playerId: ball.bowlerId } },
  });
  const bowlBalls =
    (existingBowl ? parseOversToBalls(existingBowl.overs) : 0) + (legal ? 1 : 0);
  const bowlRuns = (existingBowl?.runs ?? 0) + ball.runs + ball.extraRuns;
  const bowlWickets = (existingBowl?.wickets ?? 0) + (ball.isWicket ? 1 : 0);
  const bowlWides = (existingBowl?.wides ?? 0) + (ball.extraType === "WIDE" ? 1 : 0);
  const bowlNoBalls = (existingBowl?.noBalls ?? 0) + (ball.extraType === "NO_BALL" ? 1 : 0);
  const bowlDotBalls =
    (existingBowl?.dotBalls ?? 0) +
    (legal && ball.runs + ball.extraRuns === 0 && !ball.isWicket ? 1 : 0);
  const bowlMaidens =
    (existingBowl?.maidens ?? 0) + (overCompletedNow && newOverIsMaiden ? 1 : 0);
  const bowlOvers = formatOversFromBalls(bowlBalls);
  const bowlOversDecimal = bowlBalls / 6;
  const bowlEconomy = bowlOversDecimal > 0 ? parseFloat((bowlRuns / bowlOversDecimal).toFixed(2)) : 0;
  const bowlStrikeRate = bowlWickets > 0 ? parseFloat((bowlBalls / bowlWickets).toFixed(2)) : 0;

  await tx.bowlingScorecard.upsert({
    where: { inningsId_playerId: { inningsId: innings.id, playerId: ball.bowlerId } },
    update: {
      overs: bowlOvers,
      maidens: bowlMaidens,
      runs: bowlRuns,
      wickets: bowlWickets,
      wides: bowlWides,
      noBalls: bowlNoBalls,
      economy: bowlEconomy,
      strikeRate: bowlStrikeRate,
      dotBalls: bowlDotBalls,
    },
    create: {
      inningsId: innings.id,
      playerId: ball.bowlerId,
      overs: bowlOvers,
      maidens: bowlMaidens,
      runs: bowlRuns,
      wickets: bowlWickets,
      wides: bowlWides,
      noBalls: bowlNoBalls,
      economy: bowlEconomy,
      strikeRate: bowlStrikeRate,
      dotBalls: bowlDotBalls,
    },
  });

  // --- strike rotation + innings totals ---
  let strikerId = innings.strikerId;
  let nonStrikerId = innings.nonStrikerId;
  if (strikerId === null) strikerId = ball.batsmanId;
  if (nonStrikerId === null) nonStrikerId = ball.nonStrikerId;

  const completedRuns =
    ball.extraType === "BYE" || ball.extraType === "LEG_BYE"
      ? ball.extraRuns
      : ball.runs;

  if (ball.isWicket) {
    const remaining = outId === strikerId ? nonStrikerId : strikerId;
    if (remaining) strikerId = remaining;
    nonStrikerId = null;
  } else if (ball.extraType !== "WIDE" && completedRuns % 2 === 1 && nonStrikerId) {
    [strikerId, nonStrikerId] = [nonStrikerId, strikerId];
  }
  if (overComplete && strikerId && nonStrikerId) {
    [strikerId, nonStrikerId] = [nonStrikerId, strikerId];
  }

  // The physical end the striker faces from only changes when an over ends
  // (the next over is bowled from the opposite end). Run-scoring rotation
  // changes who stands at each end, not which end receives the ball.
  const currentStrikerEnd = innings.strikerEnd ?? "BOTTOM";
  const nextStrikerEnd = overComplete
    ? currentStrikerEnd === "TOP"
      ? "BOTTOM"
      : "TOP"
    : currentStrikerEnd;

  const newTotalRuns = innings.totalRuns + ball.runs + ball.extraRuns;
  const newTotalWickets = innings.totalWickets + (ball.isWicket ? 1 : 0);
  const newTotalOvers = formatOversFromBalls(newLegalCount);
  const newCurrentBowlerId = newLegalCount % 6 !== 0 ? ball.bowlerId : null;

  await tx.innings.update({
    where: { id: innings.id },
    data: {
      totalRuns: newTotalRuns,
      totalWickets: newTotalWickets,
      totalOvers: newTotalOvers,
      extras: innings.extras + ball.extraRuns,
      strikerId,
      nonStrikerId,
      currentBowlerId: newCurrentBowlerId,
      battingOrderCount: battingOrder,
      strikerEnd: nextStrikerEnd,
    },
  });

  // --- fall of wicket ---
  if (ball.isWicket) {
    await tx.fallOfWicket.create({
      data: {
        inningsId: innings.id,
        wicketNumber: newTotalWickets,
        playerId: outId!,
        runs: newTotalRuns,
        overs: newTotalOvers,
        bowlerId: ball.bowlerId,
        batterName: nameById.get(outId!) ?? "",
      },
    });
  }

  // --- commentary + highlights + milestones ---
  const strikerName = nameById.get(ball.batsmanId) ?? "Batter";
  const bowlerName = nameById.get(ball.bowlerId) ?? "Bowler";
  const fielderName = ball.fielderId ? nameById.get(ball.fielderId) : undefined;
  const overNumber = over.overNumber;
  const isHighlight = ball.isWicket || ball.runs === 4 || ball.runs === 6;
  const content = buildBallCommentary(ball, strikerName, bowlerName, fielderName, {
    overNumber,
    ballNumber: newLegalCount,
    inningsNumber: innings.inningsNumber,
    matchFormat: match.format,
    currentRuns: newTotalRuns,
    currentWickets: newTotalWickets,
    target: innings.targetScore,
  });

  await tx.commentary.create({
    data: {
      matchId: match.id,
      ballId: ball.id,
      inningsNumber: innings.inningsNumber,
      overNumber,
      ballNumber: newLegalCount,
      isAutomatic: true,
      isHighlight,
      eventType: ball.isWicket ? "WICKET" : ball.runs === 6 ? "SIX" : ball.runs === 4 ? "FOUR" : "BALL",
      generatedBy: "deterministic",
      content,
    },
  });

  if (isHighlight) {
    await tx.matchEvent.create({
      data: {
        matchId: match.id,
        type: ball.isWicket ? "WICKET" : ball.runs === 6 ? "SIX" : "BOUNDARY",
        description: content,
        overNumber,
        ballNumber: newLegalCount,
        inningsNumber: innings.inningsNumber,
        data: ball.isWicket ? { wicketType: ball.wicketType } : { runs: ball.runs },
      },
    });
  }

  // Milestones crossed by this delivery (fifty / century).
  const runsBeforeBall = batById.get(ball.batsmanId)?.runs ?? 0;
  const runsSoFar = runsBeforeBall + batRuns;
  if (runsSoFar >= 50 && runsBeforeBall < 50) {
    await tx.commentary.create({
      data: {
        matchId: match.id,
        ballId: ball.id,
        inningsNumber: innings.inningsNumber,
        overNumber,
        ballNumber: newLegalCount,
        isAutomatic: true,
        isHighlight: true,
        eventType: "MILESTONE",
        generatedBy: "deterministic",
        content: `${strikerName} brings up his fifty!`,
      },
    });
  }
  if (runsSoFar >= 100 && runsBeforeBall < 100) {
    await tx.commentary.create({
      data: {
        matchId: match.id,
        ballId: ball.id,
        inningsNumber: innings.inningsNumber,
        overNumber,
        ballNumber: newLegalCount,
        isAutomatic: true,
        isHighlight: true,
        eventType: "MILESTONE",
        generatedBy: "deterministic",
        content: `${strikerName} reaches a magnificent century!`,
      },
    });
  }
  if (ball.isWicket && bowlWickets === 5) {
    await tx.commentary.create({
      data: {
        matchId: match.id,
        ballId: ball.id,
        inningsNumber: innings.inningsNumber,
        overNumber,
        ballNumber: newLegalCount,
        isAutomatic: true,
        isHighlight: true,
        eventType: "MILESTONE",
        generatedBy: "deterministic",
        content: `${bowlerName} claims a five-wicket haul!`,
      },
    });
  }

  if (overComplete) {
    await tx.commentary.create({
      data: {
        matchId: match.id,
        inningsNumber: innings.inningsNumber,
        overNumber,
        isAutomatic: true,
        isHighlight: false,
        eventType: "END_OF_OVER",
        content: `End of over ${overNumber}: ${newOverRuns} runs.`,
      },
    });
  }

  // --- innings end detection (uses the post-ball totals) ---
  await finalizeInningsIfNeeded(tx, match, {
    ...innings,
    totalRuns: newTotalRuns,
    totalWickets: newTotalWickets,
    totalOvers: newTotalOvers,
  });
}

// ---------------------------------------------------------------------------
// Recompute — rebuild all derived state from the ball-by-ball record
// ---------------------------------------------------------------------------

const BALL_EVENT_TYPES = ["BALL", "WICKET", "BOUNDARY", "SIX", "MILESTONE"];

async function recomputeInnings(
  tx: Prisma.TransactionClient,
  inningsId: string,
  match: Pick<Match, "id" | "totalOvers" | "format">
) {
  const innings = await tx.innings.findUnique({ where: { id: inningsId } });
  if (!innings) throw new Error("Innings not found.");

  const balls = await tx.ball.findMany({
    where: { inningsId },
    orderBy: { ballNumber: "asc" },
  });

  // --- wipe derived data ---
  await tx.fallOfWicket.deleteMany({ where: { inningsId } });
  await tx.battingScorecard.deleteMany({ where: { inningsId } });
  await tx.bowlingScorecard.deleteMany({ where: { inningsId } });
  await tx.commentary.deleteMany({
    where: { matchId: match.id, inningsNumber: innings.inningsNumber, isAutomatic: true },
  });
  await tx.matchEvent.deleteMany({
    where: {
      matchId: match.id,
      inningsNumber: innings.inningsNumber,
      type: { in: BALL_EVENT_TYPES },
    },
  });

  const playerIds = [
    ...new Set(
      balls.flatMap((b) => [
        b.batsmanId,
        b.nonStrikerId,
        b.bowlerId,
        ...(b.fielderId ? [b.fielderId] : []),
        ...(b.dismissedPlayerId ? [b.dismissedPlayerId] : []),
      ])
    ),
  ];
  const players = playerIds.length
    ? await tx.player.findMany({ where: { id: { in: playerIds } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(players.map((p) => [p.id, p.name]));

  // --- pass 1: assign balls to overs ---
  let legalCount = 0;
  const overAggs = new Map<
    number,
    { bowlerId: string; runs: number; wickets: number; legalBalls: number; extras: number }
  >();

  for (const ball of balls) {
    const legal = isLegalDelivery(ball.extraType);
    const overIndex = Math.floor(legalCount / 6);
    const agg = overAggs.get(overIndex) ?? {
      bowlerId: ball.bowlerId,
      runs: 0,
      wickets: 0,
      legalBalls: 0,
      extras: 0,
    };
    agg.runs += ball.runs + ball.extraRuns;
    agg.wickets += ball.isWicket ? 1 : 0;
    agg.extras += ball.extraRuns;
    if (legal) {
      agg.legalBalls += 1;
      legalCount += 1;
    }
    overAggs.set(overIndex, agg);
  }

  const overIdByIndex = new Map<number, string>();
  for (const [index, agg] of overAggs) {
    const overNumber = index + 1;
    const completed = agg.legalBalls >= 6;
    const isMaiden = completed && agg.legalBalls === 6 && agg.runs === 0 && agg.wickets === 0;
    const over = await tx.over.upsert({
      where: { inningsId_overNumber: { inningsId, overNumber } },
      update: {
        bowlerId: agg.bowlerId,
        totalRuns: agg.runs,
        totalWickets: agg.wickets,
        ballsCount: agg.legalBalls,
        extras: agg.extras,
        isCompleted: completed,
        isMaiden,
      },
      create: {
        inningsId,
        overNumber,
        bowlerId: agg.bowlerId,
        totalRuns: agg.runs,
        totalWickets: agg.wickets,
        ballsCount: agg.legalBalls,
        extras: agg.extras,
        isCompleted: completed,
        isMaiden,
      },
    });
    overIdByIndex.set(index, over.id);
  }

  // --- re-link balls to their over ---
  legalCount = 0;
  for (const ball of balls) {
    const legal = isLegalDelivery(ball.extraType);
    const overId = overIdByIndex.get(Math.floor(legalCount / 6))!;
    if (ball.overId !== overId) {
      await tx.ball.update({ where: { id: ball.id }, data: { overId } });
    }
    if (legal) legalCount += 1;
  }

  const keptOverIds = [...overIdByIndex.values()];
  await tx.over.deleteMany({
    where: keptOverIds.length > 0 ? { inningsId, id: { notIn: keptOverIds } } : { inningsId },
  });

  // --- batting card ---
  const batting = new Map<
    string,
    {
      playerId: string;
      batPosition: number;
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      isNotOut: boolean;
      dismissalType: string | null;
      bowlerId: string | null;
      fielderId: string | null;
    }
  >();
  let order = 0;
  const ensureBatter = (pid: string) => {
    if (!batting.has(pid)) {
      order += 1;
      batting.set(pid, {
        playerId: pid,
        batPosition: order,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isNotOut: true,
        dismissalType: null,
        bowlerId: null,
        fielderId: null,
      });
    }
    return batting.get(pid)!;
  };

  for (const ball of balls) {
    ensureBatter(ball.batsmanId);
    ensureBatter(ball.nonStrikerId);

    const striker = batting.get(ball.batsmanId)!;
    const legal = isLegalDelivery(ball.extraType);

    if (ball.extraType === "NO_BALL") {
      striker.runs += ball.runs;
      if (ball.runs === 4) striker.fours += 1;
      if (ball.runs === 6) striker.sixes += 1;
    } else if (legal) {
      striker.balls += 1;
      if (ball.extraType !== "BYE" && ball.extraType !== "LEG_BYE") {
        striker.runs += ball.runs;
        if (ball.runs === 4) striker.fours += 1;
        if (ball.runs === 6) striker.sixes += 1;
      }
    }

    if (ball.isWicket) {
      const outId = ball.dismissedPlayerId ?? ball.batsmanId;
      const dismissed = batting.get(outId) ?? ensureBatter(outId);
      dismissed.isNotOut = false;
      dismissed.dismissalType = ball.wicketType ?? null;
      dismissed.bowlerId = ball.bowlerId;
      dismissed.fielderId = ball.fielderId;
    }
  }

  for (const card of batting.values()) {
    const ballsFaced = card.balls;
    await tx.battingScorecard.upsert({
      where: { inningsId_playerId: { inningsId, playerId: card.playerId } },
      update: {
        batPosition: card.batPosition,
        runs: card.runs,
        balls: card.balls,
        fours: card.fours,
        sixes: card.sixes,
        isNotOut: card.isNotOut,
        dismissalType: card.dismissalType,
        bowlerId: card.bowlerId,
        fielderId: card.fielderId,
        strikeRate: ballsFaced > 0 ? parseFloat(((card.runs / ballsFaced) * 100).toFixed(2)) : 0,
        battingOrder: card.batPosition,
      },
      create: {
        inningsId,
        playerId: card.playerId,
        batPosition: card.batPosition,
        runs: card.runs,
        balls: card.balls,
        fours: card.fours,
        sixes: card.sixes,
        isNotOut: card.isNotOut,
        dismissalType: card.dismissalType,
        bowlerId: card.bowlerId,
        fielderId: card.fielderId,
        strikeRate: ballsFaced > 0 ? parseFloat(((card.runs / ballsFaced) * 100).toFixed(2)) : 0,
        battingOrder: card.batPosition,
      },
    });
  }

  // --- bowling card ---
  const bowling = new Map<
    string,
    { playerId: string; balls: number; runs: number; wickets: number; wides: number; noBalls: number; dotBalls: number; maidens: number }
  >();
  for (const [index, agg] of overAggs) {
    void index;
    if (agg.legalBalls === 6 && agg.runs === 0 && agg.wickets === 0) {
      const b = bowling.get(agg.bowlerId) ?? {
        playerId: agg.bowlerId, balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0, dotBalls: 0, maidens: 0,
      };
      b.maidens += 1;
      bowling.set(agg.bowlerId, b);
    }
  }
  for (const ball of balls) {
    const b = bowling.get(ball.bowlerId) ?? {
      playerId: ball.bowlerId, balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0, dotBalls: 0, maidens: 0,
    };
    b.runs += ball.runs + ball.extraRuns;
    if (ball.isWicket) b.wickets += 1;
    if (ball.extraType === "WIDE") b.wides += 1;
    if (ball.extraType === "NO_BALL") b.noBalls += 1;
    if (isLegalDelivery(ball.extraType)) {
      b.balls += 1;
      if (ball.runs + ball.extraRuns === 0 && !ball.isWicket) b.dotBalls += 1;
    }
    bowling.set(ball.bowlerId, b);
  }
  for (const card of bowling.values()) {
    const overs = formatOversFromBalls(card.balls);
    const oversDecimal = card.balls / 6;
    await tx.bowlingScorecard.upsert({
      where: { inningsId_playerId: { inningsId, playerId: card.playerId } },
      update: {
        overs,
        maidens: card.maidens,
        runs: card.runs,
        wickets: card.wickets,
        wides: card.wides,
        noBalls: card.noBalls,
        economy: oversDecimal > 0 ? parseFloat((card.runs / oversDecimal).toFixed(2)) : 0,
        strikeRate: card.wickets > 0 ? parseFloat((card.balls / card.wickets).toFixed(2)) : 0,
        dotBalls: card.dotBalls,
      },
      create: {
        inningsId,
        playerId: card.playerId,
        overs,
        maidens: card.maidens,
        runs: card.runs,
        wickets: card.wickets,
        wides: card.wides,
        noBalls: card.noBalls,
        economy: oversDecimal > 0 ? parseFloat((card.runs / oversDecimal).toFixed(2)) : 0,
        strikeRate: card.wickets > 0 ? parseFloat((card.balls / card.wickets).toFixed(2)) : 0,
        dotBalls: card.dotBalls,
      },
    });
  }

  // --- fall of wickets + batting state ---
  const fowList: { ball: Ball; runs: number; overs: number }[] = [];
  let cumRuns = 0;
  let cumLegal = 0;
  // Seed with the persisted openers so an empty ball record (e.g. after
  // undoing every delivery) keeps the innings ready to continue scoring.
  let strikerId: string | null = innings.strikerId;
  let nonStrikerId: string | null = innings.nonStrikerId;
  // Physical end the striker faces from. The end only flips at over
  // boundaries; each ball's stored end overrides the tracked value so manual
  // live-state changes that didn't create a ball survive a recompute.
  let strikerEnd: "TOP" | "BOTTOM" = (innings.strikerEnd ?? "BOTTOM") as "TOP" | "BOTTOM";

  for (const ball of balls) {
    const legal = isLegalDelivery(ball.extraType);
    const overComplete = legal && cumLegal % 6 === 5;

    if (strikerId === null) strikerId = ball.batsmanId;
    if (nonStrikerId === null) nonStrikerId = ball.nonStrikerId;

    if (ball.strikerEnd === "TOP" || ball.strikerEnd === "BOTTOM") {
      strikerEnd = ball.strikerEnd;
    }

    cumRuns += ball.runs + ball.extraRuns;
    if (legal) cumLegal += 1;

    const outId = ball.isWicket ? ball.dismissedPlayerId ?? ball.batsmanId : null;
    if (ball.isWicket) {
      fowList.push({ ball, runs: cumRuns, overs: formatOversFromBalls(cumLegal) });
    }

    // Runs that physically happened on this delivery (drives strike rotation).
    // Byes / leg-byes run entirely on extras; the striker is not credited but
    // the batters still crossed. Wides never rotate the strike.
    const completedRuns =
      ball.extraType === "BYE" || ball.extraType === "LEG_BYE"
        ? ball.extraRuns
        : ball.runs;

    if (ball.isWicket) {
      // The surviving batter holds the striker slot; the incoming batter is
      // chosen by the scorer afterwards via set-batsmen. This keeps the ball
      // record as the single source of truth across refreshes.
      const remaining = outId === strikerId ? nonStrikerId : strikerId;
      if (remaining) strikerId = remaining;
      nonStrikerId = null;
    } else if (ball.extraType !== "WIDE" && completedRuns % 2 === 1 && nonStrikerId) {
      [strikerId, nonStrikerId] = [nonStrikerId, strikerId];
    }
    if (overComplete && strikerId && nonStrikerId) {
      [strikerId, nonStrikerId] = [nonStrikerId, strikerId];
    }
    if (overComplete) {
      strikerEnd = strikerEnd === "TOP" ? "BOTTOM" : "TOP";
    }
  }

  let fowNumber = 0;
  for (const fow of fowList) {
    fowNumber += 1;
    await tx.fallOfWicket.upsert({
      where: { inningsId_wicketNumber: { inningsId, wicketNumber: fowNumber } },
      update: {
        playerId: fow.ball.dismissedPlayerId ?? fow.ball.batsmanId,
        runs: fow.runs,
        overs: fow.overs,
        bowlerId: fow.ball.bowlerId,
        batterName: nameById.get(fow.ball.dismissedPlayerId ?? fow.ball.batsmanId) ?? "",
      },
      create: {
        inningsId,
        wicketNumber: fowNumber,
        playerId: fow.ball.dismissedPlayerId ?? fow.ball.batsmanId,
        runs: fow.runs,
        overs: fow.overs,
        bowlerId: fow.ball.bowlerId,
        batterName: nameById.get(fow.ball.dismissedPlayerId ?? fow.ball.batsmanId) ?? "",
      },
    });
  }

  // --- innings totals + live batting state ---
  const totalRuns = balls.reduce((s, b) => s + b.runs + b.extraRuns, 0);
  const totalWickets = balls.filter((b) => b.isWicket).length;
  const totalExtras = balls.reduce((s, b) => s + b.extraRuns, 0);
  const totalLegal = balls.filter((b) => isLegalDelivery(b.extraType)).length;

  const lastOverAgg = balls.length > 0 ? overAggs.get(Math.floor(totalLegal / 6) - (totalLegal % 6 === 0 ? 1 : 0)) : undefined;
  const currentBowlerId =
    balls.length === 0
      ? innings.currentBowlerId
      : balls.length > 0 && lastOverAgg && lastOverAgg.legalBalls < 6
        ? balls[balls.length - 1].bowlerId
        : null;

  await tx.innings.update({
    where: { id: inningsId },
    data: {
      totalRuns,
      totalWickets,
      totalOvers: formatOversFromBalls(totalLegal),
      extras: totalExtras,
      strikerId,
      nonStrikerId,
      currentBowlerId,
      battingOrderCount: batting.size,
      strikerEnd,
    },
  });

  // --- commentary + highlights ---
  cumRuns = 0;
  cumLegal = 0;
  let cumWickets = 0;
  let overRuns = 0;
  const batterRuns = new Map<string, number>();
  const bowlerWickets = new Map<string, number>();

  for (const ball of balls) {
    const legal = isLegalDelivery(ball.extraType);
    const overComplete = legal && cumLegal % 6 === 5;
    const overNumber = legal
      ? Math.floor((cumLegal + 1 - 1) / 6) + 1
      : Math.floor(cumLegal / 6) + 1;

    cumRuns += ball.runs + ball.extraRuns;
    overRuns += ball.runs + ball.extraRuns;
    if (ball.isWicket) cumWickets += 1;
    if (legal) cumLegal += 1;

    const striker = nameById.get(ball.batsmanId) ?? "Batter";
    const bowler = nameById.get(ball.bowlerId) ?? "Bowler";
    const fielder = ball.fielderId ? nameById.get(ball.fielderId) : undefined;

    const content = buildBallCommentary(ball, striker, bowler, fielder, {
      overNumber,
      ballNumber: cumLegal,
      inningsNumber: innings.inningsNumber,
      matchFormat: match.format,
      currentRuns: cumRuns,
      currentWickets: cumWickets,
      target: innings.targetScore,
    });
    const isHighlight = ball.isWicket || ball.runs === 4 || ball.runs === 6;

    await tx.commentary.create({
      data: {
        matchId: match.id,
        ballId: ball.id,
        inningsNumber: innings.inningsNumber,
        overNumber,
        ballNumber: cumLegal,
        isAutomatic: true,
        isHighlight,
        eventType: ball.isWicket ? "WICKET" : ball.runs === 6 ? "SIX" : ball.runs === 4 ? "FOUR" : "BALL",
        generatedBy: "deterministic",
        content,
      },
    });

    if (isHighlight) {
      await tx.matchEvent.create({
        data: {
          matchId: match.id,
          type: ball.isWicket ? "WICKET" : ball.runs === 6 ? "SIX" : "BOUNDARY",
          description: content,
          overNumber,
          ballNumber: cumLegal,
          inningsNumber: innings.inningsNumber,
          data: ball.isWicket ? { wicketType: ball.wicketType } : { runs: ball.runs },
        },
      });
    }

    const batRuns = ball.extraType === "NO_BALL" ? ball.runs : ball.extraType === "WIDE" ? 0 : ball.runs;
    const runsSoFar = (batterRuns.get(ball.batsmanId) ?? 0) + batRuns;
    batterRuns.set(ball.batsmanId, runsSoFar);
    if (runsSoFar >= 50 && runsSoFar - batRuns < 50) {
      await tx.commentary.create({
        data: {
          matchId: match.id,
          ballId: ball.id,
          inningsNumber: innings.inningsNumber,
          overNumber,
          ballNumber: cumLegal,
          isAutomatic: true,
          isHighlight: true,
          eventType: "MILESTONE",
          generatedBy: "deterministic",
          content: `${striker} brings up his fifty!`,
        },
      });
    }
    if (runsSoFar >= 100 && runsSoFar - batRuns < 100) {
      await tx.commentary.create({
        data: {
          matchId: match.id,
          ballId: ball.id,
          inningsNumber: innings.inningsNumber,
          overNumber,
          ballNumber: cumLegal,
          isAutomatic: true,
          isHighlight: true,
          eventType: "MILESTONE",
          generatedBy: "deterministic",
          content: `${striker} reaches a magnificent century!`,
        },
      });
    }

    if (ball.isWicket) {
      const wkts = (bowlerWickets.get(ball.bowlerId) ?? 0) + 1;
      bowlerWickets.set(ball.bowlerId, wkts);
      if (wkts === 5) {
        await tx.commentary.create({
          data: {
            matchId: match.id,
            ballId: ball.id,
            inningsNumber: innings.inningsNumber,
            overNumber,
            ballNumber: cumLegal,
            isAutomatic: true,
            isHighlight: true,
            eventType: "MILESTONE",
            generatedBy: "deterministic",
            content: `${bowler} claims a five-wicket haul!`,
          },
        });
      }
    }

    if (overComplete) {
      await tx.commentary.create({
        data: {
          matchId: match.id,
          inningsNumber: innings.inningsNumber,
          overNumber,
          isAutomatic: true,
          isHighlight: false,
          eventType: "END_OF_OVER",
          content: `End of over ${overNumber}: ${overRuns} runs.`,
        },
      });
      overRuns = 0;
    }
  }

  // --- innings end detection (uses the freshly computed totals, not the
  // pre-update snapshot fetched at the top of this function) ---
  await finalizeInningsIfNeeded(tx, match, {
    ...innings,
    totalRuns,
    totalWickets,
    totalOvers: formatOversFromBalls(totalLegal),
  });
}

async function finalizeInningsIfNeeded(
  tx: Prisma.TransactionClient,
  match: Pick<Match, "id" | "totalOvers">,
  innings: Innings
) {
  if (innings.endedAt) return;

  const legalBalls = parseOversToBalls(innings.totalOvers);
  const maxBalls = match.totalOvers * 6;
  const allOut = innings.totalWickets >= MAX_WICKETS;
  const oversDone = legalBalls >= maxBalls;
  const chaseDone =
    innings.inningsNumber === 2 &&
    innings.targetScore != null &&
    innings.totalRuns >= innings.targetScore;

  if (!allOut && !oversDone && !chaseDone) return;

  await tx.innings.update({
    where: { id: innings.id },
    data: { endedAt: new Date() },
  });

  await finalizeInnings(tx, match.id, innings);
}

async function finalizeInnings(
  tx: Prisma.TransactionClient,
  matchId: string,
  innings: Innings
) {
  const teamNames = await tx.team.findMany({
    where: { id: { in: [innings.battingTeam, innings.bowlingTeam] } },
    select: { id: true, name: true },
  });
  const teamName = (id: string) => teamNames.find((t) => t.id === id)?.name ?? "Team";

  await tx.commentary.create({
    data: {
      matchId,
      inningsNumber: innings.inningsNumber,
      isAutomatic: true,
      isHighlight: true,
      eventType: "END_OF_INNINGS",
      content: `That's the end of ${teamName(innings.battingTeam)}'s innings: ${innings.totalRuns}/${innings.totalWickets} in ${innings.totalOvers} overs.`,
    },
  });

  if (innings.inningsNumber === 1) {
    await tx.matchEvent.create({
      data: {
        matchId,
        type: "INNINGS_ENDED",
        description: `${teamName(innings.battingTeam)} finished on ${innings.totalRuns}/${innings.totalWickets}.`,
        inningsNumber: 1,
        data: { totalRuns: innings.totalRuns, totalWickets: innings.totalWickets },
      },
    });
    await tx.match.update({
      where: { id: matchId },
      data: { status: "INNINGS_BREAK" },
    });
  } else {
    const innings1 = await tx.innings.findFirst({ where: { matchId, inningsNumber: 1 } });
    if (innings1) {
      const battingName = teamName(innings.battingTeam);
      const bowlingName = teamName(innings.bowlingTeam);
      const target = innings.targetScore ?? innings1.totalRuns + 1;

      let result: string;
      let winningTeamId: string | null;
      if (innings.totalRuns >= target) {
        const remainingWickets = MAX_WICKETS - innings.totalWickets;
        result = `${battingName} won by ${remainingWickets} wicket${remainingWickets > 1 ? "s" : ""}`;
        winningTeamId = innings.battingTeam;
      } else if (innings.totalRuns === innings1.totalRuns) {
        result = "Match tied";
        winningTeamId = null;
      } else {
        const margin = innings1.totalRuns - innings.totalRuns;
        result = `${bowlingName} won by ${margin} run${margin > 1 ? "s" : ""}`;
        winningTeamId = innings.bowlingTeam;
      }

      await tx.match.update({
        where: { id: matchId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          result,
          winningTeamId,
          isPaused: false,
        },
      });
      await tx.commentary.create({
        data: {
          matchId,
          isAutomatic: true,
          isHighlight: true,
          eventType: "RESULT",
          content: result,
        },
      });
      await tx.matchEvent.create({
        data: {
          matchId,
          type: "MATCH_COMPLETED",
          description: result,
          data: { winningTeamId, result },
        },
      });
    }
  }
}

function computeResult(
  match: MatchWithTeams,
  innings1: Innings,
  innings2: Innings
): { result: string; winningTeamId: string | null } {
  const battingTeam2Name = innings2.battingTeam === match.homeTeamId
    ? match.homeTeam.name
    : match.awayTeam.name;
  const bowlingTeam2Name = innings2.bowlingTeam === match.homeTeamId
    ? match.homeTeam.name
    : match.awayTeam.name;
  const target = innings2.targetScore ?? innings1.totalRuns + 1;

  if (innings2.totalRuns >= target) {
    const remainingWickets = MAX_WICKETS - innings2.totalWickets;
    return {
      result: `${battingTeam2Name} won by ${remainingWickets} wicket${remainingWickets > 1 ? "s" : ""}`,
      winningTeamId: innings2.battingTeam,
    };
  }
  if (innings2.totalRuns === innings1.totalRuns) {
    return { result: "Match tied", winningTeamId: null };
  }
  const margin = innings1.totalRuns - innings2.totalRuns;
  return {
    result: `${bowlingTeam2Name} won by ${margin} run${margin > 1 ? "s" : ""}`,
    winningTeamId: innings2.bowlingTeam,
  };
}

function buildBallCommentary(
  ball: Ball,
  striker: string,
  bowler: string,
  fielder: string | undefined,
  ctx: {
    overNumber: number;
    ballNumber: number;
    inningsNumber: number;
    matchFormat: string;
    currentRuns: number;
    currentWickets: number;
    target: number | null;
  }
): string {
  return buildDeterministicCommentary({
    ball: {
      runs: ball.runs,
      extraRuns: ball.extraRuns,
      extraType: ball.extraType,
      isWicket: ball.isWicket,
      wicketType: ball.wicketType,
      ballResult: ball.ballResult,
      shotType: ball.shotType,
      placementZone: ball.placementZone,
      placementDistance: ball.placementDistance,
      fieldPositions: ball.fieldPositions,
      isFreeHit: ball.isFreeHit,
      isOverthrow: ball.isOverthrow,
    },
    striker,
    bowler,
    fielder,
    overNumber: ctx.overNumber,
    ballNumber: ctx.ballNumber,
    inningsNumber: ctx.inningsNumber,
    matchFormat: ctx.matchFormat,
    currentRuns: ctx.currentRuns,
    currentWickets: ctx.currentWickets,
    target: ctx.target,
  });
}
