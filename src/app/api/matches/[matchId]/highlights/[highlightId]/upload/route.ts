import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { uploadHighlight, MAX_HIGHLIGHT_BYTES } from "@/lib/video/highlights";
import { canManageBroadcast } from "@/lib/video/broadcast";

/**
 * Receives a highlight clip cut by the broadcaster's MediaRecorder (raw body,
 * Content-Type: video/webm) and flips the PENDING row to READY.
 *
 * Auth: the stream's broadcaster or the match creator/admin. Nobody else may
 * upload clips for a match.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string; highlightId: string }> }
) {
  let matchId: string | null = null;
  let highlightId: string | null = null;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const p = await params;
    matchId = p.matchId;
    highlightId = p.highlightId;

    const [match, stream] = await Promise.all([
      prisma.match.findUnique({
        where: { id: matchId },
        select: { id: true, createdBy: true },
      }),
      prisma.matchLiveStream.findUnique({ where: { matchId } }),
    ]);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const canUpload =
      canManageBroadcast(match, user) || stream?.broadcasterId === user.sub;
    if (!canUpload) {
      return NextResponse.json(
        { error: "Only the broadcaster or the match creator can upload highlights." },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("video/")) {
      return NextResponse.json({ error: "Only video uploads are accepted." }, { status: 415 });
    }

    const arrayBuffer = await request.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: "Empty upload." }, { status: 400 });
    }
    if (arrayBuffer.byteLength > MAX_HIGHLIGHT_BYTES) {
      return NextResponse.json({ error: "Highlight is too large." }, { status: 413 });
    }

    // Mark PROCESSING so the UI shows progress rather than stuck PENDING.
    await prisma.matchVideoHighlight.update({
      where: { id: highlightId },
      data: { status: "PROCESSING" },
    });

    await uploadHighlight(
      matchId,
      highlightId,
      Buffer.from(arrayBuffer),
      contentType
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    // On any error, mark the highlight FAILED so it never stays stuck in
    // PENDING or PROCESSING.
    if (matchId && highlightId) {
      prisma.matchVideoHighlight
        .update({
          where: { id: highlightId },
          data: {
            status: "FAILED",
            error: error instanceof Error ? error.message : "Upload failed",
          },
        })
        .catch(() => {});
    }
    const message = error instanceof Error ? error.message : "Upload failed";
    const status =
      message === "Highlight not found" ? 404 :
      message === "Highlight has expired." ? 410 :
      message === "Highlight is not awaiting upload." ? 400 :
      500;
    return NextResponse.json({ error: message }, { status });
  }
}
