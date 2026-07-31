export const BALL_RESULTS = {
  DOT: "DOT",
  ONE: "ONE",
  TWO: "TWO",
  THREE: "THREE",
  FOUR: "FOUR",
  SIX: "SIX",
  WIDE: "WIDE",
  NO_BALL: "NO_BALL",
  BYE: "BYE",
  LEG_BYE: "LEG_BYE",
} as const;

export type BallResultType = (typeof BALL_RESULTS)[keyof typeof BALL_RESULTS];

export const BALL_RESULT_RUNS: Record<BallResultType, number> = {
  DOT: 0,
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  SIX: 6,
  WIDE: 1,
  NO_BALL: 1,
  BYE: 0,
  LEG_BYE: 0,
};

export const WICKET_TYPES = {
  BOWLED: "BOWLED",
  CAUGHT: "CAUGHT",
  LBW: "LBW",
  STUMPED: "STUMPED",
  RUN_OUT: "RUN_OUT",
  HIT_WICKET: "HIT_WICKET",
  RETIRED_HURT: "RETIRED_HURT",
  TIMED_OUT: "TIMED_OUT",
} as const;

export type WicketTypeValue = (typeof WICKET_TYPES)[keyof typeof WICKET_TYPES];

export const MATCH_FORMATS = {
  T20: { name: "T20", overs: 20, description: "Twenty20" },
  ODI: { name: "ODI", overs: 50, description: "One Day International" },
  TEST: { name: "TEST", overs: 0, description: "Test Match" },
  T10: { name: "T10", overs: 10, description: "Ten10" },
  CUSTOM: { name: "CUSTOM", overs: 0, description: "Custom Format" },
} as const;

export type MatchFormatType = keyof typeof MATCH_FORMATS;

export const USER_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  TOURNAMENT_ADMIN: "TOURNAMENT_ADMIN",
  SCORER: "SCORER",
  VIEWER: "VIEWER",
} as const;

export type UserRoleType = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const NOTIFICATION_TYPES = {
  SYSTEM: "SYSTEM",
  MATCH_CREATED: "MATCH_CREATED",
  MATCH_STARTED: "MATCH_STARTED",
  MATCH_COMPLETED: "MATCH_COMPLETED",
  TEAM_CREATED: "TEAM_CREATED",
  PLAYER_CREATED: "PLAYER_CREATED",
  BOUNDARY: "BOUNDARY",
  SIX: "SIX",
  WICKET: "WICKET",
  RESULT: "RESULT",
  INNINGS_BREAK: "INNINGS_BREAK",
  MILESTONE: "MILESTONE",
} as const;

export type NotificationTypeValue =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const TEAM_ROLES = {
  CAPTAIN: "CAPTAIN",
  VICE_CAPTAIN: "VICE_CAPTAIN",
  WICKETKEEPER: "WICKETKEEPER",
  COACH: "COACH",
  PLAYER: "PLAYER",
} as const;

export type TeamRoleType = (typeof TEAM_ROLES)[keyof typeof TEAM_ROLES];

export const MATCH_STATUS = {
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
  COMPLETED: "COMPLETED",
  ABANDONED: "ABANDONED",
  DELAYED: "DELAYED",
} as const;

export type MatchStatusType = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];

export const TOSS_DECISIONS = {
  BAT: "BAT",
  BOWL: "BOWL",
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
} as const;
