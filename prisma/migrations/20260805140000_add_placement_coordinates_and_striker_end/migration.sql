-- AlterTable
ALTER TABLE "Ball" ADD COLUMN     "placementAngle" DOUBLE PRECISION,
ADD COLUMN     "placementDistance" DOUBLE PRECISION,
ADD COLUMN     "placementX" DOUBLE PRECISION,
ADD COLUMN     "placementY" DOUBLE PRECISION,
ADD COLUMN     "strikerEnd" TEXT DEFAULT 'BOTTOM';

-- AlterTable
ALTER TABLE "Innings" ADD COLUMN     "strikerEnd" TEXT DEFAULT 'BOTTOM';
