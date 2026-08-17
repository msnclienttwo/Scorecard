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

export function emitStreamUpdated(
  matchId: string,
  data: {
    status: string;
    playbackUrl?: string | null;
    startedAt?: string | null;
    endedAt?: string | null;
  }
): void {
  emitToMatch(matchId, "stream:updated", data);
}

export function emitHighlightUpdated(
  matchId: string,
  data: { action: string; highlightId?: string }
): void {
  emitToMatch(matchId, "highlight:updated", data);
}

/**
 * Asks the active broadcaster's studio to cut a clip for a scoring event. The
 * studio maintains a rolling MediaRecorder window, keeps recording a little
 * more, then uploads the webm to the highlight's upload route. Timing values
 * are sent from the server so client and server always agree.
 */
export function emitHighlightRecordRequest(
  matchId: string,
  data: {
    highlightId: string;
    ballId: string;
    eventType: string;
    preRollSeconds: number;
    postRollSeconds: number;
  }
): void {
  emitToMatch(matchId, "broadcast:record", data);
}
