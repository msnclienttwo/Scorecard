/**
 * Real-time event relay for ScoreBolt.
 *
 * When server.js is running (local dev or self-hosted), `globalThis.io` is
 * the Socket.IO server instance and events are emitted directly.
 *
 * When deployed to Vercel (serverless), `globalThis.io` is undefined. This
 * module forwards events to the standalone signaling server via HTTP POST
 * so connected clients still receive real-time updates.
 */
import { getSignalingServerUrl } from "@/lib/video/signaling-url";

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

type IoInstance = {
  to: (room: string) => { emit: (e: string, d: unknown) => void };
};

function getIo(): IoInstance | null {
  try {
    const io = (global as unknown as { io?: IoInstance }).io;
    return io ?? null;
  } catch {
    return null;
  }
}

/**
 * Emit a Socket.IO event to a match room.
 *
 * Uses the local `globalThis.io` when available (server.js). Falls back to
 * forwarding the event to the remote signaling server via HTTP POST when
 * running in serverless (Vercel).
 */
function emitToMatch(
  matchId: string,
  event: string,
  data: Record<string, unknown>
): void {
  const io = getIo();
  if (io) {
    try {
      io.to(`match:${matchId}`).emit(event, { matchId, ...data });
    } catch {
      // socket layer unavailable — real-time degrades to polling
    }
    return;
  }

  // Serverless fallback: forward to the standalone signaling server.
  const signalingUrl = getSignalingServerUrl();
  if (signalingUrl && typeof globalThis.fetch === "function") {
    const relaySecret = process.env.SIGNALING_RELAY_SECRET || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (relaySecret) {
      headers["Authorization"] = `Bearer ${relaySecret}`;
    }
    globalThis
      .fetch(`${signalingUrl}/relay`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          room: `match:${matchId}`,
          event,
          data: { matchId, ...data },
        }),
        // Fire-and-forget; never block the API response.
        signal: AbortSignal.timeout(3000),
      })
      .catch(() => {
        // relay unavailable — real-time degrades to polling
      });
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
