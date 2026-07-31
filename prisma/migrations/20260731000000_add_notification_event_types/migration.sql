-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'SYSTEM';
ALTER TYPE "NotificationType" ADD VALUE 'MATCH_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'MATCH_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'TEAM_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'PLAYER_CREATED';
