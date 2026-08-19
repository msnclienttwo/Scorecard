import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getHighlightStorage } from "@/lib/video/storage";

/**
 * Inline playback endpoint for highlight clips.
 *
 * Cloudinary-backed highlights: redirect to the persistent Cloudinary URL so
 * the browser streams directly from Cloudinary CDN (supports seeking, mobile
 * playback, no server memory overhead).
 *
 * Old local-file highlights: serve the file from local storage if it exists.
 * If the file is gone (Vercel ephemeral FS) return a clean unavailable
 * response rather than crashing.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string; highlightId: string }> }
) {
  try {
    const { matchId, highlightId } = await params;

    const highlight = await prisma.matchVideoHighlight.findFirst({
      where: { id: highlightId, matchId },
    });
    if (!highlight) {
      return NextResponse.json(
        { error: "Highlight not found" },
        { status: 404 }
      );
    }
    if (highlight.status !== "READY") {
      return NextResponse.json(
        { error: "Highlight is not ready yet." },
        { status: 400 }
      );
    }
    if (highlight.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Highlight has expired." },
        { status: 410 }
      );
    }

    // Cloudinary-backed highlight: playbackUrl is the Cloudinary secure_url.
    // Redirect so the browser streams directly from Cloudinary CDN.
    if (highlight.providerVideoId && highlight.playbackUrl) {
      return NextResponse.redirect(highlight.playbackUrl, {
        status: 302,
        headers: { "Cache-Control": "private, max-age=60" },
      });
    }

    // Old local-file highlight: try loading from the local filesystem.
    const stored = await getHighlightStorage().load(matchId, highlightId);
    if (!stored) {
      // File missing (likely Vercel ephemeral FS) — return unavailable, not a crash.
      return NextResponse.json(
        { error: "Highlight unavailable" },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(stored.buffer), {
      status: 200,
      headers: {
        "Content-Type": stored.contentType,
        "Content-Disposition": "inline",
        "Content-Length": String(stored.size),
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load highlight",
      },
      { status: 500 }
    );
  }
}
