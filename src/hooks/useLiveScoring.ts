"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useMatchLive,
  type MatchDetail,
  type PlayerRef,
  type InningsDetail,
  type BallRef,
} from "@/hooks/useMatchLive";

export type ExtraKind = "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE";

export interface BallOutcomeInput {
  runs: number;
  extraType?: ExtraKind | null;
  extraRuns?: number;
  isWicket?: boolean;
  wicketType?: string | null;
  dismissedPlayerId?: string | null;
  fielderId?: string | null;
  shotType?: string | null;
  placementZone?: string | null;
  fieldPositions?: string | null;
  isOverthrow?: boolean;
}

export interface EditBallPatch {
  runs?: number;
  extraType?: ExtraKind | null;
  extraRuns?: number;
  isWicket?: boolean;
  wicketType?: string | null;
  dismissedPlayerId?: string | null;
  fielderId?: string | null;
  shotType?: string | null;
  placementZone?: string | null;
  fieldPositions?: string | null;
  isFreeHit?: boolean;
  isOverthrow?: boolean;
}

export interface WicketConfirmInput {
  wicketType: string;
  dismissedPlayerId: string;
  fielderId: string | null;
  runsCompleted: number;
}

export function parseOversToBalls(overs: number): number {
  const full = Math.floor(overs);
  const rem = Math.round((overs - full) * 10);
  return full * 6 + rem;
}

export function formatOversFromBalls(balls: number): number {
  return Math.floor(balls / 6) + (balls % 6) / 10;
}

/**
 * All live-scoring state, derived data and server actions in one place.
 *
 * Every mutation goes through a synchronous busy lock so double-clicks,
 * double-taps, keyboard auto-repeat and socket echoes can never record a
 * duplicate ball. The authoritative state always comes from the database —
 * the client only issues the mutation and invalidates the queries.
 */
export function useLiveScoring(matchId: string) {
  const queryClient = useQueryClient();
  const { match, innings, isLoading, error } = useMatchLive(matchId);

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const busyRef = useRef(false);

  // Last-wicket context so the "select next batter" step can resolve strike
  // even though the wicket and the batter selection are separate API calls.
  const wicketContextRef = useRef<{
    remaining: string;
    overEnded: boolean;
    oddRuns: boolean;
  } | null>(null);

  // ---- derived state ------------------------------------------------------

  const currentInnings = useMemo(() => {
    if (!match) return null;
    const live = innings.find((i) => i.endedAt === null);
    return live ?? innings[innings.length - 1] ?? null;
  }, [match, innings]);

  const teamIds = useMemo(() => {
    if (!match) return [];
    return [match.homeTeamId, match.awayTeamId];
  }, [match]);

  const rostersQuery = useQuery({
    queryKey: ["players", "by-team", teamIds],
    queryFn: async () => {
      const [a, b] = await Promise.all(
        teamIds.map((id) =>
          fetch(`/api/players?teamId=${id}&limit=100`).then((r) => r.json())
        )
      );
      return {
        [teamIds[0]]: (a.players ?? a ?? []) as PlayerRef[],
        [teamIds[1]]: (b.players ?? b ?? []) as PlayerRef[],
      };
    },
    enabled: !!match && (match?.squads?.length ?? 0) === 0,
  });

  const playersByTeam = useMemo(() => {
    const map = new Map<string, PlayerRef[]>();
    if (!match) return map;
    if ((match.squads?.length ?? 0) > 0) {
      for (const s of match.squads) {
        const list = map.get(s.teamId) ?? [];
        list.push(s.player);
        map.set(s.teamId, list);
      }
    } else if (rostersQuery.data) {
      map.set(match.homeTeamId, rostersQuery.data[match.homeTeamId] ?? []);
      map.set(match.awayTeamId, rostersQuery.data[match.awayTeamId] ?? []);
    }
    return map;
  }, [match, rostersQuery.data]);

  const battingTeamPlayers = useMemo(
    () => playersByTeam.get(currentInnings?.battingTeam ?? "") ?? [],
    [playersByTeam, currentInnings]
  );
  const bowlingTeamPlayers = useMemo(
    () => playersByTeam.get(currentInnings?.bowlingTeam ?? "") ?? [],
    [playersByTeam, currentInnings]
  );

  const legalBalls = currentInnings
    ? parseOversToBalls(currentInnings.totalOvers)
    : 0;
  const maxBalls = (match?.totalOvers ?? 20) * 6;
  const isOverComplete =
    legalBalls > 0 && legalBalls % 6 === 0 && legalBalls < maxBalls;
  const canScore = match?.scoringAccess?.allowed ?? false;

  // BUG-1 root cause: the console was previously gated on `legalBalls === 0`,
  // so it never appeared until a ball had been recorded. Now it is gated on
  // whether the openers + bowler are actually set on the persisted innings.
  const needsOpeners =
    !!currentInnings &&
    legalBalls === 0 &&
    (!currentInnings.strikerId ||
      !currentInnings.nonStrikerId ||
      !currentInnings.currentBowlerId);

  const needsNextBatter =
    !!currentInnings &&
    !!currentInnings.strikerId &&
    !currentInnings.nonStrikerId &&
    currentInnings.totalWickets < 10;

  const needsNextBowler =
    !!currentInnings &&
    isOverComplete &&
    !currentInnings.currentBowlerId;

  const battingById = useMemo(() => {
    const map = new Map<string, PlayerRef>();
    if (!currentInnings) return map;
    for (const s of match?.squads ?? []) {
      if (s.teamId === currentInnings.battingTeam) map.set(s.player.id, s.player);
    }
    for (const c of currentInnings.battingCard) map.set(c.playerId, c.player);
    return map;
  }, [match, currentInnings]);

  const bowlingById = useMemo(() => {
    const map = new Map<string, PlayerRef>();
    if (!currentInnings) return map;
    for (const s of match?.squads ?? []) {
      if (s.teamId === currentInnings.bowlingTeam) map.set(s.player.id, s.player);
    }
    for (const c of currentInnings.bowlingCard) map.set(c.playerId, c.player);
    return map;
  }, [match, currentInnings]);

  const striker = currentInnings?.strikerId
    ? battingById.get(currentInnings.strikerId) ?? null
    : null;
  const nonStriker = currentInnings?.nonStrikerId
    ? battingById.get(currentInnings.nonStrikerId) ?? null
    : null;
  const bowler = currentInnings?.currentBowlerId
    ? bowlingById.get(currentInnings.currentBowlerId) ?? null
    : null;

  const strikerCard = currentInnings?.battingCard.find(
    (c) => c.playerId === currentInnings.strikerId
  );
  const nonStrikerCard = currentInnings?.battingCard.find(
    (c) => c.playerId === currentInnings.nonStrikerId
  );
  const bowlerCard = currentInnings?.bowlingCard.find(
    (c) => c.playerId === currentInnings.currentBowlerId
  );

  const allBallsThisInnings = useMemo(() => {
    if (!currentInnings) return [];
    return (currentInnings.overs ?? [])
      .flatMap((o) => o.balls ?? [])
      .sort((a, b) => a.ballNumber - b.ballNumber);
  }, [currentInnings]);

  const thisOver = useMemo(() => {
    if (!currentInnings) return null;
    const overs = currentInnings.overs ?? [];
    if (overs.length === 0) return null;
    // Over numbers are 1-indexed. The "current" over is the one the most
    // recently bowled delivery landed in; with no balls yet we fall back to
    // the last (typically over 1, empty) over so the strip shows a blank.
    const last = allBallsThisInnings[allBallsThisInnings.length - 1];
    if (last?.over?.overNumber != null) {
      return (
        overs.find((o) => o.overNumber === last.over?.overNumber) ??
        overs[overs.length - 1]
      );
    }
    return overs[overs.length - 1];
  }, [currentInnings, allBallsThisInnings]);

  const lastBall =
    allBallsThisInnings.length > 0
      ? allBallsThisInnings[allBallsThisInnings.length - 1]
      : null;

  // The delivery after a no-ball is a free hit (persisted server-side too).
  const nextBallIsFreeHit = lastBall?.extraType === "NO_BALL";

  const partnership = useMemo(() => {
    if (!currentInnings) return { runs: 0, balls: 0 };
    const fows = currentInnings.fallOfWickets ?? [];
    const lastFow = fows[fows.length - 1];
    return {
      runs: currentInnings.totalRuns - (lastFow?.runs ?? 0),
      balls: legalBalls - parseOversToBalls(lastFow?.overs ?? 0),
    };
  }, [currentInnings, legalBalls]);

  const dismissedPlayerIds = useMemo(() => {
    if (!currentInnings) return new Set<string>();
    return new Set(
      currentInnings.battingCard
        .filter((c) => !c.isNotOut)
        .map((c) => c.playerId)
    );
  }, [currentInnings]);

  const crr = legalBalls > 0
    ? ((currentInnings?.totalRuns ?? 0) / (legalBalls / 6)).toFixed(2)
    : "0.00";

  const target = currentInnings?.targetScore ?? null;
  const requiredRunRate =
    target != null && legalBalls > 0
      ? (
          ((target - (currentInnings?.totalRuns ?? 0)) /
            Math.max(maxBalls - legalBalls, 0.1)) *
          6
        ).toFixed(2)
      : null;

  // ---- actions ------------------------------------------------------------

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    queryClient.invalidateQueries({ queryKey: ["innings", matchId] });
  }, [queryClient, matchId]);

  // Seed the React Query cache directly from the authoritative API response so
  // the submitting scorer renders the new score IMMEDIATELY — independent of
  // socket delivery or the polling fallback. Invalidation still runs afterwards
  // to refresh any derived detail (cards, overs, commentary) in the background.
  const applyInningsDetail = useCallback(
    (detail: InningsDetail) => {
      if (!detail?.id) return;
      queryClient.setQueryData<{ innings: InningsDetail[] }>(
        ["innings", matchId],
        (old) => {
          if (!old?.innings) return old;
          const rest = old.innings.filter((i) => i.id !== detail.id);
          return {
            innings: [...rest, detail].sort(
              (a, b) => a.inningsNumber - b.inningsNumber
            ),
          };
        }
      );
    },
    [queryClient, matchId]
  );

  const applyInningsRaw = useCallback(
    (raw: {
      id: string;
      totalRuns?: number;
      totalWickets?: number;
      totalOvers?: number;
      extras?: number;
      targetScore?: number | null;
      strikerId?: string | null;
      nonStrikerId?: string | null;
      currentBowlerId?: string | null;
      battingOrderCount?: number;
      endedAt?: string | null;
    }) => {
      if (!raw?.id) return;
      queryClient.setQueryData<{ innings: InningsDetail[] }>(
        ["innings", matchId],
        (old) => {
          if (!old?.innings) return old;
          return {
            innings: old.innings.map((i) =>
              i.id === raw.id ? { ...i, ...raw } : i
            ),
          };
        }
      );
    },
    [queryClient, matchId]
  );

  const applyMatchRaw = useCallback(
    (raw: {
      id?: string;
      status?: string;
      isPaused?: boolean;
      result?: string | null;
      winningTeamId?: string | null;
      completedAt?: string | null;
    }) => {
      if (!raw?.id) return;
      queryClient.setQueryData<{ match: MatchDetail }>(
        ["match", matchId],
        (old) => {
          if (!old?.match) return old;
          return { match: { ...old.match, ...raw } };
        }
      );
    },
    [queryClient, matchId]
  );

  const acquire = useCallback(() => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setSubmitting(true);
    setActionError(null);
    return true;
  }, []);

  const release = useCallback(() => {
    busyRef.current = false;
    setSubmitting(false);
  }, []);

  const postAction = useCallback(
    async (action: string, extra: Record<string, unknown> = {}): Promise<boolean> => {
      if (!acquire()) return false;
      try {
        const res = await fetch(`/api/matches/${matchId}/actions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...extra }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setActionError(data.error ?? "Action failed. Please try again.");
          return false;
        }
        if (data?.match) applyMatchRaw(data.match);
        if (data?.innings) applyInningsRaw(data.innings);
        invalidate();
        return true;
      } catch {
        setActionError("Action failed. Please try again.");
        return false;
      } finally {
        release();
      }
    },
    [acquire, release, matchId, invalidate, applyMatchRaw, applyInningsRaw]
  );

  const recordBall = useCallback(
    async (input: BallOutcomeInput): Promise<boolean> => {
      if (!currentInnings || !match) return false;
      if (needsNextBatter) {
        setActionError("Select the next batter to continue.");
        return false;
      }
      if (needsOpeners) {
        setActionError("Set the openers and bowler before scoring.");
        return false;
      }
      if (needsNextBowler) {
        setActionError("Select the next bowler to continue.");
        return false;
      }
      if (!currentInnings.strikerId || !currentInnings.nonStrikerId || !currentInnings.currentBowlerId) {
        setActionError("Set the openers and bowler before scoring.");
        return false;
      }
      if (match.isPaused) {
        setActionError("The match is paused. Resume play before scoring.");
        return false;
      }
      if (!acquire()) return false;
      try {
        const res = await fetch(`/api/matches/${matchId}/balls`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inningsId: currentInnings.id,
            batsmanId: currentInnings.strikerId,
            nonStrikerId: currentInnings.nonStrikerId,
            bowlerId: currentInnings.currentBowlerId,
            runs: input.runs,
            extraType: input.extraType ?? null,
            extraRuns: input.extraRuns ?? 0,
            isWicket: input.isWicket ?? false,
            wicketType: input.wicketType ?? null,
            dismissedPlayerId: input.dismissedPlayerId ?? null,
            fielderId: input.fielderId ?? null,
            shotType: input.shotType ?? null,
            placementZone: input.placementZone ?? null,
            fieldPositions: input.fieldPositions ?? null,
            isOverthrow: input.isOverthrow ?? false,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setActionError(data.error ?? "Unable to record this ball. Please try again.");
          return false;
        }
        if (data?.detail) applyInningsDetail(data.detail as InningsDetail);
        invalidate();
        return true;
      } catch {
        setActionError("Unable to record this ball. Please try again.");
        return false;
      } finally {
        release();
      }
    },
    [acquire, release, currentInnings, match, matchId, invalidate, applyInningsDetail, needsNextBowler, needsNextBatter, needsOpeners]
  );

  const handleExtras = useCallback(
    (
      kind: ExtraKind,
      runs: number,
      advanced?: Pick<
        BallOutcomeInput,
        "shotType" | "placementZone" | "fieldPositions" | "isOverthrow"
      >
    ): Promise<boolean> => {
      const extra = advanced ?? {};
      if (kind === "WIDE")
        return recordBall({ runs: 0, extraType: "WIDE", extraRuns: runs, ...extra });
      if (kind === "NO_BALL")
        return recordBall({ runs, extraType: "NO_BALL", extraRuns: 1 + runs, ...extra });
      if (kind === "BYE")
        return recordBall({ runs: 0, extraType: "BYE", extraRuns: runs, ...extra });
      return recordBall({ runs: 0, extraType: "LEG_BYE", extraRuns: runs, ...extra });
    },
    [recordBall]
  );

  const handleWicketConfirm = useCallback(
    async (
      input: WicketConfirmInput,
      advanced?: Pick<
        BallOutcomeInput,
        "shotType" | "placementZone" | "fieldPositions" | "isOverthrow"
      >
    ): Promise<boolean> => {
      const preStriker = currentInnings?.strikerId;
      const preNonStriker = currentInnings?.nonStrikerId;
      if (!preStriker || !preNonStriker || !currentInnings) return false;

      const remaining =
        input.dismissedPlayerId === preStriker ? preNonStriker : preStriker;
      const overEnded = legalBalls % 6 === 5;
      wicketContextRef.current = {
        remaining,
        overEnded,
        oddRuns: input.runsCompleted % 2 === 1,
      };

      return recordBall({
        runs: input.runsCompleted,
        isWicket: true,
        wicketType: input.wicketType,
        dismissedPlayerId: input.dismissedPlayerId,
        fielderId: input.fielderId,
        ...(advanced ?? {}),
      });
    },
    [currentInnings, legalBalls, recordBall]
  );

  const setNextBatter = useCallback(
    async (newBatsmanId: string): Promise<boolean> => {
      if (!acquire()) return false;
      setActionError(null);
      try {
        const ctx = wicketContextRef.current;
        const strikerNow = currentInnings?.strikerId;
        if (!strikerNow || !ctx?.remaining) {
          setActionError("Please set the striker before continuing.");
          return false;
        }
        const facing = ctx.overEnded || ctx.oddRuns ? ctx.remaining : newBatsmanId;
        const other = ctx.overEnded || ctx.oddRuns ? newBatsmanId : ctx.remaining;

        const res = await fetch(`/api/matches/${matchId}/actions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set-batsmen", strikerId: facing, nonStrikerId: other }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setActionError(data.error ?? "Unable to set the next batter. Please try again.");
          return false;
        }
        wicketContextRef.current = null;
        if (data?.innings) applyInningsRaw(data.innings);
        invalidate();
        return true;
      } catch {
        setActionError("Unable to set the next batter. Please try again.");
        return false;
      } finally {
        release();
      }
    },
    [acquire, release, currentInnings, matchId, invalidate, applyInningsRaw]
  );

  const setBatsmen = useCallback(
    async (strikerId: string, nonStrikerId: string): Promise<boolean> => {
      if (!acquire()) return false;
      setActionError(null);
      try {
        const res = await fetch(`/api/matches/${matchId}/actions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set-batsmen", strikerId, nonStrikerId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setActionError(data.error ?? "Unable to update the batsmen. Please try again.");
          return false;
        }
        if (data?.innings) applyInningsRaw(data.innings);
        invalidate();
        return true;
      } catch {
        setActionError("Unable to update the batsmen. Please try again.");
        return false;
      } finally {
        release();
      }
    },
    [acquire, release, matchId, invalidate, applyInningsRaw]
  );

  const swapStrike = useCallback(async (): Promise<boolean> => {
    if (!acquire()) return false;
    setActionError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/actions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "swap-strike" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error ?? "Unable to swap strike. Please try again.");
        return false;
      }
      if (data?.innings) applyInningsRaw(data.innings);
      invalidate();
      return true;
    } catch {
      setActionError("Unable to swap strike. Please try again.");
      return false;
    } finally {
      release();
    }
  }, [acquire, release, matchId, invalidate, applyInningsRaw]);

  const setBowler = useCallback(
    async (bowlerId: string): Promise<boolean> => {
      if (!acquire()) return false;
      setActionError(null);
      try {
        const res = await fetch(`/api/matches/${matchId}/actions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set-bowler", bowlerId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setActionError(data.error ?? "Unable to set the bowler. Please try again.");
          return false;
        }
        if (data?.innings) applyInningsRaw(data.innings);
        invalidate();
        return true;
      } catch {
        setActionError("Unable to set the bowler. Please try again.");
        return false;
      } finally {
        release();
      }
    },
    [acquire, release, matchId, invalidate, applyInningsRaw]
  );

  const setOpeners = useCallback(
    async (strikerId: string, nonStrikerId: string, bowlerId: string): Promise<boolean> => {
      if (!acquire()) return false;
      setActionError(null);
      try {
        const res = await fetch(`/api/matches/${matchId}/actions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set-openers", strikerId, nonStrikerId, bowlerId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setActionError(data.error ?? "Unable to save the openers. Please try again.");
          return false;
        }
        if (data?.innings) applyInningsRaw(data.innings);
        invalidate();
        return true;
      } catch {
        setActionError("Unable to save the openers. Please try again.");
        return false;
      } finally {
        release();
      }
    },
    [acquire, release, matchId, invalidate, applyInningsRaw]
  );

  const undoLast = useCallback(async (): Promise<boolean> => {
    if (!acquire()) return false;
    setActionError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/balls/last`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error ?? "Unable to undo this ball. Please try again.");
        return false;
      }
      wicketContextRef.current = null;
      if (data?.detail) applyInningsDetail(data.detail as InningsDetail);
      invalidate();
      return true;
    } catch {
      setActionError("Unable to undo this ball. Please try again.");
      return false;
    } finally {
      release();
    }
  }, [acquire, release, matchId, invalidate, applyInningsDetail]);

  const editBall = useCallback(
    async (ballId: string, patch: EditBallPatch): Promise<boolean> => {
      if (!acquire()) return false;
      setActionError(null);
      try {
        const res = await fetch(`/api/matches/${matchId}/balls/${ballId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setActionError(data.error ?? "Unable to edit this ball. Please try again.");
          return false;
        }
        if (patch.isWicket) {
          const preStriker = currentInnings?.strikerId;
          const preNonStriker = currentInnings?.nonStrikerId;
          if (preStriker && preNonStriker) {
            wicketContextRef.current = {
              remaining:
                (patch.dismissedPlayerId ?? preStriker) === preStriker
                  ? preNonStriker
                  : preStriker,
              overEnded: legalBalls % 6 === 5,
              oddRuns: (patch.runs ?? 0) % 2 === 1,
            };
          }
        }
        if (data?.detail) applyInningsDetail(data.detail as InningsDetail);
        invalidate();
        return true;
      } catch {
        setActionError("Unable to edit this ball. Please try again.");
        return false;
      } finally {
        release();
      }
    },
    [acquire, release, matchId, invalidate, applyInningsDetail, currentInnings, legalBalls]
  );

  const deleteBall = useCallback(
    async (ballId: string): Promise<boolean> => {
      if (!acquire()) return false;
      setActionError(null);
      try {
        const res = await fetch(`/api/matches/${matchId}/balls/${ballId}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setActionError(data.error ?? "Unable to delete this ball. Please try again.");
          return false;
        }
        wicketContextRef.current = null;
        if (data?.detail) applyInningsDetail(data.detail as InningsDetail);
        invalidate();
        return true;
      } catch {
        setActionError("Unable to delete this ball. Please try again.");
        return false;
      } finally {
        release();
      }
    },
    [acquire, release, matchId, invalidate, applyInningsDetail]
  );

  return {
    match,
    innings,
    currentInnings,
    isLoading,
    error,
    submitting,
    actionError,
    setActionError,
    canScore,
    // rosters
    battingTeamPlayers,
    bowlingTeamPlayers,
    // live state
    striker,
    nonStriker,
    bowler,
    strikerCard,
    nonStrikerCard,
    bowlerCard,
    legalBalls,
    isOverComplete,
    needsOpeners,
    needsNextBatter,
    needsNextBowler,
    thisOver,
    allBallsThisInnings,
    lastBall,
    nextBallIsFreeHit,
    partnership,
    dismissedPlayerIds,
    crr,
    target,
    requiredRunRate,
    maxBalls,
    // actions
    postAction,
    recordBall,
    handleExtras,
    handleWicketConfirm,
    setNextBatter,
    setBatsmen,
    swapStrike,
    setBowler,
    setOpeners,
    undoLast,
    editBall,
    deleteBall,
    invalidate,
  };
}

export type LiveScoring = ReturnType<typeof useLiveScoring>;
export type {
  MatchDetail,
  InningsDetail,
  PlayerRef,
  BallRef,
};
