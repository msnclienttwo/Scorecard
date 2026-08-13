import prisma from "@/lib/prisma";
import type { Ball } from "@prisma/client";
import {
  buildDeterministicCommentary,
  describeBallContext,
  overLabel,
  type CommentaryBallContext,
  type DeterministicContext,
} from "@/lib/commentaryTemplates";
import {
  getAIProvider,
  isAnyAIProviderConfigured,
  providerName,
  resolveProvider,
  type AIProviderId,
} from "@/services/ai.provider";
import { getLanguage, targetLanguagePrompt } from "@/lib/language";
import { emitCommentaryAdded, emitCommentaryUpdated } from "@/lib/realtime";
import { parseOversToBalls } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface CommentarySettingsInput {
  aiEnabled: boolean;
  voiceEnabled: boolean;
  autoCommentary: boolean;
  style: string;
  language: string;
  provider: string;
  temperature: number;
  creativity: number;
}

export const DEFAULT_COMMENTARY_SETTINGS: CommentarySettingsInput = {
  aiEnabled: false,
  voiceEnabled: true,
  autoCommentary: true,
  style: "professional",
  language: "en",
  provider: "openai",
  temperature: 0.7,
  creativity: 0.5,
};

export async function getCommentarySettings(
  matchId: string,
  userId: string
): Promise<CommentarySettingsInput> {
  const row = await prisma.commentarySettings.findUnique({
    where: { matchId_userId: { matchId, userId } },
  });
  if (!row) return { ...DEFAULT_COMMENTARY_SETTINGS };
  return {
    aiEnabled: row.aiEnabled,
    voiceEnabled: row.voiceEnabled,
    autoCommentary: row.autoCommentary,
    style: row.style,
    language: row.language,
    provider: row.provider,
    temperature: row.temperature,
    creativity: row.creativity,
  };
}

export async function saveCommentarySettings(
  matchId: string,
  userId: string,
  patch: Partial<CommentarySettingsInput>
): Promise<CommentarySettingsInput> {
  const current = await getCommentarySettings(matchId, userId);
  const merged = { ...current, ...patch };
  await prisma.commentarySettings.upsert({
    where: { matchId_userId: { matchId, userId } },
    update: {
      aiEnabled: merged.aiEnabled,
      voiceEnabled: merged.voiceEnabled,
      autoCommentary: merged.autoCommentary,
      style: merged.style,
      language: merged.language,
      provider: merged.provider,
      temperature: merged.temperature,
      creativity: merged.creativity,
    },
    create: {
      matchId,
      userId,
      aiEnabled: merged.aiEnabled,
      voiceEnabled: merged.voiceEnabled,
      autoCommentary: merged.autoCommentary,
      style: merged.style,
      language: merged.language,
      provider: merged.provider,
      temperature: merged.temperature,
      creativity: merged.creativity,
    },
  });
  return merged;
}

// ---------------------------------------------------------------------------
// Match context
// ---------------------------------------------------------------------------

export interface MatchContext {
  matchId: string;
  matchName: string;
  format: string;
  totalOvers: number;
  inningsId: string;
  inningsNumber: number;
  battingTeam: string;
  bowlingTeam: string;
  currentRuns: number;
  currentWickets: number;
  overs: number;
  legalBalls: number;
  target: number | null;
  crr: number;
  requiredRunRate: number | null;
  partnership: { runs: number; balls: number };
  strikerName: string | null;
  nonStrikerName: string | null;
  bowlerName: string | null;
  recentOvers: string[];
  events: string[];
  description: string;
}

export async function buildMatchContext(
  matchId: string,
  inningsId: string
): Promise<MatchContext | null> {
  const [match, innings] = await Promise.all([
    prisma.match.findUnique({
      where: { id: matchId },
      include: { events: { orderBy: { timestamp: "desc" }, take: 10 } },
    }),
    prisma.innings.findUnique({
      where: { id: inningsId },
      include: {
        fallOfWickets: { orderBy: { wicketNumber: "asc" }, select: { runs: true, overs: true } },
        bowlingCard: {
          select: { playerId: true, wickets: true, runs: true, overs: true, maidens: true },
        },
        battingCard: { select: { playerId: true, runs: true, balls: true } },
        overs: {
          orderBy: { overNumber: "asc" },
          select: { overNumber: true, totalRuns: true, totalWickets: true },
        },
      },
    }),
  ]);

  if (!match || !innings) return null;

  const legalBalls = parseOversToBalls(innings.totalOvers);
  const overs = innings.totalOvers;
  const currentRuns = innings.totalRuns;
  const currentWickets = innings.totalWickets;
  const target = innings.targetScore;
  const crr = legalBalls > 0 ? currentRuns / (legalBalls / 6) : 0;

  const ballsRemaining = match.totalOvers * 6 - legalBalls;
  const requiredRunRate =
    target != null && target > currentRuns && ballsRemaining > 0
      ? (target - currentRuns) / (ballsRemaining / 6)
      : null;

  const lastFow = innings.fallOfWickets[innings.fallOfWickets.length - 1];
  const partnership = {
    runs: currentRuns - (lastFow?.runs ?? 0),
    balls: legalBalls - parseOversToBalls(lastFow?.overs ?? 0),
  };

  const playerIds = new Set<string>();
  for (const b of innings.bowlingCard) playerIds.add(b.playerId);
  for (const b of innings.battingCard) playerIds.add(b.playerId);
  if (innings.strikerId) playerIds.add(innings.strikerId);
  if (innings.nonStrikerId) playerIds.add(innings.nonStrikerId);
  if (innings.currentBowlerId) playerIds.add(innings.currentBowlerId);

  const players = await prisma.player.findMany({
    where: { id: { in: [...playerIds] } },
    select: { id: true, name: true },
  });
  const nameById = new Map(players.map((p) => [p.id, p.name]));

  const recentOvers = innings.overs.slice(-3).map(
    (o) =>
      `over ${o.overNumber}: ${o.totalRuns}/${o.totalWickets}`
  );

  const events = match.events.slice(0, 5).map((e) => e.type);

  const description = [
    `match: ${match.name}`,
    `format: ${match.format}`,
    `innings ${innings.inningsNumber}: ${currentRuns}/${currentWickets} in ${overs} overs`,
    target != null ? `target: ${target}` : "",
    `current run rate: ${crr.toFixed(2)}`,
    requiredRunRate != null ? `required run rate: ${requiredRunRate.toFixed(2)}` : "",
    `partnership: ${partnership.runs} runs off ${partnership.balls} balls`,
    recentOvers.length ? `recent overs: ${recentOvers.join(" | ")}` : "",
    `scoreboard: ${nameById.get(innings.strikerId ?? "") ?? "?"} and ${
      nameById.get(innings.nonStrikerId ?? "") ?? "?"
    } at the crease, ${nameById.get(innings.currentBowlerId ?? "") ?? "?"} bowling`,
    events.length ? `match events: ${events.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  return {
    matchId,
    matchName: match.name,
    format: match.format,
    totalOvers: match.totalOvers,
    inningsId: innings.id,
    inningsNumber: innings.inningsNumber,
    battingTeam: innings.battingTeam,
    bowlingTeam: innings.bowlingTeam,
    currentRuns,
    currentWickets,
    overs,
    legalBalls,
    target,
    crr,
    requiredRunRate,
    partnership,
    strikerName: nameById.get(innings.strikerId ?? "") ?? null,
    nonStrikerName: nameById.get(innings.nonStrikerId ?? "") ?? null,
    bowlerName: nameById.get(innings.currentBowlerId ?? "") ?? null,
    recentOvers,
    events,
    description,
  };
}

// ---------------------------------------------------------------------------
// Match events
// ---------------------------------------------------------------------------

export interface DetectedEvent {
  type: string;
  label: string;
}

export interface EventDetectionInput {
  ball: Ball;
  inningsNumber: number;
  currentRuns: number;
  currentWickets: number;
  target: number | null;
  format: string;
  totalOvers: number;
  legalBalls: number;
  overNumber: number;
  overRuns: number;
  overWickets: number;
  isOverComplete: boolean;
  isMaiden: boolean;
  bowlerWicketsAfter: number;
  batterRunsAfter: number;
  batterRunsBefore: number;
  previousBalls: { isWicket: boolean; bowlerId: string }[];
  requiredRunRate: number | null;
}

export function detectMatchEvents(input: EventDetectionInput): DetectedEvent[] {
  const events: DetectedEvent[] = [];
  const { ball } = input;

  const inSuperOver = input.inningsNumber > 2;
  if (inSuperOver) {
    events.push({ type: "SUPER_OVER", label: "Super Over" });
  }

  const powerplayLimit =
    input.format === "T10" ? 2 : input.format === "ODI" ? 10 : 6;
  if (input.format !== "TEST" && input.overNumber <= powerplayLimit) {
    events.push({ type: "POWERPLAY", label: `Powerplay (over ${input.overNumber})` });
  }

  if (input.batterRunsAfter >= 50 && input.batterRunsBefore < 50) {
    events.push({ type: "FIFTY", label: "Batter reaches fifty" });
  }
  if (input.batterRunsAfter >= 100 && input.batterRunsBefore < 100) {
    events.push({ type: "CENTURY", label: "Batter reaches a century" });
  }

  if (ball.isWicket) {
    const prior = input.previousBalls;
    const streak = [ball, ...prior]
      .filter((b) => b.isWicket && b.bowlerId === ball.bowlerId)
      .length;
    if (streak >= 3 && prior.length >= 2) {
      events.push({ type: "HAT_TRICK", label: "Hat-trick!" });
    }
    if (input.currentWickets >= 10) {
      events.push({ type: "LAST_WICKET", label: "All out — last wicket" });
    }
  }

  if (input.isOverComplete && input.isMaiden) {
    events.push({ type: "MAIDEN", label: "Maiden over" });
  }

  if (input.target != null && input.currentRuns >= input.target) {
    events.push({ type: "WINNING_SHOT", label: "Winning shot — match won" });
  } else if (
    input.target != null &&
    input.target - input.currentRuns === 1 &&
    ball.runs + ball.extraRuns > 0
  ) {
    events.push({ type: "ONE_TO_WIN", label: "One run to win" });
  }

  if (
    input.target != null &&
    input.requiredRunRate != null &&
    input.requiredRunRate > 12
  ) {
    events.push({ type: "RUN_RATE_PRESSURE", label: "Required run rate climbing" });
  }

  return events;
}

// ---------------------------------------------------------------------------
// Deterministic context
// ---------------------------------------------------------------------------

export function toDeterministicContext(
  ball: Ball,
  strikerName: string,
  bowlerName: string,
  fielderName: string | undefined,
  ctx?: Partial<{
    overNumber: number;
    ballNumber: number;
    inningsNumber: number;
    matchFormat: string;
    currentRuns: number;
    currentWickets: number;
    target: number | null;
    overRuns: number;
  }>
): DeterministicContext {
  const ballCtx: CommentaryBallContext = {
    runs: ball.runs,
    extraRuns: ball.extraRuns,
    extraType: ball.extraType,
    isWicket: ball.isWicket,
    wicketType: ball.wicketType,
    ballResult: ball.ballResult,
    shotType: ball.shotType,
    placementZone: ball.placementZone,
    placementDistance: ball.placementDistance,
    fieldPositions: ball.fieldPositions,
    isFreeHit: ball.isFreeHit,
    isOverthrow: ball.isOverthrow,
  };
  return {
    ball: ballCtx,
    striker: strikerName,
    bowler: bowlerName,
    fielder: fielderName,
    overNumber: ctx?.overNumber,
    ballNumber: ctx?.ballNumber,
    inningsNumber: ctx?.inningsNumber,
    matchFormat: ctx?.matchFormat,
    currentRuns: ctx?.currentRuns,
    currentWickets: ctx?.currentWickets,
    target: ctx?.target,
    overRuns: ctx?.overRuns,
  };
}

// ---------------------------------------------------------------------------
// Prompts + generation
// ---------------------------------------------------------------------------

export interface GenerationOptions {
  provider?: string;
  style?: string;
  language?: string;
  temperature?: number;
  creativity?: number;
  allowAI?: boolean;
}

export interface CommentaryGenerationResult {
  content: string;
  provider: string | null;
  generatedBy: "AI" | "DETERMINISTIC";
  usedAI: boolean;
}

const STYLE_GUIDES: Record<string, string> = {
  professional: "Professional, factual and precise.",
  "tv-broadcast": "High-energy TV broadcast commentary.",
  radio: "Radio commentary — paints a picture with words.",
  minimal: "Short and to the point.",
  energetic: "Explosive, crowd-pleasing energy.",
  "hindi-english": "Hinglish flavor, mixing Hindi and English naturally.",
  funny: "Light-hearted and funny.",
  neutral: "Calm and neutral.",
  analytical: "Analytical, referencing stats and match context.",
};

function effectiveTemperature(opts: GenerationOptions): number {
  const base = opts.temperature ?? 0.7;
  const creativity = opts.creativity ?? 0.5;
  const shift = (creativity - 0.5) * 0.6;
  return Math.min(Math.max(base + shift, 0), 1.4);
}

function styleGuide(style?: string): string {
  return STYLE_GUIDES[style ?? ""] ?? STYLE_GUIDES.professional!;
}

export function cleanAIResponse(text: string): string {
  return text
    .replace(/^["'\u201c\u201d]+|["'\u201c\u201d]+$/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

export async function generateCommentaryForBall(
  matchId: string,
  ballId: string,
  opts: GenerationOptions = {}
): Promise<CommentaryGenerationResult> {
  const ball = await prisma.ball.findUnique({ where: { id: ballId } });
  if (!ball) throw new Error("Ball not found.");

  const innings = await prisma.innings.findUnique({ where: { id: ball.inningsId } });
  if (!innings || innings.matchId !== matchId) throw new Error("Ball not in match.");

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Match not found.");

  const nameIds = [
    ...new Set([
      ball.batsmanId,
      ball.bowlerId,
      ...(ball.fielderId ? [ball.fielderId] : []),
      ...(ball.dismissedPlayerId ? [ball.dismissedPlayerId] : []),
    ]),
  ];
  const players = await prisma.player.findMany({
    where: { id: { in: nameIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(players.map((p) => [p.id, p.name]));

  const strikerName = nameById.get(ball.batsmanId) ?? "Batter";
  const bowlerName = nameById.get(ball.bowlerId) ?? "Bowler";
  const fielderName = ball.fielderId ? nameById.get(ball.fielderId) : undefined;

  const legalBalls = parseOversToBalls(innings.totalOvers);
  const overNumber = Math.floor((legalBalls - 1) / 6) + 1;

  const detCtx = toDeterministicContext(ball, strikerName, bowlerName, fielderName, {
    overNumber,
    ballNumber: legalBalls,
    inningsNumber: innings.inningsNumber,
    matchFormat: match.format,
    currentRuns: innings.totalRuns,
    currentWickets: innings.totalWickets,
    target: innings.targetScore,
  });

  const deterministic = buildDeterministicCommentary(detCtx);

  const allowAI = opts.allowAI !== false;
  if (allowAI) {
    const provider = resolveProvider(opts.provider);
    if (provider) {
      const language = getLanguage(opts.language);
      const system = [
        "You are a world-class cricket commentary writer for ScoreBolt.",
        `Commentary style: ${styleGuide(opts.style)}`,
        `Write commentary in ${language.name}.`,
        "Rules: one vivid line, maximum 30 words. Do not mention AI or automation. Return only the commentary text.",
      ].join("\n");

      const ballDesc = describeBallContext(detCtx);
      const prompt = [
        `Match context: ${match.name}, format: ${match.format}.`,
        `Scoreboard: ${innings.totalRuns}/${innings.totalWickets} in ${innings.totalOvers} overs${innings.targetScore ? `, target ${innings.targetScore}` : ""}.`,
        `Delivery: ${overLabel(overNumber, legalBalls)}, ${bowlerName} to ${strikerName}.`,
        ballDesc ? `Ball details: ${ballDesc}.` : "",
        ball.isWicket ? `This delivery is a wicket (${ball.wicketType ?? "out"}).` : "",
        `Write one commentary line for this delivery.`,
      ]
        .filter(Boolean)
        .join("\n");

      try {
        const content = cleanAIResponse(
          await provider.complete(system, prompt, {
            temperature: effectiveTemperature(opts),
            maxTokens: 120,
          })
        );
        if (content) {
          return { content, provider: provider.id, generatedBy: "AI", usedAI: true };
        }
      } catch {
        // provider failed — fall back to deterministic
      }
    }
  }

  return { content: deterministic, provider: null, generatedBy: "DETERMINISTIC", usedAI: false };
}

export async function saveAICommentary(
  matchId: string,
  ballId: string,
  content: string,
  opts: GenerationOptions
) {
  const ball = await prisma.ball.findUnique({ where: { id: ballId } });
  if (!ball) throw new Error("Ball not found.");

  const innings = await prisma.innings.findUnique({ where: { id: ball.inningsId } });
  const over = await prisma.over.findUnique({ where: { id: ball.overId } });

  const legalBalls = innings ? parseOversToBalls(innings.totalOvers) : ball.ballNumber;

  const existing = await prisma.commentary.findFirst({
    where: { ballId, isAIGenerated: true },
  });

  const data = {
    content,
    overNumber: over?.overNumber ?? null,
    ballNumber: legalBalls,
    inningsNumber: innings?.inningsNumber ?? null,
    isAutomatic: false,
    isHighlight: ball.isWicket || ball.runs === 4 || ball.runs === 6,
    eventType: ball.isWicket ? "WICKET" : ball.runs === 6 ? "SIX" : ball.runs === 4 ? "FOUR" : "BALL",
    isAIGenerated: true,
    generatedBy: "AI",
    provider: opts.provider ?? null,
    style: opts.style ?? null,
    language: opts.language ?? null,
    edited: false,
    aiGeneratedAt: new Date(),
  };

  let commentary;
  if (existing) {
    commentary = await prisma.commentary.update({
      where: { id: existing.id },
      data,
    });
  } else {
    commentary = await prisma.commentary.create({
      data: { ...data, matchId, ballId },
    });
  }

  emitCommentaryAdded(matchId, commentary);
  return commentary;
}

// Background AI generation — called fire-and-forget after a ball is recorded.
// Never awaited by the scoring path.
export async function maybeAutoGenerateAICommentary(
  matchId: string,
  ballId: string,
  userId: string
): Promise<void> {
  try {
    const settings = await getCommentarySettings(matchId, userId);
    if (!settings.aiEnabled || !settings.autoCommentary) return;
    if (!isAnyAIProviderConfigured()) return;

    const result = await generateCommentaryForBall(matchId, ballId, {
      provider: settings.provider,
      style: settings.style,
      language: settings.language,
      temperature: settings.temperature,
      creativity: settings.creativity,
    });
    if (!result.usedAI) return;
    await saveAICommentary(matchId, ballId, result.content, {
      provider: settings.provider,
      style: settings.style,
      language: settings.language,
    });
  } catch (err) {
    console.error("Background AI commentary failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Regenerate / enhance / translate / improve
// ---------------------------------------------------------------------------

export async function regenerateCommentary(
  matchId: string,
  commentaryId: string,
  opts: GenerationOptions = {}
) {
  const existing = await prisma.commentary.findUnique({ where: { id: commentaryId } });
  if (!existing || existing.matchId !== matchId) throw new Error("Commentary not found.");

  const useAI = existing.isAIGenerated || opts.provider ? true : false;
  const settings: GenerationOptions = {
    provider: opts.provider ?? existing.provider ?? undefined,
    style: opts.style ?? existing.style ?? undefined,
    language: opts.language ?? existing.language ?? undefined,
    temperature: opts.temperature,
    creativity: opts.creativity,
    allowAI: useAI,
  };

  let content: string;
  let provider: string | null = null;
  let generatedBy: "AI" | "DETERMINISTIC" = "DETERMINISTIC";

  if (existing.ballId) {
    const result = await generateCommentaryForBall(matchId, existing.ballId, settings);
    content = result.content;
    provider = result.provider;
    generatedBy = result.generatedBy;
  } else {
    if (existing.isAIGenerated) {
      const p = resolveProvider(settings.provider);
      const system = "You are a cricket commentary writer. Rewrite the line better.";
      content = p
        ? cleanAIResponse(await p.complete(system, `Improve: ${existing.content}`, {
            temperature: effectiveTemperature(settings),
            maxTokens: 120,
          }))
        : existing.content;
      provider = p?.id ?? null;
      generatedBy = "AI";
    } else {
      content = existing.content;
    }
  }

  const updated = await prisma.commentary.update({
    where: { id: commentaryId },
    data: {
      content,
      provider,
      generatedBy,
      isAIGenerated: generatedBy === "AI",
      style: settings.style ?? existing.style ?? null,
      language: settings.language ?? existing.language ?? null,
      edited: true,
      aiGeneratedAt: generatedBy === "AI" ? new Date() : existing.aiGeneratedAt,
    },
  });

  emitCommentaryUpdated(matchId, updated);
  return updated;
}

export async function enhanceTranscript(
  _matchId: string,
  transcript: string,
  opts: GenerationOptions = {}
): Promise<{ content: string; provider: string | null; usedAI: boolean }> {
  const provider = resolveProvider(opts.provider);
  if (provider) {
    const language = getLanguage(opts.language);
    const system = [
      "You are a cricket commentary writer for ScoreBolt.",
      `Commentary style: ${styleGuide(opts.style)}`,
      `Write commentary in ${language.name}.`,
      "Enhance the raw transcript into polished cricket commentary, max 30 words.",
      "Do not mention AI. Return only the commentary text.",
    ].join("\n");
    try {
      const content = cleanAIResponse(
        await provider.complete(system, `Raw transcript: "${transcript}"`, {
          temperature: effectiveTemperature(opts),
          maxTokens: 120,
        })
      );
      if (content) return { content, provider: provider.id, usedAI: true };
    } catch {
      // fall through
    }
  }
  return {
    content: transcript.trim(),
    provider: null,
    usedAI: false,
  };
}

export async function translateCommentary(
  _matchId: string,
  text: string,
  language: string,
  opts: GenerationOptions = {}
): Promise<{ content: string; provider: string | null; usedAI: boolean }> {
  if (!getLanguage(language) || language === "en") {
    return { content: text, provider: null, usedAI: false };
  }
  const provider = resolveProvider(opts.provider);
  if (provider) {
    const system = [
      "You are a cricket commentary translator for ScoreBolt.",
      `Translate cricket commentary into ${targetLanguagePrompt(language)}.`,
      "Keep it vivid and cricket-appropriate. Return only the translation.",
    ].join("\n");
    try {
      const content = cleanAIResponse(
        await provider.complete(system, `Text: "${text}"`, {
          temperature: 0.3,
          maxTokens: 120,
        })
      );
      if (content) return { content, provider: provider.id, usedAI: true };
    } catch {
      // fall through
    }
  }
  return { content: text, provider: null, usedAI: false };
}

export async function improveCommentary(
  _matchId: string,
  text: string,
  opts: GenerationOptions = {}
): Promise<{ content: string; provider: string | null; usedAI: boolean }> {
  const provider = resolveProvider(opts.provider);
  if (provider) {
    const system = [
      "You are a cricket commentary writer for ScoreBolt.",
      `Commentary style: ${styleGuide(opts.style)}`,
      "Improve this commentary line: keep meaning, make it broadcast-ready, max 30 words.",
      "Do not mention AI. Return only the improved text.",
    ].join("\n");
    try {
      const content = cleanAIResponse(
        await provider.complete(system, `Text: "${text}"`, {
          temperature: effectiveTemperature(opts),
          maxTokens: 120,
        })
      );
      if (content) return { content, provider: provider.id, usedAI: true };
    } catch {
      // fall through
    }
  }
  return { content: text, provider: null, usedAI: false };
}

// Exports used by the UI for badges/labels
export function resolveProviderLabel(provider?: string | null): string {
  return providerName(provider ?? "");
}

export function isProviderConfigured(provider?: string | null): boolean {
  const p = getAIProvider(provider ?? undefined);
  return p ? p.isConfigured() : false;
}

export type { AIProviderId };
