export interface CommentarySocketPayload {
  id: string;
  matchId: string;
  ballId: string | null;
  content: string;
  isAIGenerated: boolean;
  generatedBy: string | null;
  provider: string | null;
  pinned: boolean;
  eventType: string | null;
  createdAt: string;
}

function emitToMatch(
  matchId: string,
  event: string,
  data: Record<string, unknown>
): void {
  try {
    const io = (global as unknown as {
      io?: { to: (room: string) => { emit: (e: string, d: unknown) => void } };
    }).io;
    if (io) io.to(`match:${matchId}`).emit(event, { matchId, ...data });
  } catch {
    // socket layer unavailable — real-time degrades to polling
  }
}

export function toSocketPayload(
  matchId: string,
  commentary: {
    id: string;
    ballId?: string | null;
    content: string;
    isAIGenerated: boolean;
    generatedBy?: string | null;
    provider?: string | null;
    pinned: boolean;
    eventType?: string | null;
    createdAt: Date | string;
  }
): CommentarySocketPayload {
  return {
    id: commentary.id,
    matchId,
    ballId: commentary.ballId ?? null,
    content: commentary.content,
    isAIGenerated: commentary.isAIGenerated,
    generatedBy: commentary.generatedBy ?? null,
    provider: commentary.provider ?? null,
    pinned: commentary.pinned,
    eventType: commentary.eventType ?? null,
    createdAt:
      typeof commentary.createdAt === "string"
        ? commentary.createdAt
        : commentary.createdAt.toISOString(),
  };
}

export function emitCommentaryAdded(
  matchId: string,
  commentary: Parameters<typeof toSocketPayload>[1]
): void {
  emitToMatch(matchId, "commentary:added", {
    commentary: toSocketPayload(matchId, commentary),
  });
}

export function emitCommentaryUpdated(
  matchId: string,
  commentary: Parameters<typeof toSocketPayload>[1]
): void {
  emitToMatch(matchId, "commentary:updated", {
    commentary: toSocketPayload(matchId, commentary),
  });
}

export function emitCommentaryDeleted(matchId: string, commentaryId: string): void {
  emitToMatch(matchId, "commentary:deleted", { commentaryId });
}
