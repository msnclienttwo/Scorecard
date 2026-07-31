import type {
  User as PrismaUser,
  Team as PrismaTeam,
  Player as PrismaPlayer,
  Match as PrismaMatch,
  Innings as PrismaInnings,
  Over as PrismaOver,
  Ball as PrismaBall,
  Tournament as PrismaTournament,
  BattingScorecard as PrismaBattingScorecard,
  BowlingScorecard as PrismaBowlingScorecard,
  MatchEvent as PrismaMatchEvent,
  Commentary as PrismaCommentary,
  Notification as PrismaNotification,
} from "@prisma/client";

export type User = PrismaUser;

export type Team = PrismaTeam;

export type Player = PrismaPlayer;

export type Match = PrismaMatch;

export type Innings = PrismaInnings;

export type Over = PrismaOver;

export type Ball = PrismaBall;

export type Tournament = PrismaTournament;

export type BattingScorecard = PrismaBattingScorecard;

export type BowlingScorecard = PrismaBowlingScorecard;

export type MatchEvent = PrismaMatchEvent;

export type Commentary = PrismaCommentary;

export type Notification = PrismaNotification;

export interface Scorecard {
  innings: Innings;
  batting: BattingScorecard[];
  bowling: BowlingScorecard[];
  fallOfWickets: FallOfWicket[];
}

export interface FallOfWicket {
  id: string;
  inningsId: string;
  wicketNumber: number;
  playerId: string;
  runs: number;
  overs: number;
  bowlerId: string | null;
  batterName: string;
  createdAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SocketEvent {
  type: string;
  payload: unknown;
  matchId: string;
  timestamp: string;
}

export interface ScoringState {
  matchId: string;
  innings: Innings | null;
  currentOver: Over | null;
  currentBatsman: Player | null;
  currentNonStriker: Player | null;
  currentBowler: Player | null;
  recentBalls: Ball[];
  ballCount: number;
  overCount: number;
  totalRuns: number;
  totalWickets: number;
  extras: number;
  runRate: number;
  requiredRunRate: number | null;
  targetScore: number | null;
}

export interface MatchStats {
  matchId: string;
  totalOvers: number;
  runRate: number;
  requiredRunRate: number | null;
  currentRunRate: number;
  partnership: {
    runs: number;
    balls: number;
    batsman1: string;
    batsman2: string;
  };
  lastWickets: Array<{
    batterName: string;
    runs: number;
    balls: number;
    wicketNumber: number;
  }>;
  lastOvers: Array<{
    overNumber: number;
    runs: number;
    wickets: number;
    extras: number;
  }>;
  milestones: Array<{
    playerId: string;
    playerName: string;
    type: string;
    value: number;
  }>;
}
