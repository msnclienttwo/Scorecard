"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "@/store/useSocketStore";

const SOCKET_EVENTS = [
  "ball:added",
  "ball:updated",
  "ball:deleted",
  "score:updated",
  "match:updated",
  "innings:started",
  "innings:ended",
  "strike:swapped",
  "commentary:added",
];

export function useMatchLive(matchId: string) {
  const queryClient = useQueryClient();
  const { connect, subscribe, unsubscribe, on, off, isConnected } =
    useSocketStore();

  const matchQuery = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}`);
      if (!res.ok) throw new Error("Match not found");
      return res.json() as Promise<{ match: MatchDetail }>;
    },
    refetchInterval: (query) =>
      ["LIVE", "INNINGS_BREAK"].includes(query.state.data?.match?.status ?? "")
        ? 5_000
        : false,
    staleTime: 5_000,
  });

  const inningsQuery = useQuery({
    queryKey: ["innings", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}/innings`);
      if (!res.ok) return { innings: [] as InningsDetail[] };
      return res.json() as Promise<{ innings: InningsDetail[] }>;
    },
    refetchInterval: (query) =>
      query.state.data?.innings?.some((i) => i.endedAt === null) ? 5_000 : false,
    staleTime: 5_000,
  });

  useEffect(() => {
    if (!matchId) return;
    connect();
  }, [matchId, connect]);

  useEffect(() => {
    if (!isConnected || !matchId) return;

    subscribe(matchId);

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
      queryClient.invalidateQueries({ queryKey: ["innings", matchId] });
    };

    const handlers = SOCKET_EVENTS.map((event) => {
      const handler = () => invalidate();
      on(event, handler);
      return { event, handler };
    });

    return () => {
      unsubscribe(matchId);
      handlers.forEach(({ event, handler }) => off(event, handler));
    };
  }, [
    isConnected,
    matchId,
    subscribe,
    unsubscribe,
    on,
    off,
    queryClient,
  ]);

  return {
    match: matchQuery.data?.match,
    innings: inningsQuery.data?.innings ?? [],
    isLoading: matchQuery.isLoading || inningsQuery.isLoading,
    error: matchQuery.error ?? inningsQuery.error,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
      queryClient.invalidateQueries({ queryKey: ["innings", matchId] });
    },
  };
}

export interface PlayerRef {
  id: string;
  name: string;
  shortName?: string | null;
  role?: string | null;
}

export interface TeamRef {
  id: string;
  name: string;
  shortName?: string | null;
  logo?: string | null;
}

export interface BattingCardRef {
  id: string;
  playerId: string;
  player: PlayerRef;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isNotOut: boolean;
  dismissalType?: string | null;
}

export interface BowlingCardRef {
  id: string;
  playerId: string;
  player: PlayerRef;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  wides: number;
  noBalls: number;
  economy: number;
  dotBalls: number;
}

export interface FallOfWicketRef {
  id: string;
  wicketNumber: number;
  playerId: string;
  runs: number;
  overs: number;
  batterName: string;
}

export interface BallRef {
  id: string;
  inningsId: string;
  overId: string;
  ballNumber: number;
  bowlerId: string;
  batsmanId: string;
  nonStrikerId: string;
  runs: number;
  isExtra: boolean;
  extraType?: string | null;
  extraRuns: number;
  isWicket: boolean;
  wicketType?: string | null;
  dismissedPlayerId?: string | null;
  fielderId?: string | null;
  ballResult?: string;
  description?: string | null;
  createdAt?: string;
  over?: { id: string; overNumber: number } | null;
}

export interface OverRef {
  id: string;
  overNumber: number;
  bowlerId: string;
  totalRuns: number;
  totalWickets: number;
  ballsCount: number;
  extras: number;
  isCompleted: boolean;
  balls?: BallRef[];
}

export interface InningsDetail {
  id: string;
  inningsNumber: number;
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  extras: number;
  targetScore: number | null;
  strikerId: string | null;
  nonStrikerId: string | null;
  currentBowlerId: string | null;
  battingOrderCount: number;
  endedAt: string | null;
  battingCard: BattingCardRef[];
  bowlingCard: BowlingCardRef[];
  fallOfWickets: FallOfWicketRef[];
  overs: OverRef[];
}

export interface SquadRef {
  id: string;
  playerId: string;
  teamId: string;
  isCaptain: boolean;
  battingOrder?: number | null;
  player: PlayerRef;
  team: TeamRef;
}

export interface ScorerRef {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
}

export interface ScoringAccessRef {
  allowed: boolean;
  isAdmin: boolean;
  isCreator: boolean;
  isAssigned: boolean;
  hasAssignedScorers: boolean;
  reason?: string | null;
}

export interface MatchDetail {
  id: string;
  name: string;
  status: string;
  format: string;
  totalOvers: number;
  scheduledAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  venue?: string | null;
  tossWinner?: string | null;
  tossDecision?: string | null;
  result?: string | null;
  winningTeamId?: string | null;
  isPaused: boolean;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  tournament?: { id: string; name: string } | null;
  matchScorers: ScorerRef[];
  squads: SquadRef[];
  innings: InningsDetail[];
  events: Array<{
    id: string;
    type: string;
    description?: string | null;
    timestamp: string;
    inningsNumber?: number | null;
  }>;
  commentary: Array<{
    id: string;
    content: string;
    eventType?: string | null;
    isHighlight?: boolean;
    isAutomatic?: boolean;
    createdAt: string;
    inningsNumber?: number | null;
  }>;
  creator?: { id: string; name: string } | null;
  scoringAccess: ScoringAccessRef;
}
