-- CreateIndex
CREATE INDEX "Ball_inningsId_ballNumber_idx" ON "Ball"("inningsId", "ballNumber");

-- CreateIndex
CREATE INDEX "MatchPlayer_matchId_teamId_idx" ON "MatchPlayer"("matchId", "teamId");
