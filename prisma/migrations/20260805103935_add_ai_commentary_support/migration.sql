-- AlterTable
ALTER TABLE "Commentary" ADD COLUMN     "aiGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "ballId" TEXT,
ADD COLUMN     "edited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "generatedBy" TEXT,
ADD COLUMN     "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "style" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CommentarySettings" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "voiceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoCommentary" BOOLEAN NOT NULL DEFAULT true,
    "style" TEXT NOT NULL DEFAULT 'professional',
    "language" TEXT NOT NULL DEFAULT 'en',
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "creativity" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentarySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommentarySettings_matchId_idx" ON "CommentarySettings"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentarySettings_matchId_userId_key" ON "CommentarySettings"("matchId", "userId");

-- CreateIndex
CREATE INDEX "Commentary_matchId_createdAt_idx" ON "Commentary"("matchId", "createdAt");

-- CreateIndex
CREATE INDEX "Commentary_ballId_idx" ON "Commentary"("ballId");

-- AddForeignKey
ALTER TABLE "Commentary" ADD CONSTRAINT "Commentary_ballId_fkey" FOREIGN KEY ("ballId") REFERENCES "Ball"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentarySettings" ADD CONSTRAINT "CommentarySettings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentarySettings" ADD CONSTRAINT "CommentarySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
