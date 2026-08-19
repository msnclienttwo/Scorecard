import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getHighlightStorage } from "@/lib/video/storage";

/**
 * Download endpoint for highlight clips.
 *
 * Cloudinary-backed highlights: redirect to the Cloudinary URL with a
 * Content-Disposition: attachment header so the browser triggers a download.
 *
 * Old local-file highlights: serve the buffer from local storage with
 * attachment disposition. If the file is gone, return unavailable.
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
        { error: "Highlight is not ready to download." },
        { status: 400 }
      );
    }
    if (highlight.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Highlight has expired." },
        { status: 410 }
      );
    }

    // Cloudinary-backed highlight: fetch the video from Cloudinary and
    // return it as a download attachment so the browser saves it.
    if (highlight.providerVideoId && highlight.playbackUrl) {
      const res = await fetch(highlight.playbackUrl);
      if (!res.ok) {
        return NextResponse.json(
          { error: "Highlight unavailable" },
          { status: 404 }
        );
      }
      const buf = Buffer.from(await res.arrayBuffer());
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": res.headers.get("content-type") ?? "video/webm",
          "Content-Disposition": `attachment; filename="scorebolt-highlight-${highlightId}.webm"`,
          "Content-Length": String(buf.byteLength),
          "Cache-Control": "private, max-age=60",
        },
      });
    }

    // Old local-file highlight
    const stored = await getHighlightStorage().load(matchId, highlightId);
    if (!stored) {
      return NextResponse.json(
        { error: "Highlight unavailable" },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(stored.buffer), {
      status: 200,
      headers: {
        "Content-Type": stored.contentType,
        "Content-Disposition": `attachment; filename="scorebolt-highlight-${highlightId}.webm"`,
        "Content-Length": String(stored.size),
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to prepare download",
      },
      { status: 500 }
    );
  }
}
