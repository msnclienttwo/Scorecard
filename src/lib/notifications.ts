import prisma from "@/lib/prisma";
import type { Notification, NotificationType } from "@prisma/client";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  matchId?: string;
  data?: Record<string, unknown>;
}

export interface MatchNotificationContext {
  matchId: string;
  matchName: string;
  creatorId: string;
  scorerIds?: string[];
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification | null> {
  if (!input.userId) return null;

  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      matchId: input.matchId ?? null,
      data: (input.data ?? {}) as object,
    },
  });
}

function recipientIds(context: MatchNotificationContext): string[] {
  return [
    ...new Set([
      context.creatorId,
      ...(context.scorerIds ?? []),
    ].filter(Boolean)),
  ];
}

async function notify(
  context: MatchNotificationContext,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  const ids = recipientIds(context);
  await Promise.all(
    ids.map((userId) =>
      createNotification({
        userId,
        type,
        title,
        message,
        matchId: context.matchId,
        data: {
          ...data,
          matchId: context.matchId,
          matchName: context.matchName,
        },
      })
    )
  );
}

export async function notifyTeamCreated(
  userId: string,
  teamName: string,
  teamId: string
): Promise<void> {
  await createNotification({
    userId,
    type: "TEAM_CREATED",
    title: "Team created",
    message: `Your team "${teamName}" was created successfully.`,
    data: { teamId, teamName },
  });
}

export async function notifyPlayerCreated(
  userId: string,
  playerName: string,
  playerId: string,
  teamName?: string
): Promise<void> {
  await createNotification({
    userId,
    type: "PLAYER_CREATED",
    title: "Player created",
    message: teamName
      ? `Player "${playerName}" was added to ${teamName}.`
      : `Player "${playerName}" was added to the system.`,
    data: { playerId, playerName, teamName },
  });
}

export async function notifyMatchCreated(
  context: MatchNotificationContext
): Promise<void> {
  await notify(
    context,
    "MATCH_CREATED",
    "Match created",
    `${context.matchName} has been scheduled.`
  );
}

export async function notifyMatchStarted(
  context: MatchNotificationContext
): Promise<void> {
  const ids = recipientIds(context);

  await Promise.all(
    ids.map(async (userId) => {
      const existing = await prisma.notification.findFirst({
        where: { userId, type: "MATCH_STARTED", matchId: context.matchId },
      });
      if (existing) return;
      await createNotification({
        userId,
        type: "MATCH_STARTED",
        title: "Match started",
        message: `${context.matchName} is now live!`,
        matchId: context.matchId,
        data: { matchId: context.matchId, matchName: context.matchName },
      });
    })
  );
}

export async function notifyInningsEnded(
  context: MatchNotificationContext,
  inningsNumber: number
): Promise<void> {
  await notify(
    context,
    "INNINGS_BREAK",
    inningsNumber === 1 ? "Innings break" : "End of innings",
    inningsNumber === 1
      ? `Innings break: ${context.matchName} is at the halfway stage.`
      : `The second innings of ${context.matchName} has ended.`,
    { inningsNumber }
  );
}

export async function notifyMatchCompleted(
  context: MatchNotificationContext,
  result?: string | null
): Promise<void> {
  const ids = recipientIds(context);

  await Promise.all(
    ids.map(async (userId) => {
      const existing = await prisma.notification.findFirst({
        where: { userId, type: "MATCH_COMPLETED", matchId: context.matchId },
      });
      if (existing) return;
      await createNotification({
        userId,
        type: "MATCH_COMPLETED",
        title: "Match completed",
        message: result || `${context.matchName} has been completed.`,
        matchId: context.matchId,
        data: { matchId: context.matchId, matchName: context.matchName, result },
      });
    })
  );
}
