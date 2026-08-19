import prisma from "@/lib/prisma";
import type { Ball, Innings, MatchLiveStream } from "@prisma/client";
import {
  emitHighlightUpdated,
  emitHighlightRecordRequest,
  emitStreamUpdated,
} from "@/lib/realtime";
import { isVideoConfigured } from "./provider";
import { getHighlightStorage } from "./storage";
import {
  uploadHighlightToCloudinary,
  deleteCloudinaryVideo,
} from "./cloudinary-storage";

export type HighlightEventType = "FOUR" | "SIX" | "WICKET";

export interface HighlightConfig {
  preRollSeconds: number;
  postRollSeconds: number;
  retentionHours: number;
}

/** Hard cap on a single uploaded highlight clip (50 MB webm). */
export const MAX_HIGHLIGHT_BYTES = 50 * 1024 * 1024;

/**
 * If a PENDING or PROCESSING highlight is older than this, the broadcaster
 * likely failed to upload it (disconnected, MediaRecorder error, network).
 * Mark it FAILED so it does not remain stuck forever.
 */
const HIGHLIGHT_UPLOAD_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Clip timing + retention. The browser records a rolling ~10s window and keeps
 * recording ~5s after a scoring event, then uploads that clip. Names prefer
 * the VIDEO_HIGHLIGHT_* vars and fall back to the legacy HIGHLIGHT_* names.
 */
export function getHighlightConfig(): HighlightConfig {
  const preRollSeconds = clampInt(
    process.env.VIDEO_HIGHLIGHT_PRE_ROLL_SECONDS ??
      process.env.HIGHLIGHT_PRE_ROLL_SECONDS,
    10,
    3,
    60
  );
  const postRollSeconds = clampInt(
    process.env.VIDEO_HIGHLIGHT_POST_ROLL_SECONDS ??
      process.env.HIGHLIGHT_POST_ROLL_SECONDS,
    5,
    1,
    30
  );
  const retentionHours = clampInt(
    process.env.VIDEO_HIGHLIGHT_RETENTION_HOURS,
    12,
    1,
    7 * 24
  );
  return { preRollSeconds, postRollSeconds, retentionHours };
}

function clampInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/** When a freshly-created highlight row should be swept by cleanup. */
export function computeHighlightExpiry(
  now = new Date(),
  retentionHours = getHighlightConfig().retentionHours
): Date {
  return new Date(now.getTime() + retentionHours * 60 * 60 * 1000);
}

export function detectHighlightEvent(ball: Ball): HighlightEventType | null {
  if (ball.isWicket) return "WICKET";
  if (ball.runs === 6 || ball.ballResult === "SIX") return "SIX";
  if (ball.runs === 4 || ball.ballResult === "FOUR") return "FOUR";
  return null;
}

export function buildHighlightTitle(
  eventType: HighlightEventType,
  ball: Ball,
  innings: Innings,
  strikerName?: string | null
): string {
  const batter = strikerName ?? "Batter";
  const over = Math.floor((ball.ballNumber - 1) / 6) + 1;
  const ballInOver = ((ball.ballNumber - 1) % 6) + 1;

  const shot = ball.shotType
    ? ball.shotType.toLowerCase().replace(/_/g, " ")
    : null;
  const zone = ball.placementZone
    ? ball.placementZone.toLowerCase().replace(/_/g, " ")
    : null;

  switch (eventType) {
    case "WICKET":
      return `${batter} is out — ${(ball.wicketType ?? "wicket")
        .toLowerCase()
        .replace(/_/g, " ")}!`;
    case "SIX":
      return shot && zone
        ? `${batter} launches it ${zone} — huge six!`
        : `${batter} launches a massive six!`;
    case "FOUR":
      return shot && zone
        ? `${batter} cracks it through ${zone} — four!`
        : `${batter} finds the fence — four!`;
    default:
      return `${batter} — ${String(eventType).toLowerCase()}`;
  }
}

// ---------------------------------------------------------------------------
// Automatic highlight trigger (fire-and-forget, called from recordBall)
// ---------------------------------------------------------------------------

/**
 * Background entry point wired after a ball is committed in scoring. Never
 * blocks or rolls back scoring — like AI commentary this runs detached and
 * swallows every error. Only records a highlight when:
 *  - video (WebRTC) is configured, and
 *  - the match has an active live stream whose broadcaster is recording.
 *
 * A PENDING row is created and the broadcaster is asked to cut a clip via the
 * `broadcast:record` socket event. The upload route later flips it to READY.
 */
export async function maybeAutoRecordHighlight(
  matchId: string,
  ballId: string
): Promise<void> {
  try {
    if (!isVideoConfigured()) return;

    const stream = await prisma.matchLiveStream.findUnique({
      where: { matchId },
    });
    if (!stream || stream.status !== "LIVE" || !stream.startedAt) return;

    const ball = await prisma.ball.findUnique({
      where: { id: ballId },
    });
    if (!ball) return;

    const innings = await prisma.innings.findUnique({
      where: { id: ball.inningsId },
    });
    if (!innings || innings.matchId !== matchId) return;

    const eventType = detectHighlightEvent(ball);
    if (!eventType) return;

    const existing = await prisma.matchVideoHighlight.findFirst({
      where: { matchId, ballId, eventType },
    });
    if (existing) return;

    const { preRollSeconds, postRollSeconds } = getHighlightConfig();
    const now = Date.now();
    const elapsedSec = Math.max(0, (now - stream.startedAt.getTime()) / 1000);
    const startTime = Math.max(0, Math.round(elapsedSec - preRollSeconds));
    const endTime = Math.round(elapsedSec + postRollSeconds);

    const striker = ball.batsmanId
      ? await prisma.player.findUnique({
          where: { id: ball.batsmanId },
          select: { name: true },
        })
      : null;

    const title = buildHighlightTitle(eventType, ball, innings, striker?.name);

    const highlight = await prisma.matchVideoHighlight.create({
      data: {
        matchId,
        ballId,
        eventType,
        inningsNumber: innings.inningsNumber,
        overNumber: Math.floor((ball.ballNumber - 1) / 6) + 1,
        ballNumber: ball.ballNumber,
        title,
        startTime,
        endTime,
        duration: Math.max(1, endTime - startTime),
        status: "PENDING",
        expiresAt: computeHighlightExpiry(),
      },
    });

    emitHighlightUpdated(matchId, { action: "added", highlightId: highlight.id });
    emitHighlightRecordRequest(matchId, {
      highlightId: highlight.id,
      ballId,
      eventType,
      preRollSeconds,
      postRollSeconds,
    });
  } catch (err) {
    console.error("Background highlight recording failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Clip upload — broadcaster cuts the webm in the browser and uploads it here
// ---------------------------------------------------------------------------

/**
 * Persists an uploaded highlight clip, flips the row to READY and notifies
 * subscribers. Throws on validation failures so the route can map them to HTTP
 * status codes. Authorization is enforced by the caller (the upload route).
 *
 * Production: uploads to Cloudinary, stores secure_url in playbackUrl and
 * public_id in providerVideoId. The row is NEVER marked READY until the
 * Cloudinary upload succeeds.
 *
 * Development (no Cloudinary configured): falls back to local filesystem.
 */
export async function uploadHighlight(
  matchId: string,
  highlightId: string,
  data: Buffer,
  contentType: string
): Promise<void> {
  const highlight = await prisma.matchVideoHighlight.findFirst({
    where: { id: highlightId, matchId },
  });
  if (!highlight) throw new Error("Highlight not found");
  if (highlight.status !== "PENDING" && highlight.status !== "PROCESSING") {
    throw new Error("Highlight is not awaiting upload.");
  }
  if (highlight.expiresAt.getTime() < Date.now()) {
    throw new Error("Highlight has expired.");
  }
  if (!contentType.startsWith("video/")) {
    throw new Error("Only video uploads are accepted.");
  }

  const mime =
    contentType && contentType.startsWith("video/")
      ? contentType
      : "video/webm";

  const useCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME);

  if (useCloudinary) {
    console.log(
      `[Highlight] Upload started for highlight=${highlightId} match=${matchId} size=${data.byteLength}`
    );

    const cloudResult = await uploadHighlightToCloudinary(
      matchId,
      highlightId,
      data
    );

    console.log(
      `[Highlight] Cloudinary upload successful highlight=${highlightId} public_id=${cloudResult.publicId}`
    );

    await prisma.matchVideoHighlight.update({
      where: { id: highlightId },
      data: {
        status: "READY",
        providerVideoId: cloudResult.publicId,
        playbackUrl: cloudResult.secureUrl,
        downloadUrl: `/api/matches/${matchId}/highlights/${highlightId}/download`,
        error: null,
      },
    });

    console.log(
      `[Highlight] Database updated READY highlight=${highlightId}`
    );
  } else {
    // Local filesystem fallback (development)
    await getHighlightStorage().save(matchId, highlightId, data, mime);

    await prisma.matchVideoHighlight.update({
      where: { id: highlightId },
      data: {
        status: "READY",
        playbackUrl: `/api/matches/${matchId}/highlights/${highlightId}/play`,
        downloadUrl: `/api/matches/${matchId}/highlights/${highlightId}/download`,
        error: null,
      },
    });
  }

  emitHighlightUpdated(matchId, { action: "ready", highlightId });
}

// ---------------------------------------------------------------------------
// Stale highlight recovery — marks PENDING/PROCESSING rows as FAILED
// ---------------------------------------------------------------------------

/**
 * Finds PENDING or PROCESSING highlights that are older than
 * `HIGHLIGHT_UPLOAD_TIMEOUT_MS` (the broadcaster likely disconnected or the
 * upload failed silently) and marks them FAILED so they never remain stuck.
 *
 * Returns the number of rows updated. Safe to call repeatedly.
 */
export async function markStaleHighlights(): Promise<number> {
  const cutoff = new Date(Date.now() - HIGHLIGHT_UPLOAD_TIMEOUT_MS);
  const result = await prisma.matchVideoHighlight.updateMany({
    where: {
      status: { in: ["PENDING", "PROCESSING"] },
      createdAt: { lt: cutoff },
    },
    data: {
      status: "FAILED",
      error: "Upload timed out — the broadcaster may have disconnected before the clip could be delivered.",
    },
  });
  if (result.count > 0) {
    console.log(
      `[Highlights] marked ${result.count} stale highlight(s) as FAILED (older than ${HIGHLIGHT_UPLOAD_TIMEOUT_MS / 60_000} min)`
    );
  }
  return result.count;
}

// ---------------------------------------------------------------------------
// Expiry + cleanup (retention window, file deleted before the DB row)
// ---------------------------------------------------------------------------

/**
 * Idempotent sweep for expired highlight clips across every match.
 *
 * For Cloudinary-backed highlights (providerVideoId set):
 *   1. Delete the Cloudinary video resource using the stored public_id
 *   2. Update the DB row to EXPIRED
 *
 * For old local-file highlights (no providerVideoId):
 *   1. Delete the local file
 *   2. Update the DB row to EXPIRED
 *
 * Safe to run repeatedly. If Cloudinary deletion fails the row is left as-is
 * so the next sweep can retry.
 */
export async function cleanupExpiredHighlights(): Promise<number> {
  const expired = await prisma.matchVideoHighlight.findMany({
    where: {
      expiresAt: { lte: new Date() },
      status: { not: "EXPIRED" },
    },
    select: { id: true, matchId: true, providerVideoId: true },
  });

  const storage = getHighlightStorage();
  const idsToDelete: string[] = [];
  const cloudinaryIdsToDelete: string[] = [];

  for (const h of expired) {
    if (h.providerVideoId) {
      // Cloudinary-backed highlight
      try {
        await deleteCloudinaryVideo(h.providerVideoId);
        cloudinaryIdsToDelete.push(h.providerVideoId);
        idsToDelete.push(h.id);
        console.log(
          `[Highlight] Cleanup deleted Cloudinary resource public_id=${h.providerVideoId} highlight=${h.id}`
        );
      } catch (err) {
        console.error(
          `[Highlight] Cleanup failed to delete Cloudinary resource for highlight=${h.id}:`,
          err
        );
      }
    } else {
      // Old local-file highlight — try deleting the file, then mark EXPIRED
      try {
        await storage.delete(h.matchId, h.id);
      } catch {
        // Swallow — file may already be gone
      }
      idsToDelete.push(h.id);
    }
  }

  if (idsToDelete.length > 0) {
    await prisma.matchVideoHighlight.updateMany({
      where: { id: { in: idsToDelete } },
      data: { status: "EXPIRED" },
    });
    console.log(
      `[Highlight] Cleanup marked ${idsToDelete.length} highlight(s) as EXPIRED (${cloudinaryIdsToDelete.length} Cloudinary resources deleted)`
    );
  }

  return idsToDelete.length;
}

// ---------------------------------------------------------------------------
// Stream lifecycle helper (used by the stream API routes)
// ---------------------------------------------------------------------------

export async function announceStreamUpdated(
  stream: MatchLiveStream
): Promise<void> {
  emitStreamUpdated(stream.matchId, {
    status: stream.status,
    playbackUrl: stream.playbackUrl,
    startedAt: stream.startedAt?.toISOString() ?? null,
    endedAt: stream.endedAt?.toISOString() ?? null,
  });
}

export type { MatchLiveStream };
