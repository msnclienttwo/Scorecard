-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'TOURNAMENT_ADMIN', 'SCORER', 'VIEWER');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'ABANDONED', 'DELAYED');

-- CreateEnum
CREATE TYPE "TossDecision" AS ENUM ('BAT', 'BOWL');

-- CreateEnum
CREATE TYPE "BallType" AS ENUM ('NORMAL', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE');

-- CreateEnum
CREATE TYPE "WicketType" AS ENUM ('BOWLED', 'CAUGHT', 'LBW', 'STUMPED', 'RUN_OUT', 'HIT_WICKET', 'RETIRED_HURT', 'TIMED_OUT');

-- CreateEnum
CREATE TYPE "MatchFormat" AS ENUM ('T20', 'ODI', 'TEST', 'T10', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MATCH_STARTED', 'BOUNDARY', 'SIX', 'WICKET', 'RESULT', 'INNINGS_BREAK', 'MILESTONE');

-- CreateEnum
CREATE TYPE "BallResult" AS ENUM ('DOT', 'ONE', 'TWO', 'THREE', 'FOUR', 'SIX', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "image" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "logo" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#2563EB',
    "secondaryColor" TEXT NOT NULL DEFAULT '#00D4FF',
    "ownerId" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "founded" INTEGER,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "image" TEXT,
    "nationality" TEXT,
    "battingStyle" TEXT,
    "bowlingStyle" TEXT,
    "role" TEXT,
    "bio" TEXT,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ground" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "capacity" INTEGER,
    "image" TEXT,
    "pitchType" TEXT,
    "outfield" TEXT,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ground_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "description" TEXT,
    "format" "MatchFormat" NOT NULL DEFAULT 'T20',
    "logo" TEXT,
    "banner" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxTeams" INTEGER,
    "totalOvers" INTEGER NOT NULL DEFAULT 20,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentTeam" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "groupId" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentStanding" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "ties" INTEGER NOT NULL DEFAULT 0,
    "noResult" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "nrr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentStanding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "format" "MatchFormat" NOT NULL DEFAULT 'T20',
    "totalOvers" INTEGER NOT NULL DEFAULT 20,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "venue" TEXT,
    "groundId" TEXT,
    "weather" TEXT,
    "pitchCondition" TEXT,
    "tossWinner" TEXT,
    "tossDecision" "TossDecision",
    "result" TEXT,
    "winningTeamId" TEXT,
    "matchReferee" TEXT,
    "umpire1" TEXT,
    "umpire2" TEXT,
    "thirdUmpire" TEXT,
    "reserveUmpire" TEXT,
    "createdBy" TEXT NOT NULL,
    "scorerId" TEXT,
    "tournamentId" TEXT,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerOfMatch" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "PlayerOfMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManOfTheMatch" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "ManOfTheMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Innings" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "inningsNumber" INTEGER NOT NULL,
    "battingTeam" TEXT NOT NULL,
    "bowlingTeam" TEXT NOT NULL,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "totalWickets" INTEGER NOT NULL DEFAULT 0,
    "totalOvers" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extras" INTEGER NOT NULL DEFAULT 0,
    "declared" BOOLEAN NOT NULL DEFAULT false,
    "targetScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Innings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Over" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "overNumber" INTEGER NOT NULL,
    "bowlerId" TEXT NOT NULL,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "totalWickets" INTEGER NOT NULL DEFAULT 0,
    "ballsCount" INTEGER NOT NULL DEFAULT 0,
    "extras" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isMaiden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Over_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ball" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "overId" TEXT NOT NULL,
    "ballNumber" INTEGER NOT NULL,
    "bowlerId" TEXT NOT NULL,
    "batsmanId" TEXT NOT NULL,
    "nonStrikerId" TEXT NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "isExtra" BOOLEAN NOT NULL DEFAULT false,
    "extraType" "BallType",
    "extraRuns" INTEGER NOT NULL DEFAULT 0,
    "isWicket" BOOLEAN NOT NULL DEFAULT false,
    "wicketType" "WicketType",
    "fielderId" TEXT,
    "description" TEXT,
    "ballResult" "BallResult" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ball_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattingScorecard" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "batPosition" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "balls" INTEGER NOT NULL DEFAULT 0,
    "fours" INTEGER NOT NULL DEFAULT 0,
    "sixes" INTEGER NOT NULL DEFAULT 0,
    "isNotOut" BOOLEAN NOT NULL DEFAULT false,
    "dismissalType" TEXT,
    "bowlerId" TEXT,
    "fielderId" TEXT,
    "description" TEXT,
    "strikeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "battingOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BattingScorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BowlingScorecard" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "overs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maidens" INTEGER NOT NULL DEFAULT 0,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "wickets" INTEGER NOT NULL DEFAULT 0,
    "wides" INTEGER NOT NULL DEFAULT 0,
    "noBalls" INTEGER NOT NULL DEFAULT 0,
    "economy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "strikeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dotBalls" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BowlingScorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FallOfWicket" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "wicketNumber" INTEGER NOT NULL,
    "playerId" TEXT NOT NULL,
    "runs" INTEGER NOT NULL,
    "overs" DOUBLE PRECISION NOT NULL,
    "bowlerId" TEXT,
    "batterName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FallOfWicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "overNumber" DOUBLE PRECISION,
    "ballNumber" INTEGER,
    "inningsNumber" INTEGER,
    "data" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commentary" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "overNumber" DOUBLE PRECISION,
    "ballNumber" INTEGER,
    "inningsNumber" INTEGER,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
    "isHighlight" BOOLEAN NOT NULL DEFAULT false,
    "eventType" TEXT,
    "emoji" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commentary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "matchId" TEXT,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'gold',
    "tournamentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gallery" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "type" TEXT NOT NULL DEFAULT 'image',
    "tournamentId" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "Team_name_idx" ON "Team"("name");

-- CreateIndex
CREATE INDEX "Team_shortName_idx" ON "Team"("shortName");

-- CreateIndex
CREATE INDEX "Player_name_idx" ON "Player"("name");

-- CreateIndex
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");

-- CreateIndex
CREATE INDEX "Ground_name_idx" ON "Ground"("name");

-- CreateIndex
CREATE INDEX "Tournament_name_idx" ON "Tournament"("name");

-- CreateIndex
CREATE INDEX "Tournament_startDate_idx" ON "Tournament"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentTeam_tournamentId_teamId_key" ON "TournamentTeam"("tournamentId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentStanding_tournamentId_teamId_key" ON "TournamentStanding"("tournamentId", "teamId");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Match_scheduledAt_idx" ON "Match"("scheduledAt");

-- CreateIndex
CREATE INDEX "Match_tournamentId_idx" ON "Match"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerOfMatch_matchId_key" ON "PlayerOfMatch"("matchId");

-- CreateIndex
CREATE INDEX "PlayerOfMatch_matchId_idx" ON "PlayerOfMatch"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "ManOfTheMatch_matchId_key" ON "ManOfTheMatch"("matchId");

-- CreateIndex
CREATE INDEX "ManOfTheMatch_matchId_idx" ON "ManOfTheMatch"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Innings_matchId_inningsNumber_key" ON "Innings"("matchId", "inningsNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Over_inningsId_overNumber_key" ON "Over"("inningsId", "overNumber");

-- CreateIndex
CREATE INDEX "Ball_inningsId_idx" ON "Ball"("inningsId");

-- CreateIndex
CREATE INDEX "Ball_overId_idx" ON "Ball"("overId");

-- CreateIndex
CREATE UNIQUE INDEX "BattingScorecard_inningsId_playerId_key" ON "BattingScorecard"("inningsId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "BowlingScorecard_inningsId_playerId_key" ON "BowlingScorecard"("inningsId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "FallOfWicket_inningsId_wicketNumber_key" ON "FallOfWicket"("inningsId", "wicketNumber");

-- CreateIndex
CREATE INDEX "MatchEvent_matchId_idx" ON "MatchEvent"("matchId");

-- CreateIndex
CREATE INDEX "MatchEvent_type_idx" ON "MatchEvent"("type");

-- CreateIndex
CREATE INDEX "Commentary_matchId_idx" ON "Commentary"("matchId");

-- CreateIndex
CREATE INDEX "Commentary_createdAt_idx" ON "Commentary"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeam" ADD CONSTRAINT "TournamentTeam_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentTeam" ADD CONSTRAINT "TournamentTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentStanding" ADD CONSTRAINT "TournamentStanding_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentStanding" ADD CONSTRAINT "TournamentStanding_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_scorerId_fkey" FOREIGN KEY ("scorerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_groundId_fkey" FOREIGN KEY ("groundId") REFERENCES "Ground"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerOfMatch" ADD CONSTRAINT "PlayerOfMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManOfTheMatch" ADD CONSTRAINT "ManOfTheMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManOfTheMatch" ADD CONSTRAINT "ManOfTheMatch_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Innings" ADD CONSTRAINT "Innings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Over" ADD CONSTRAINT "Over_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "Innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ball" ADD CONSTRAINT "Ball_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "Innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ball" ADD CONSTRAINT "Ball_overId_fkey" FOREIGN KEY ("overId") REFERENCES "Over"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattingScorecard" ADD CONSTRAINT "BattingScorecard_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "Innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattingScorecard" ADD CONSTRAINT "BattingScorecard_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BowlingScorecard" ADD CONSTRAINT "BowlingScorecard_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "Innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BowlingScorecard" ADD CONSTRAINT "BowlingScorecard_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FallOfWicket" ADD CONSTRAINT "FallOfWicket_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "Innings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentary" ADD CONSTRAINT "Commentary_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentary" ADD CONSTRAINT "Commentary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsor" ADD CONSTRAINT "Sponsor_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
