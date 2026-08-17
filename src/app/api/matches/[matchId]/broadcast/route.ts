import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isVideoConfigured, videoSetupMessage, getVideoSettings } from "@/lib/video/provider";
import { getHighlightConfig } from "@/lib/video/highlights";
import { canManageBroadcast } from "@/lib/video/broadcast";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const user = await getCurrentUser();

    const [match, broadcasters, stream] = await Promise.all([
      prisma.match.findUnique({
        where: { id: matchId },
        select: { id: true, name: true, createdBy: true, status: true },
      }),
      prisma.matchBroadcaster.findMany({
        where: { matchId },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.matchLiveStream.findUnique({
        where: { matchId },
      }),
    ]);

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const myBroadcaster = user
      ? broadcasters.find((b) => b.userId === user.sub)
      : null;

    const { iceServers, maxViewers } = getVideoSettings();
    const { preRollSeconds, postRollSeconds } = getHighlightConfig();

    return NextResponse.json({
      match: {
        id: match.id,
        name: match.name,
        status: match.status,
      },
      configured: isVideoConfigured(),
      setupMessage: isVideoConfigured() ? null : videoSetupMessage(),
      canManage: user ? canManageBroadcast(match, user) : false,
      broadcaster: myBroadcaster
        ? {
            id: myBroadcaster.id,
            status: myBroadcaster.status,
            createdAt: myBroadcaster.createdAt,
          }
        : null,
      broadcasters: broadcasters.map((b) => ({
        id: b.id,
        userId: b.userId,
        user: b.user,
        status: b.status,
        createdAt: b.createdAt,
      })),
      stream: stream
        ? {
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
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load broadcast state" },
      { status: 500 }
    );
  }
}

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
      select: { id: true, createdBy: true },
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (!isVideoConfigured()) {
      return NextResponse.json(
        { error: "Live video is not configured yet on this server.", setupMessage: videoSetupMessage() },
        { status: 400 }
      );
    }

    const isCreator = canManageBroadcast(match, user);

    const existing = await prisma.matchBroadcaster.findUnique({
      where: { matchId_userId: { matchId, userId: user.sub } },
    });

    let broadcaster;
    if (existing) {
      if (existing.status === "REJECTED" && !isCreator) {
        return NextResponse.json(
          { error: "Your broadcast request was declined by the match creator." },
          { status: 403 }
        );
      }
      broadcaster = await prisma.matchBroadcaster.update({
        where: { id: existing.id },
        data: { status: isCreator ? "APPROVED" : "REQUESTED", decidedBy: isCreator ? user.sub : null },
      });
    } else {
      broadcaster = await prisma.matchBroadcaster.create({
        data: {
          matchId,
          userId: user.sub,
          status: isCreator ? "APPROVED" : "REQUESTED",
          decidedBy: isCreator ? user.sub : null,
        },
      });
    }

    return NextResponse.json({ broadcaster }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update broadcaster" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { matchId } = await params;
    const { broadcasterId, action } = await request.json();

    if (!broadcasterId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "broadcasterId and action (approve|reject) are required" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, createdBy: true },
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    if (!canManageBroadcast(match, user)) {
      return NextResponse.json(
        { error: "Only the match creator or an admin can approve broadcasters." },
        { status: 403 }
      );
    }

    const broadcaster = await prisma.matchBroadcaster.findUnique({
      where: { id: broadcasterId, matchId },
    });
    if (!broadcaster) {
      return NextResponse.json({ error: "Broadcast request not found" }, { status: 404 });
    }

    const updated = await prisma.matchBroadcaster.update({
      where: { id: broadcaster.id },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        decidedBy: user.sub,
      },
    });

    return NextResponse.json({ broadcaster: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update broadcaster" },
      { status: 500 }
    );
  }
}
