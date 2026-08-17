import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true },
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const highlights = await prisma.matchVideoHighlight.findMany({
      where: {
        matchId,
        expiresAt: { gt: new Date() },
        status: { in: ["PENDING", "PROCESSING", "READY"] },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({
      highlights: highlights.map((h) => ({
        id: h.id,
        matchId: h.matchId,
        ballId: h.ballId,
        eventType: h.eventType,
        inningsNumber: h.inningsNumber,
        overNumber: h.overNumber,
        ballNumber: h.ballNumber,
        title: h.title,
        startTime: h.startTime,
        endTime: h.endTime,
        duration: h.duration,
        status: h.status,
        playbackUrl: h.playbackUrl,
        thumbnailUrl: h.thumbnailUrl,
        downloadUrl: h.downloadUrl,
        createdAt: h.createdAt,
        expiresAt: h.expiresAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load highlights" },
      { status: 500 }
    );
  }
}
