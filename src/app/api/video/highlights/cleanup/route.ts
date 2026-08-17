import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cleanupExpiredHighlights } from "@/lib/video/highlights";

/**
 * Idempotent sweep for expired highlight clips.
 *
 * Auth: either an authenticated SUPER_ADMIN/TOURNAMENT_ADMIN, or a request
 * carrying the `x-video-cleanup-secret` header matching VIDEO_CLEANUP_SECRET
 * (so a headless cron job can trigger it without a session).
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.VIDEO_CLEANUP_SECRET;
    const headerSecret = request.headers.get("x-video-cleanup-secret");

    let authorized = secret && headerSecret && headerSecret === secret;

    if (!authorized) {
      const user = await getCurrentUser();
      authorized =
        user?.role === "SUPER_ADMIN" || user?.role === "TOURNAMENT_ADMIN";
    }

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cleaned = await cleanupExpiredHighlights();
    return NextResponse.json({ cleaned });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cleanup failed" },
      { status: 500 }
    );
  }
}
