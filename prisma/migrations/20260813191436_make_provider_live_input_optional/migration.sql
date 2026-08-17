-- AlterTable
ALTER TABLE "MatchLiveStream" ALTER COLUMN "provider" SET DEFAULT 'webrtc',
ALTER COLUMN "providerLiveInputId" DROP NOT NULL;
