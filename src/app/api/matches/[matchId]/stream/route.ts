import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isVideoConfigured, videoSetupMessage, getVideoSettings } from "@/lib/video/provider";
import { announceStreamUpdated, getHighlightConfig } from "@/lib/video/highlights";
import { canManageBroadcast } from "@/lib/video/broadcast";

function streamPayload(
  stream: {
    id: string;
    status: string;
    provider: string;
    playbackUrl: string | null;
    startedAt: Date | null;
    endedAt: Date | null;
    broadcasterId: string;
  }
) {
  const { iceServers, maxViewers } = getVideoSettings();
  const { preRollSeconds, postRollSeconds } = getHighlightConfig();
  return {
    id: stream.id,
    status: stream.status,
    provider: stream.provider,
    playbackUrl: stream.playbackUrl,
    startedAt: stream.startedAt,
    endedAt: stream.endedAt,
    broadcasterId: stream.broadcasterId,
    iceServers,
    maxViewers,
    highlightPreRollSeconds: preRollSeconds,
    highlightPostRollSeconds: postRollSeconds,
  };
}

/**
 * Starts (or restarts) a WebRTC broadcast for a match. The socket signaling
 * server is only ever given signaling; media is a direct browser-to-browser
 * mesh. A stream row with status LIVE tells clients a broadcaster is on air.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { matchId } = await params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, name: true, createdBy: true },
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (!isVideoConfigured()) {
      return NextResponse.json(
        { error: videoSetupMessage() },
        { status: 400 }
      );
    }

    const existing = await prisma.matchLiveStream.findUnique({ where: { matchId } });

    const isApproved =
      existing?.broadcasterId === user.sub &&
      (await prisma.matchBroadcaster.findFirst({
        where: { matchId, userId: user.sub, status: "APPROVED" },
      }));
    const isManager = canManageBroadcast(match, user);

    if (!isManager && !isApproved) {
      return NextResponse.json(
        { error: "You are not an approved broadcaster for this match." },
        { status: 403 }
      );
    }

    if (existing && (existing.status === "LIVE" || existing.status === "CREATED")) {
      return NextResponse.json({ stream: streamPayload(existing) });
    }

    const now = new Date();
    const stream = existing
      ? await prisma.matchLiveStream.update({
          where: { matchId },
          data: {
            broadcasterId: user.sub,
            provider: "webrtc",
            status: "LIVE",
            startedAt: now,
            endedAt: null,
            playbackUrl: null,
          },
        })
      : await prisma.matchLiveStream.create({
          data: {
            matchId,
            broadcasterId: user.sub,
            provider: "webrtc",
            status: "LIVE",
            startedAt: now,
          },
        });

    await announceStreamUpdated(stream);

    return NextResponse.json({ stream: streamPayload(stream) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start the stream" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { matchId } = await params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, createdBy: true },
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const stream = await prisma.matchLiveStream.findUnique({ where: { matchId } });
    if (!stream) {
      return NextResponse.json({ error: "No live stream for this match." }, { status: 404 });
    }

    const isManager = canManageBroadcast(match, user);
    if (!isManager && stream.broadcasterId !== user.sub) {
      return NextResponse.json(
        { error: "Only the broadcaster or the match creator can stop the stream." },
        { status: 403 }
      );
    }

    if (stream.status === "ENDED") {
      return NextResponse.json({ stream: streamPayload(stream) }, { status: 200 });
    }

    const ended = await prisma.matchLiveStream.update({
      where: { matchId },
      data: { status: "ENDED", endedAt: new Date() },
    });

    await announceStreamUpdated(ended);

    return NextResponse.json({ stream: streamPayload(ended) }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to stop the stream" },
      { status: 500 }
    );
  }
}
