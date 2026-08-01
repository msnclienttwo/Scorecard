-- AlterTable
ALTER TABLE "Ball" ADD COLUMN     "fieldPositions" TEXT,
ADD COLUMN     "isFreeHit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOverthrow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "placementZone" TEXT,
ADD COLUMN     "shotType" TEXT;
