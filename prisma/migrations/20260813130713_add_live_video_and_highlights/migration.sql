-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LiveStreamStatus" AS ENUM ('CREATED', 'LIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "HighlightStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "MatchBroadcaster" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "BroadcastStatus" NOT NULL DEFAULT 'REQUESTED',
    "decidedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchBroadcaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchLiveStream" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "broadcasterId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'cloudflare',
    "providerLiveInputId" TEXT NOT NULL,
    "streamKey" TEXT,
    "rtmpsUrl" TEXT,
    "whipUrl" TEXT,
    "playbackUrl" TEXT,
    "status" "LiveStreamStatus" NOT NULL DEFAULT 'CREATED',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "providerVideoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchLiveStream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchVideoHighlight" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "ballId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "inningsNumber" INTEGER NOT NULL,
    "overNumber" INTEGER NOT NULL,
    "ballNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "HighlightStatus" NOT NULL DEFAULT 'PENDING',
    "providerVideoId" TEXT,
    "playbackUrl" TEXT,
    "downloadUrl" TEXT,
    "thumbnailUrl" TEXT,
    "error" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchVideoHighlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchBroadcaster_matchId_idx" ON "MatchBroadcaster"("matchId");

-- CreateIndex
CREATE INDEX "MatchBroadcaster_userId_idx" ON "MatchBroadcaster"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchBroadcaster_matchId_userId_key" ON "MatchBroadcaster"("matchId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchLiveStream_matchId_key" ON "MatchLiveStream"("matchId");

-- CreateIndex
CREATE INDEX "MatchLiveStream_matchId_idx" ON "MatchLiveStream"("matchId");

-- CreateIndex
CREATE INDEX "MatchLiveStream_broadcasterId_idx" ON "MatchLiveStream"("broadcasterId");

-- CreateIndex
CREATE INDEX "MatchVideoHighlight_matchId_idx" ON "MatchVideoHighlight"("matchId");

-- CreateIndex
CREATE INDEX "MatchVideoHighlight_matchId_status_idx" ON "MatchVideoHighlight"("matchId", "status");

-- CreateIndex
CREATE INDEX "MatchVideoHighlight_expiresAt_idx" ON "MatchVideoHighlight"("expiresAt");

-- AddForeignKey
ALTER TABLE "MatchBroadcaster" ADD CONSTRAINT "MatchBroadcaster_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchBroadcaster" ADD CONSTRAINT "MatchBroadcaster_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLiveStream" ADD CONSTRAINT "MatchLiveStream_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLiveStream" ADD CONSTRAINT "MatchLiveStream_broadcasterId_fkey" FOREIGN KEY ("broadcasterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchVideoHighlight" ADD CONSTRAINT "MatchVideoHighlight_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchVideoHighlight" ADD CONSTRAINT "MatchVideoHighlight_ballId_fkey" FOREIGN KEY ("ballId") REFERENCES "Ball"("id") ON DELETE CASCADE ON UPDATE CASCADE;
