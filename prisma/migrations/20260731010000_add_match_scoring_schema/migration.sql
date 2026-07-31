-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MatchStatus" ADD VALUE 'READY';
ALTER TYPE "MatchStatus" ADD VALUE 'INNINGS_BREAK';
ALTER TYPE "MatchStatus" ADD VALUE 'ARCHIVED';

-- AlterEnum
ALTER TYPE "WicketType" ADD VALUE 'OBSTRUCTING_FIELD';

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_scorerId_fkey";

-- AlterTable
ALTER TABLE "Ball" ADD COLUMN     "dismissedPlayerId" TEXT,
ADD COLUMN     "recordedById" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "Innings" ADD COLUMN     "battingOrderCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentBowlerId" TEXT,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "nonStrikerId" TEXT,
ADD COLUMN     "strikerId" TEXT;

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "scorerId",
ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MatchScorer" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchScorer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPlayer" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "battingOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchScorer_matchId_idx" ON "MatchScorer"("matchId");

-- CreateIndex
CREATE INDEX "MatchScorer_userId_idx" ON "MatchScorer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchScorer_matchId_userId_key" ON "MatchScorer"("matchId", "userId");

-- CreateIndex
CREATE INDEX "MatchPlayer_matchId_idx" ON "MatchPlayer"("matchId");

-- CreateIndex
CREATE INDEX "MatchPlayer_teamId_idx" ON "MatchPlayer"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPlayer_matchId_playerId_key" ON "MatchPlayer"("matchId", "playerId");

-- CreateIndex
CREATE INDEX "Ball_bowlerId_idx" ON "Ball"("bowlerId");

-- CreateIndex
CREATE INDEX "Ball_batsmanId_idx" ON "Ball"("batsmanId");

-- AddForeignKey
ALTER TABLE "MatchScorer" ADD CONSTRAINT "MatchScorer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchScorer" ADD CONSTRAINT "MatchScorer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
