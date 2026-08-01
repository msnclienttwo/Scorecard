import { z } from "zod";
import { isDirectImageUrl, LOGO_VALIDATION_MESSAGE } from "@/lib/logo";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createMatchSchema = z.object({
  name: z.string().min(1, "Match name is required").max(200),
  description: z.string().max(1000).optional(),
  format: z.enum(["T20", "ODI", "TEST", "T10", "CUSTOM"]),
  totalOvers: z.number().int().min(1).max(200),
  scheduledAt: z.string().datetime(),
  venue: z.string().max(200).optional(),
  groundId: z.string().optional(),
  weather: z.string().max(100).optional(),
  pitchCondition: z.string().max(100).optional(),
  homeTeamId: z.string().min(1, "Home team is required"),
  awayTeamId: z.string().min(1, "Away team is required"),
  tournamentId: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100),
  shortName: z
    .string()
    .min(1, "Short name is required")
    .max(10),
  logo: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#2563EB"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#00D4FF"),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  founded: z.number().int().min(1800).max(2100).optional(),
  description: z.string().max(1000).optional(),
});

export const createPlayerSchema = z.object({
  name: z.string().min(1, "Player name is required").max(100),
  shortName: z.string().max(50).optional(),
  dateOfBirth: z.string().datetime().optional(),
  image: z.string().url().optional().nullable(),
  nationality: z.string().max(100).optional(),
  battingStyle: z
    .enum(["Right-hand", "Left-hand"])
    .optional(),
  bowlingStyle: z
    .enum([
      "Right-arm fast",
      "Right-arm medium",
      "Right-arm off-spin",
      "Left-arm fast",
      "Left-arm medium",
      "Left-arm orthodox",
      "Leg-spin",
      "Doosra",
    ])
    .optional(),
  role: z
    .enum([
      "Batsman",
      "Bowler",
      "All-rounder",
      "Wicketkeeper",
      "Wicketkeeper-batsman",
    ])
    .optional(),
  bio: z.string().max(1000).optional(),
  isCaptain: z.boolean().default(false),
  teamId: z.string().min(1, "Team is required"),
});

export const createTournamentSchema = z
  .object({
    name: z.string().min(1, "Tournament name is required").max(200),
    shortName: z.string().max(50).optional(),
    description: z.string().max(1000).optional(),
    format: z.enum(["T20", "ODI", "TEST", "T10", "CUSTOM"]),
  logo: z
    .string()
    .url()
    .refine((v) => isDirectImageUrl(v), { message: LOGO_VALIDATION_MESSAGE })
    .optional()
    .nullable(),
    banner: z.string().url().optional().nullable(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    maxTeams: z.number().int().min(2).max(100).optional(),
    totalOvers: z.number().int().min(1).max(200).default(20),
    isPublic: z.boolean().default(true),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const addBallSchema = z.object({
  inningsId: z.string().min(1),
  overId: z.string().min(1),
  bowlerId: z.string().min(1),
  batsmanId: z.string().min(1),
  nonStrikerId: z.string().min(1),
  runs: z.number().int().min(0).max(6),
  ballResult: z.enum([
    "DOT",
    "ONE",
    "TWO",
    "THREE",
    "FOUR",
    "SIX",
    "WIDE",
    "NO_BALL",
    "BYE",
    "LEG_BYE",
  ]),
  isExtra: z.boolean().default(false),
  extraType: z
    .enum(["NORMAL", "WIDE", "NO_BALL", "BYE", "LEG_BYE"])
    .optional(),
  extraRuns: z.number().int().min(0).max(7).default(0),
  isWicket: z.boolean().default(false),
  wicketType: z
    .enum([
      "BOWLED",
      "CAUGHT",
      "LBW",
      "STUMPED",
      "RUN_OUT",
      "HIT_WICKET",
      "RETIRED_HURT",
      "TIMED_OUT",
    ])
    .optional(),
  fielderId: z.string().optional(),
  description: z.string().max(500).optional(),
});

export const addCommentarySchema = z.object({
  matchId: z.string().min(1),
  content: z.string().min(1, "Commentary text is required").max(2000),
  overNumber: z.number().optional(),
  ballNumber: z.number().int().min(1).max(6).optional(),
  inningsNumber: z.number().int().min(1).max(4).optional(),
  isHighlight: z.boolean().default(false),
  eventType: z.string().max(50).optional(),
  emoji: z.string().max(10).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type AddBallInput = z.infer<typeof addBallSchema>;
export type AddCommentaryInput = z.infer<typeof addCommentarySchema>;
