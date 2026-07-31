"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Archive,
  ArrowLeftRight,
  Ban,
  CloudRain,
  Coffee,
  Edit3,
  Flag,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Trophy,
  Undo2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { cn, formatOvers } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PlayerPickerModal } from "@/components/match/PlayerPickerModal";
import {
  useMatchLive,
  type InningsDetail,
  type MatchDetail,
  type PlayerRef,
} from "@/hooks/useMatchLive";

const WICKET_TYPES = [
  { value: "BOWLED", label: "Bowled" },
  { value: "CAUGHT", label: "Caught" },
  { value: "LBW", label: "LBW" },
  { value: "STUMPED", label: "Stumped" },
  { value: "RUN_OUT", label: "Run Out" },
  { value: "HIT_WICKET", label: "Hit Wicket" },
  { value: "OBSTRUCTING_FIELD", label: "Obstructing" },
  { value: "RETIRED_HURT", label: "Retired Hurt" },
  { value: "TIMED_OUT", label: "Timed Out" },
] as const;

type WicketType = (typeof WICKET_TYPES)[number]["value"];
type ExtraKind = "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE";

const KEY_SHORTCUTS = [
  { keys: "0-6", label: "Score runs" },
  { keys: "W", label: "Wide" },
  { keys: "N", label: "No ball" },
  { keys: "B", label: "Bye" },
  { keys: "L", label: "Leg bye" },
  { keys: "K", label: "Wicket" },
  { keys: "U", label: "Undo last ball" },
  { keys: "Z", label: "Swap strike" },
  { keys: "O", label: "Change bowler" },
  { keys: "E", label: "End over / next bowler" },
  { keys: "P / R", label: "Pause / Resume" },
  { keys: "S", label: "Change batsmen" },
  { keys: "Esc", label: "Close dialog" },
];

function parseOversFloat(overs: number): number {
  const full = Math.floor(overs);
  const rem = Math.round((overs - full) * 10);
  return full * 6 + rem;
}

function getBallColor(ball: {
  isWicket: boolean;
  extraType?: string | null;
  runs: number;
  isExtra: boolean;
}): string {
  if (ball.isWicket) return "bg-danger text-white";
  if (ball.extraType === "WIDE") return "bg-warning text-black";
  if (ball.extraType === "NO_BALL") return "bg-orange-500 text-white";
  if (ball.extraType === "BYE" || ball.extraType === "LEG_BYE")
    return "bg-white/15 text-white";
  if (ball.runs === 6) return "bg-accent text-black";
  if (ball.runs === 4) return "bg-primary text-white";
  if (ball.runs === 0 && !ball.isExtra) return "bg-white/10 text-muted";
  return "bg-success/20 text-success";
}

function getBallDisplay(ball: {
  isWicket: boolean;
  extraType?: string | null;
  runs: number;
}): string {
  if (ball.isWicket) return "W";
  if (ball.extraType === "WIDE") return "WD";
  if (ball.extraType === "NO_BALL") return "NB";
  if (ball.extraType === "BYE") return "B";
  if (ball.extraType === "LEG_BYE") return "LB";
  return String(ball.runs);
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SCHEDULED: "bg-accent/15 text-accent",
    READY: "bg-warning/15 text-warning",
    LIVE: "bg-success/15 text-success",
    INNINGS_BREAK: "bg-warning/15 text-warning",
    COMPLETED: "bg-primary/15 text-primary",
    ARCHIVED: "bg-white/10 text-muted",
    ABANDONED: "bg-danger/15 text-danger",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full",
        styles[status] ?? "bg-white/10 text-muted"
      )}
    >
      {status === "LIVE" && (
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
      )}
      {status.replace(/_/g, " ")}
    </span>
  );
}

interface DismissalState {
  strikerId: string;
  nonStrikerId: string;
}

function DismissalModal({
  isOpen,
  onClose,
  onConfirm,
  battingPlayers,
  bowlingPlayers,
  dismissed,
  submitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (input: {
    wicketType: WicketType;
    dismissedPlayerId: string;
    fielderId: string | null;
    newBatsmanId: string | null;
  }) => void;
  battingPlayers: PlayerRef[];
  bowlingPlayers: PlayerRef[];
  dismissed: DismissalState | null;
  submitting: boolean;
}) {
  const [step, setStep] = useState<
    "type" | "dismissed" | "fielder" | "replacement"
  >("type");
  const [wicketType, setWicketType] = useState<WicketType | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [fielderId, setFielderId] = useState<string | null>(null);
  const [newBatsmanId, setNewBatsmanId] = useState<string | null>(null);

  const needsFielder = ["CAUGHT", "STUMPED", "RUN_OUT"].includes(
    wicketType ?? ""
  );
  const needsDismissedPick = wicketType === "RUN_OUT";
  const needsReplacement = wicketType !== null;

  useEffect(() => {
    if (isOpen) {
      setStep("type");
      setWicketType(null);
      setDismissedId(null);
      setFielderId(null);
      setNewBatsmanId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === "dismissed" && !dismissedId && dismissed) {
      setDismissedId(dismissed.strikerId);
    }
  }, [step, dismissedId, dismissed]);

  const availableReplacementIds = useMemo(() => {
    if (!dismissed) return [];
    const inTheMiddle = new Set([
      dismissed.strikerId,
      dismissed.nonStrikerId,
    ]);
    return battingPlayers.filter((p) => !inTheMiddle.has(p.id)).map((p) => p.id);
  }, [battingPlayers, dismissed]);

  const nextStep = () => {
    if (step === "type" && needsDismissedPick) setStep("dismissed");
    else if (step === "type" && needsFielder) setStep("fielder");
    else if (step === "type" && needsReplacement) setStep("replacement");
    else if (step === "dismissed" && needsFielder) setStep("fielder");
    else if (step === "dismissed" && needsReplacement) setStep("replacement");
    else if (step === "fielder" && needsReplacement) setStep("replacement");
    else onConfirm({
      wicketType: wicketType!,
      dismissedPlayerId: dismissedId!,
      fielderId,
      newBatsmanId,
    });
  };

  const stepTitle =
    step === "type"
      ? "How was the wicket taken?"
      : step === "dismissed"
        ? "Who was run out?"
        : step === "fielder"
          ? "Who took the catch / made the run out?"
          : "New batsman in";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Wicket" size="lg">
      <p className="text-sm text-muted mb-4">{stepTitle}</p>

      {step === "type" && (
        <div className="grid grid-cols-3 gap-2">
          {WICKET_TYPES.map((wt) => (
            <button
              key={wt.value}
              onClick={() => {
                setWicketType(wt.value);
                setDismissedId(wt.value === "RUN_OUT" ? dismissed?.strikerId ?? null : dismissed?.strikerId ?? null);
                setNewBatsmanId(null);
                if (wt.value === "RUN_OUT") setStep("dismissed");
                else if (["CAUGHT", "STUMPED"].includes(wt.value)) setStep("fielder");
                else setStep("replacement");
              }}
              className="py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors"
            >
              {wt.label}
            </button>
          ))}
        </div>
      )}

      {step === "dismissed" && dismissed && (
        <div className="grid grid-cols-2 gap-2">
          {[dismissed.strikerId, dismissed.nonStrikerId].map((id, idx) => {
            const p = battingPlayers.find((b) => b.id === id);
            return (
              <button
                key={id}
                onClick={() => {
                  setDismissedId(id);
                  if (needsFielder) setStep("fielder");
                  else setStep("replacement");
                }}
                className={cn(
                  "py-4 rounded-xl border text-sm text-white transition-colors",
                  dismissedId === id
                    ? "bg-danger/20 border-danger"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                {p?.name ?? (idx === 0 ? "Striker" : "Non-striker")}
              </button>
            );
          })}
        </div>
      )}

      {step === "fielder" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
            {bowlingPlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setFielderId(p.id);
                  setStep("replacement");
                }}
                className={cn(
                  "px-3 py-2 rounded-xl border text-sm transition-colors",
                  fielderId === p.id
                    ? "bg-accent/15 border-accent text-white"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFielderId(null);
              setStep("replacement");
            }}
          >
            Skip (no fielder)
          </Button>
        </div>
      )}

      {step === "replacement" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {battingPlayers
              .filter((p) => availableReplacementIds.includes(p.id))
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setNewBatsmanId(p.id);
                    onConfirm({
                      wicketType: wicketType!,
                      dismissedPlayerId: dismissedId ?? dismissed?.strikerId ?? "",
                      fielderId,
                      newBatsmanId: p.id,
                    });
                  }}
                  className="py-3 px-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors text-left"
                >
                  {p.name}
                </button>
              ))}
          </div>
          {availableReplacementIds.length === 0 && (
            <p className="text-sm text-muted">
              No batsmen left in the squad — this may be the last wicket.
            </p>
          )}
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                onConfirm({
                  wicketType: wicketType!,
                  dismissedPlayerId: dismissedId ?? dismissed?.strikerId ?? "",
                  fielderId,
                  newBatsmanId: null,
                })
              }
            >
              Continue without a batsman
            </Button>
          </div>
        </div>
      )}

      {step !== "type" && step !== "replacement" && (
        <div className="flex justify-end mt-4">
          <Button variant="secondary" size="sm" onClick={nextStep}>
            Next
          </Button>
        </div>
      )}
      {submitting && (
        <div className="flex items-center justify-center mt-4">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
        </div>
      )}
    </Modal>
  );
}

function ExtrasModal({
  isOpen,
  onClose,
  onConfirm,
  kind,
  submitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (runs: number) => void;
  kind: ExtraKind | null;
  submitting: boolean;
}) {
  const options = kind === "WIDE" ? [1, 2, 3, 4, 6] : [0, 1, 2, 3, 4, 6];
  const title =
    kind === "WIDE"
      ? "Wide — total runs?"
      : kind === "NO_BALL"
        ? "No ball — runs off the bat?"
        : kind === "BYE"
          ? "Byes — total runs?"
          : "Leg byes — total runs?";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="grid grid-cols-3 gap-2">
        {options.map((r) => (
          <motion.button
            key={r}
            whileTap={{ scale: 0.9 }}
            disabled={submitting}
            onClick={() => onConfirm(r)}
            className="py-4 rounded-xl bg-success/10 text-success text-xl font-bold hover:bg-success/20 transition-colors disabled:opacity-50"
          >
            {r}
          </motion.button>
        ))}
      </div>
      {kind === "NO_BALL" && (
        <p className="text-xs text-muted mt-3">
          The no-ball penalty run is added automatically.
        </p>
      )}
    </Modal>
  );
}

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = "Confirm",
  danger,
  submitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  submitting?: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-sm text-white/80 mb-4">{children}</div>
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={danger ? "danger" : "default"}
          size="sm"
          loading={submitting}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export default function LiveScoringPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const queryClient = useQueryClient();

  const { match, innings, isLoading, error } = useMatchLive(matchId);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [dismissalOpen, setDismissalOpen] = useState(false);
  const [extrasKind, setExtrasKind] = useState<ExtraKind | null>(null);
  const [openersOpen, setOpenersOpen] = useState(false);
  const [nextBowlerOpen, setNextBowlerOpen] = useState(false);
  const [changeBatsmanOpen, setChangeBatsmanOpen] = useState(false);
  const [swapStrikeOpen, setSwapStrikeOpen] = useState(false);

  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
    label?: string;
    danger?: boolean;
  } | null>(null);

  const [editBallId, setEditBallId] = useState<string | null>(null);

  // fallback rosters when no squads were set
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

  const currentInnings = useMemo(() => {
    if (!match) return null;
    const live = innings.find((i) => i.endedAt === null);
    return live ?? innings[innings.length - 1] ?? null;
  }, [innings, match]);

  const playersByTeam = useMemo(() => {
    const map = new Map<string, PlayerRef[]>();
    if (!match) return map;
    if (match.squads?.length > 0) {
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
    ? parseOversFloat(currentInnings.totalOvers)
    : 0;
  const isOverComplete =
    legalBalls > 0 &&
    legalBalls % 6 === 0 &&
    legalBalls < (match?.totalOvers ?? 20) * 6;
  const needsOpeners =
    !!currentInnings && legalBalls === 0;
  const canScore = match?.scoringAccess?.allowed ?? false;

  const striker =
    currentInnings?.strikerId && battingTeamPlayers.length > 0
      ? battingTeamPlayers.find((p) => p.id === currentInnings.strikerId) ??
        currentInnings.battingCard.find((c) => c.playerId === currentInnings.strikerId)?.player ??
        null
      : null;
  const nonStriker =
    currentInnings?.nonStrikerId &&
    (battingTeamPlayers.length > 0 || currentInnings.battingCard.length > 0)
      ? battingTeamPlayers.find((p) => p.id === currentInnings.nonStrikerId) ??
        currentInnings.battingCard.find((c) => c.playerId === currentInnings.nonStrikerId)?.player ??
        null
      : null;
  const bowler =
    currentInnings?.currentBowlerId &&
    (bowlingTeamPlayers.length > 0 || currentInnings.bowlingCard.length > 0)
      ? bowlingTeamPlayers.find((p) => p.id === currentInnings.currentBowlerId) ??
        currentInnings.bowlingCard.find((c) => c.playerId === currentInnings.currentBowlerId)?.player ??
        null
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

  const thisOver = useMemo(() => {
    if (!currentInnings) return null;
    const overNumber = Math.floor(legalBalls / 6);
    return currentInnings.overs.find((o) => o.overNumber === overNumber) ?? null;
  }, [currentInnings, legalBalls]);

  const allBallsThisInnings = useMemo(() => {
    if (!currentInnings) return [];
    return currentInnings.overs.flatMap((o) => o.balls ?? []);
  }, [currentInnings]);

  const partnership = useMemo(() => {
    if (!currentInnings) return { runs: 0, balls: 0 };
    const fows = currentInnings.fallOfWickets ?? [];
    const lastFow = fows[fows.length - 1];
    return {
      runs: currentInnings.totalRuns - (lastFow?.runs ?? 0),
      balls: legalBalls - Math.round((lastFow?.overs ?? 0) * 6),
    };
  }, [currentInnings, legalBalls]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    queryClient.invalidateQueries({ queryKey: ["innings", matchId] });
  }, [queryClient, matchId]);

  const postAction = useCallback(
    async (action: string, extra: Record<string, unknown> = {}) => {
      setSubmitting(true);
      setActionError(null);
      try {
        const res = await fetch(`/api/matches/${matchId}/actions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ...extra }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setActionError(data.error ?? "Action failed");
          return false;
        }
        await queryClient.refetchQueries({
          queryKey: ["match", matchId],
          type: "active",
        });
        await queryClient.refetchQueries({
          queryKey: ["innings", matchId],
          type: "active",
        });
        return true;
      } catch (err) {
        console.error("Action failed:", err);
        setActionError("Network error — please retry.");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [matchId, queryClient]
  );

  const recordBall = useCallback(
    async (input: {
      runs: number;
      extraType?: string | null;
      extraRuns?: number;
      isWicket?: boolean;
      wicketType?: string | null;
      dismissedPlayerId?: string | null;
      fielderId?: string | null;
    }) => {
      if (!currentInnings || !match || submitting) return false;
      if (!currentInnings.strikerId || !currentInnings.nonStrikerId || !currentInnings.currentBowlerId) {
        setActionError("Set the openers and bowler first.");
        setOpenersOpen(true);
        return false;
      }
      if (match.isPaused) {
        setActionError("The match is paused. Resume play before scoring.");
        return false;
      }

      setSubmitting(true);
      setActionError(null);
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
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setActionError(data.error ?? "Failed to record ball");
          return false;
        }
        invalidate();
        return true;
      } catch (err) {
        console.error("Error recording ball:", err);
        setActionError("Network error — please retry.");
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [currentInnings, match, matchId, submitting, invalidate]
  );

  const handleExtras = (kind: ExtraKind, runs: number) => {
    setExtrasKind(null);
    if (kind === "WIDE") {
      void recordBall({ runs: 0, extraType: "WIDE", extraRuns: runs });
    } else if (kind === "NO_BALL") {
      void recordBall({
        runs,
        extraType: "NO_BALL",
        extraRuns: 1 + runs,
      });
    } else if (kind === "BYE") {
      void recordBall({ runs: 0, extraType: "BYE", extraRuns: runs });
    } else {
      void recordBall({ runs: 0, extraType: "LEG_BYE", extraRuns: runs });
    }
  };

  const handleWicket = async (input: {
    wicketType: WicketType;
    dismissedPlayerId: string;
    fielderId: string | null;
    newBatsmanId: string | null;
  }) => {
    setDismissalOpen(false);
    const preStriker = currentInnings?.strikerId;
    const preNonStriker = currentInnings?.nonStrikerId;
    if (!preStriker || !preNonStriker) return;

    const ok = await recordBall({
      runs: 0,
      isWicket: true,
      wicketType: input.wicketType,
      dismissedPlayerId: input.dismissedPlayerId,
      fielderId: input.fielderId,
    });
    if (!ok || !input.newBatsmanId) return;

    await queryClient.refetchQueries({
      queryKey: ["match", matchId],
      type: "active",
    });
    await queryClient.refetchQueries({
      queryKey: ["innings", matchId],
      type: "active",
    });
    const fresh = queryClient.getQueryData<{ match: MatchDetail }>([
      "match",
      matchId,
    ]);
    const freshInnings = fresh?.match.innings?.find((i) => i.endedAt === null);
    if (!freshInnings) return;
    if (freshInnings.totalWickets >= 10) return;

    const legalAfter = parseOversFloat(freshInnings.totalOvers);
    const overEnded = legalAfter % 6 === 0;
    const remaining =
      input.dismissedPlayerId === preStriker ? preNonStriker : preStriker;
    const facing = overEnded ? remaining : input.newBatsmanId;
    const other = overEnded ? input.newBatsmanId : remaining;

    try {
      const res = await fetch(`/api/matches/${matchId}/actions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-batsmen",
          strikerId: facing,
          nonStrikerId: other,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setActionError(data.error ?? "Failed to set new batsman");
      invalidate();
    } catch (err) {
      console.error("Failed to set new batsman:", err);
    }
  };

  const undoLast = useCallback(async () => {
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/balls/last`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setActionError(data.error ?? "Failed to undo ball");
      invalidate();
    } catch {
      setActionError("Network error — please retry.");
    } finally {
      setSubmitting(false);
    }
  }, [matchId, invalidate]);

  const setBatsmen = useCallback(
    async (strikerId: string, nonStrikerId: string) => {
      setSubmitting(true);
      setActionError(null);
      try {
        const res = await fetch(`/api/matches/${matchId}/actions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set-batsmen", strikerId, nonStrikerId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setActionError(data.error ?? "Failed to set batsmen");
        invalidate();
      } catch {
        setActionError("Network error — please retry.");
      } finally {
        setSubmitting(false);
      }
    },
    [matchId, invalidate]
  );

  const swapStrike = useCallback(async () => {
    setSwapStrikeOpen(false);
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/actions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "swap-strike" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setActionError(data.error ?? "Failed to swap strike");
      invalidate();
    } catch {
      setActionError("Network error — please retry.");
    } finally {
      setSubmitting(false);
    }
  }, [matchId, invalidate]);

  const setBowler = useCallback(
    async (bowlerId: string) => {
      setNextBowlerOpen(false);
      setSubmitting(true);
      setActionError(null);
      try {
        const res = await fetch(`/api/matches/${matchId}/actions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set-bowler", bowlerId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setActionError(data.error ?? "Failed to set bowler");
        invalidate();
      } catch {
        setActionError("Network error — please retry.");
      } finally {
        setSubmitting(false);
      }
    },
    [matchId, invalidate]
  );

  const setOpeners = useCallback(
    async (strikerId: string, nonStrikerId: string, bowlerId: string) => {
      setOpenersOpen(false);
      setSubmitting(true);
      setActionError(null);
      try {
        const res = await fetch(`/api/matches/${matchId}/actions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set-openers", strikerId, nonStrikerId, bowlerId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setActionError(data.error ?? "Failed to set openers");
        invalidate();
      } catch {
        setActionError("Network error — please retry.");
      } finally {
        setSubmitting(false);
      }
    },
    [matchId, invalidate]
  );

  const editBall = useCallback(
    async (ballId: string, runs: number) => {
      setSubmitting(true);
      setActionError(null);
      try {
        const res = await fetch(`/api/matches/${matchId}/balls/${ballId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runs }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setActionError(data.error ?? "Failed to edit ball");
        setEditBallId(null);
        invalidate();
      } catch {
        setActionError("Network error — please retry.");
      } finally {
        setSubmitting(false);
      }
    },
    [matchId, invalidate]
  );

  const deleteBall = useCallback(
    async (ballId: string) => {
      setSubmitting(true);
      setActionError(null);
      try {
        const res = await fetch(`/api/matches/${matchId}/balls/${ballId}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setActionError(data.error ?? "Failed to delete ball");
        invalidate();
      } catch {
        setActionError("Network error — please retry.");
      } finally {
        setSubmitting(false);
      }
    },
    [matchId, invalidate]
  );

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.metaKey || e.ctrlKey || e.altKey ||
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSelectElement ||
        (e.target as HTMLElement)?.tagName === "INPUT"
      ) {
        return;
      }
      if (dismissalOpen || extrasKind || openersOpen || nextBowlerOpen || changeBatsmanOpen || confirm) return;

      const k = e.key.toLowerCase();
      if (k >= "0" && k <= "6") {
        e.preventDefault();
        void recordBall({ runs: parseInt(k, 10) });
      } else if (k === "w") {
        setExtrasKind("WIDE");
      } else if (k === "n") {
        setExtrasKind("NO_BALL");
      } else if (k === "b") {
        setExtrasKind("BYE");
      } else if (k === "l") {
        setExtrasKind("LEG_BYE");
      } else if (k === "k") {
        if (currentInnings?.strikerId) {
          setDismissalOpen(true);
        }
      } else if (k === "u") {
        void undoLast();
      } else if (k === "z") {
        void swapStrike();
      } else if (k === "o") {
        setNextBowlerOpen(true);
      } else if (k === "e") {
        if (isOverComplete) setNextBowlerOpen(true);
      } else if (k === "p") {
        if (match?.status === "LIVE" && !match.isPaused) void postAction("pause");
      } else if (k === "r") {
        if (match?.status === "LIVE" && match.isPaused) void postAction("resume");
      } else if (k === "s") {
        setChangeBatsmanOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    dismissalOpen,
    extrasKind,
    openersOpen,
    nextBowlerOpen,
    changeBatsmanOpen,
    confirm,
    currentInnings,
    isOverComplete,
    match,
    recordBall,
    undoLast,
    swapStrike,
    postAction,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted">Loading match data...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-10 h-10 text-danger" />
          <p className="text-sm text-danger">Match not found</p>
        </div>
      </div>
    );
  }

  const target = currentInnings?.targetScore;
  const requiredRunRate =
    target && legalBalls > 0
      ? ((target - currentInnings.totalRuns) /
          Math.max(match.totalOvers * 6 - legalBalls, 0.1) *
          6).toFixed(2)
      : null;
  const crr =
    legalBalls > 0
      ? ((currentInnings?.totalRuns ?? 0) / (legalBalls / 6)).toFixed(2)
      : "0.00";

  return (
    <div className="space-y-4">
      {!canScore && (
        <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-muted">
          You are viewing this match as a spectator. Only assigned scorers and
          admins can enter scores.
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between gap-3 bg-danger/10 border border-danger/30 rounded-2xl px-4 py-3">
          <p className="text-sm text-danger flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {actionError}
          </p>
          <button
            onClick={() => setActionError(null)}
            className="text-danger hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <StatusBadge status={match.status} />
          <span className="text-sm text-muted">
            {match.homeTeam.name} vs {match.awayTeam.name} &middot;{" "}
            {currentInnings
              ? `Innings ${currentInnings.inningsNumber}`
              : "Not started"}
          </span>
        </div>
        {canScore && match.status === "LIVE" && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirm({
                title: "Undo last ball",
                message: "Remove the most recently recorded delivery?",
                action: undoLast,
                label: "Undo",
                danger: true,
              })}
              disabled={allBallsThisInnings.length === 0}
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </Button>
            {match.isPaused ? (
              <Button variant="secondary" size="sm" onClick={() => void postAction("resume")}>
                <Play className="w-4 h-4" />
                Resume
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => void postAction("pause")}>
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => void postAction("rain-delay")}>
              <CloudRain className="w-4 h-4" />
              Rain Delay
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void postAction("drinks-break")}>
              <Coffee className="w-4 h-4" />
              Drinks
            </Button>
          </div>
        )}
      </div>

      {/* Lifecycle: not yet live */}
      {match.status === "SCHEDULED" && (
        <ScheduledPanel match={match} onAction={postAction} canScore={canScore} />
      )}

      {match.status === "READY" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-white font-semibold mb-1">Match is ready to begin.</p>
          <p className="text-sm text-muted mb-4">
            Start the first innings when play begins.
          </p>
          {canScore ? (
            <Button
              size="lg"
              onClick={() => void postAction("start-innings")}
              loading={submitting}
            >
              <Play className="w-4 h-4" />
              Start Innings
            </Button>
          ) : (
            <p className="text-sm text-muted">Waiting for a scorer to start.</p>
          )}
        </div>
      )}

      {match.status === "INNINGS_BREAK" && (
        <div className="bg-white/5 backdrop-blur-xl border border-warning/30 rounded-2xl p-8 text-center">
          <p className="text-white font-semibold mb-1">Innings break.</p>
          <p className="text-sm text-muted mb-4">
            Start the second innings when play resumes.
          </p>
          {canScore ? (
            <Button size="lg" variant="accent" onClick={() => void postAction("start-innings")} loading={submitting}>
              <Flag className="w-4 h-4" />
              Start Second Innings
            </Button>
          ) : null}
        </div>
      )}

      {match.status === "COMPLETED" && (
        <div className="bg-white/5 backdrop-blur-xl border border-primary/30 rounded-2xl p-8 text-center">
          <Trophy className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-white font-bold text-xl mb-1">
            {match.result ?? "Match completed"}
          </p>
          {canScore && (
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => void postAction("archive")}>
              <Archive className="w-4 h-4" />
              Archive Match
            </Button>
          )}
        </div>
      )}

      {["ARCHIVED", "ABANDONED"].includes(match.status) && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-white font-semibold">{match.status.replace(/_/g, " ")}</p>
          {match.result && (
            <p className="text-sm text-muted mt-1">{match.result}</p>
          )}
        </div>
      )}

      {/* Scoreboard */}
      {currentInnings && (
        <>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <div className="relative">
              <p className="text-sm text-muted mb-1">
                {currentInnings.inningsNumber === 1
                  ? "First"
                  : "Second"}{" "}
                innings &middot;{" "}
                {match.awayTeam.id === currentInnings.battingTeam
                  ? match.awayTeam.name
                  : match.homeTeam.name}{" "}
                batting
              </p>
              <motion.p
                key={currentInnings.totalRuns}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-7xl font-bold gradient-text leading-none my-4"
              >
                {currentInnings.totalRuns}/{currentInnings.totalWickets}
              </motion.p>
              <p className="text-lg text-white/70">
                <span className="text-muted">Overs:</span>{" "}
                <span className="text-white font-semibold">
                  {currentInnings.totalOvers}
                </span>{" "}
                <span className="text-muted">/ {match.totalOvers}</span>
                <span className="text-muted mx-3">&middot;</span>
                <span className="text-muted">Extras:</span>{" "}
                <span className="text-white font-semibold">
                  {currentInnings.extras}
                </span>
              </p>
              <div className="flex items-center justify-center gap-8 mt-4 flex-wrap">
                <div className="text-center">
                  <p className="text-xs text-muted">CRR</p>
                  <p className="text-accent font-bold">{crr}</p>
                </div>
                {target && (
                  <div className="text-center">
                    <p className="text-xs text-muted">Target</p>
                    <p className="text-white font-bold">{target}</p>
                  </div>
                )}
                {target && requiredRunRate && (
                  <div className="text-center">
                    <p className="text-xs text-muted">Req. Rate</p>
                    <p className="text-warning font-bold">{requiredRunRate}</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs text-muted">Partnership</p>
                  <p className="text-white font-bold">
                    {partnership.runs}({partnership.balls})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Active players */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 backdrop-blur-xl border border-accent/50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted">On Strike</span>
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              </div>
              <p className="text-white font-semibold">
                {striker?.name ?? (needsOpeners ? "Set openers to begin" : "\u2014")}
              </p>
              {striker && (
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-2xl font-bold text-white">
                    {strikerCard?.runs ?? 0}
                  </p>
                  <p className="text-sm text-muted">
                    ({strikerCard?.balls ?? 0} balls)
                  </p>
                  <p className="text-sm text-accent font-medium">
                    SR {(strikerCard?.strikeRate ?? 0).toFixed(1)}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted">Non-Striker</span>
              </div>
              <p className="text-white font-semibold">
                {nonStriker?.name ?? (needsOpeners ? "Set openers to begin" : "\u2014")}
              </p>
              {nonStriker && (
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-2xl font-bold text-white">
                    {nonStrikerCard?.runs ?? 0}
                  </p>
                  <p className="text-sm text-muted">
                    ({nonStrikerCard?.balls ?? 0} balls)
                  </p>
                  <p className="text-sm text-accent font-medium">
                    SR {(nonStrikerCard?.strikeRate ?? 0).toFixed(1)}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted">Bowler</span>
              </div>
              <p className="text-white font-semibold">
                {bowler?.name ?? (needsOpeners ? "Set openers to begin" : isOverComplete ? "Select next bowler" : "\u2014")}
              </p>
              {bowler && bowlerCard && (
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-sm text-white">
                    <span className="text-muted">O:</span>{" "}
                    {bowlerCard.overs}
                  </p>
                  <p className="text-sm text-white">
                    <span className="text-muted">R:</span> {bowlerCard.runs}
                  </p>
                  <p className="text-sm text-white">
                    <span className="text-muted">W:</span> {bowlerCard.wickets}
                  </p>
                  <p className="text-sm text-accent font-medium">
                    Econ {(bowlerCard.economy ?? 0).toFixed(1)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* This over */}
          {allBallsThisInnings.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-muted">This Over</h3>
                {thisOver && (
                  <span className="text-xs text-muted">
                    Over {thisOver.overNumber} &middot;{" "}
                    {thisOver.totalRuns} runs / {thisOver.totalWickets} wkts
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <AnimatePresence>
                  {(thisOver?.balls ?? []).map((ball) => (
                    <motion.div
                      key={ball.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                        getBallColor(ball)
                      )}
                    >
                      {getBallDisplay(ball)}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Scoring controls */}
          {match.status === "LIVE" && canScore && (
            <>
              {needsOpeners ? (
                <div className="bg-accent/10 border border-accent/40 rounded-2xl p-6 text-center">
                  <p className="text-white font-semibold mb-1">
                    Select the openers and opening bowler
                  </p>
                  <p className="text-sm text-muted mb-4">
                    This is required before the first ball can be recorded.
                  </p>
                  <Button variant="accent" onClick={() => setOpenersOpen(true)}>
                    <UserPlus className="w-4 h-4" />
                    Set Openers & Bowler
                  </Button>
                </div>
              ) : (
                <>
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <h3 className="text-xs font-medium text-muted mb-3">
                      Ball Entry
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {[0, 1, 2, 3, 4, 6].map((runs) => (
                        <motion.button
                          key={runs}
                          whileTap={{ scale: 0.9 }}
                          disabled={submitting}
                          onClick={() => void recordBall({ runs })}
                          className={cn(
                            "py-4 rounded-xl text-xl font-bold transition-all",
                            runs === 0 && "bg-white/5 text-muted hover:bg-white/10",
                            runs === 1 && "bg-success/10 text-success hover:bg-success/20",
                            runs === 2 && "bg-success/15 text-success hover:bg-success/25",
                            runs === 3 && "bg-success/20 text-success hover:bg-success/30",
                            runs === 4 && "bg-primary/20 text-primary hover:bg-primary/30 shadow-[0_0_20px_rgba(37,99,235,0.15)]",
                            runs === 6 && "bg-accent/20 text-accent hover:bg-accent/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]",
                            submitting && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {runs}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                    <h3 className="text-xs font-medium text-muted mb-3">
                      Extras & Dismissal
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                      {(
                        [
                          { kind: "WIDE" as ExtraKind, label: "Wide", className: "bg-warning/10 text-warning hover:bg-warning/20" },
                          { kind: "NO_BALL" as ExtraKind, label: "No Ball", className: "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" },
                          { kind: "BYE" as ExtraKind, label: "Bye", className: "bg-white/5 text-muted hover:bg-white/10" },
                          { kind: "LEG_BYE" as ExtraKind, label: "Leg Bye", className: "bg-white/5 text-muted hover:bg-white/10" },
                        ]
                      ).map((b) => (
                        <motion.button
                          key={b.kind}
                          whileTap={{ scale: 0.9 }}
                          disabled={submitting}
                          onClick={() => setExtrasKind(b.kind)}
                          className={cn(
                            "py-3 rounded-xl text-sm font-medium transition-all",
                            b.className,
                            submitting && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {b.label}
                        </motion.button>
                      ))}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        disabled={submitting}
                        onClick={() => setDismissalOpen(true)}
                        className="py-3 rounded-xl bg-danger/15 text-danger text-sm font-medium hover:bg-danger/25 transition-all col-span-2 md:col-span-1"
                      >
                        WICKET
                      </motion.button>
                    </div>
                  </div>

                  {isOverComplete && (
                    <div className="bg-warning/10 border border-warning/40 rounded-2xl p-5 text-center">
                      <p className="text-white font-semibold mb-1">
                        The over is complete
                      </p>
                      <p className="text-sm text-muted mb-3">
                        Select the next bowler to continue.
                      </p>
                      <Button variant="accent" onClick={() => setNextBowlerOpen(true)}>
                        <Users className="w-4 h-4" />
                        Select Next Bowler
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Controls */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                <h3 className="text-xs font-medium text-muted mb-3">
                  Controls
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" size="sm" onClick={() => setChangeBatsmanOpen(true)}>
                    <UserPlus className="w-4 h-4" />
                    Change Batsmen
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setNextBowlerOpen(true)}>
                    <Users className="w-4 h-4" />
                    Change Bowler
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setSwapStrikeOpen(true)}>
                    <ArrowLeftRight className="w-4 h-4" />
                    Swap Strike
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setConfirm({
                        title: "End innings",
                        message: currentInnings.inningsNumber === 1
                          ? "End the first innings and go to the innings break?"
                          : "End the second innings and finish the match?",
                        action: async () => {
                          await postAction("end-innings");
                        },
                        label: "End Innings",
                        danger: true,
                      })
                    }
                  >
                    <Flag className="w-4 h-4" />
                    End Innings
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setConfirm({
                        title: "Finish match",
                        message:
                          "Finish the match now? The result will be computed from the scorecards.",
                        action: async () => {
                          await postAction("finish");
                        },
                        label: "Finish Match",
                      })
                    }
                  >
                    <Trophy className="w-4 h-4" />
                    Finish Match
                  </Button>
                </div>
              </div>

              {/* Ball history */}
              {allBallsThisInnings.length > 0 && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-medium text-muted">
                      Ball-by-ball (this innings)
                    </h3>
                    <span className="text-xs text-muted">
                      {allBallsThisInnings.length} delivery
                      {allBallsThisInnings.length > 1 ? "ies" : "y"}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {allBallsThisInnings.slice(-30).map((ball, idx) => (
                      <div key={ball.id} className="relative group">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                            getBallColor(ball)
                          )}
                          title={`#${allBallsThisInnings.indexOf(ball) + 1}: ${
                            ball.isWicket
                              ? `Wicket (${ball.wicketType ?? "out"})`
                              : `${ball.runs + ball.extraRuns} run${ball.runs + ball.extraRuns === 1 ? "" : "s"}${
                                  ball.extraType ? ` (${ball.extraType})` : ""
                                }`
                          }`}
                        >
                          {getBallDisplay(ball)}
                        </div>
                        <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-1">
                          <button
                            onClick={() => setEditBallId(ball.id)}
                            className="w-4 h-4 rounded bg-white text-black flex items-center justify-center"
                            title="Edit runs"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() =>
                              setConfirm({
                                title: "Delete ball",
                                message: "Remove this delivery from the innings?",
                                action: async () => {
                                  await deleteBall(ball.id);
                                },
                                label: "Delete",
                                danger: true,
                              })
                            }
                            className="w-4 h-4 rounded bg-danger text-white flex items-center justify-center"
                            title="Delete ball"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        {idx === allBallsThisInnings.slice(-30).length - 1 && (
                          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Commentary */}
      {match.commentary?.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <h3 className="text-xs font-medium text-muted mb-3">Commentary</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {match.commentary.slice(-40).map((c) => (
              <div
                key={c.id}
                className={cn(
                  "text-sm px-3 py-2 rounded-xl border",
                  c.isHighlight
                    ? "border-accent/40 bg-accent/5 text-white"
                    : "border-white/5 bg-white/[0.02] text-white/80"
                )}
              >
                {c.content}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard shortcut legend */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <h3 className="text-xs font-medium text-muted mb-3">
          Keyboard Shortcuts
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {KEY_SHORTCUTS.map((s) => (
            <div key={s.label} className="flex items-center justify-between gap-2">
              <span className="text-xs text-white/70">{s.label}</span>
              <kbd className="text-[10px] text-muted bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <SetOpenersModal
        isOpen={openersOpen}
        onClose={() => setOpenersOpen(false)}
        battingPlayers={battingTeamPlayers}
        bowlingPlayers={bowlingTeamPlayers}
        onConfirm={setOpeners}
        submitting={submitting}
      />
      <DismissalModal
        isOpen={dismissalOpen}
        onClose={() => setDismissalOpen(false)}
        battingPlayers={battingTeamPlayers}
        bowlingPlayers={bowlingTeamPlayers}
        dismissed={
          currentInnings?.strikerId && currentInnings.nonStrikerId
            ? {
                strikerId: currentInnings.strikerId,
                nonStrikerId: currentInnings.nonStrikerId,
              }
            : null
        }
        onConfirm={(input) => void handleWicket(input)}
        submitting={submitting}
      />
      <ExtrasModal
        isOpen={extrasKind !== null}
        onClose={() => setExtrasKind(null)}
        kind={extrasKind}
        onConfirm={(runs) => {
          if (extrasKind) handleExtras(extrasKind, runs);
        }}
        submitting={submitting}
      />
      <PlayerPickerModal
        isOpen={nextBowlerOpen}
        onClose={() => setNextBowlerOpen(false)}
        title="Select Bowler"
        players={bowlingTeamPlayers}
        selectedId={currentInnings?.currentBowlerId}
        onSelect={(p) => void setBowler(p.id)}
        excludeIds={
          currentInnings && isOverComplete
            ? currentInnings.overs
                .filter((o) => o.isCompleted)
                .slice(-1)
                .map((o) => o.bowlerId)
            : []
        }
        hint="A bowler cannot bowl two consecutive overs."
      />
      <SetBatsmenModal
        isOpen={changeBatsmanOpen}
        onClose={() => setChangeBatsmanOpen(false)}
        players={battingTeamPlayers}
        onConfirm={(strikerId, nonStrikerId) => void setBatsmen(strikerId, nonStrikerId)}
        submitting={submitting}
      />
      <ConfirmModal
        isOpen={swapStrikeOpen}
        onClose={() => setSwapStrikeOpen(false)}
        onConfirm={() => void swapStrike()}
        title="Swap Strike"
        confirmLabel="Swap"
      >
        Swap the striker and non-striker at the crease?
      </ConfirmModal>
      {confirm && (
        <ConfirmModal
          isOpen
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            await confirm.action();
            setConfirm(null);
          }}
          title={confirm.title}
          confirmLabel={confirm.label ?? "Confirm"}
          danger={confirm.danger}
          submitting={submitting}
        >
          {confirm.message}
        </ConfirmModal>
      )}
      <EditBallModal
        isOpen={editBallId !== null}
        onClose={() => setEditBallId(null)}
        ball={
          editBallId
            ? allBallsThisInnings.find((b) => b.id === editBallId) ?? null
            : null
        }
        onConfirm={(runs) => {
          if (editBallId) void editBall(editBallId, runs);
        }}
        submitting={submitting}
      />
    </div>
  );
}

function ScheduledPanel({
  match,
  onAction,
  canScore,
}: {
  match: MatchDetail;
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<boolean>;
  canScore: boolean;
}) {
  const [tossWinner, setTossWinner] = useState(match.tossWinner ?? "");
  const [tossDecision, setTossDecision] = useState<"BAT" | "BOWL">(
    (match.tossDecision as "BAT" | "BOWL") ?? "BAT"
  );
  const [saving, setSaving] = useState(false);

  const saveToss = async () => {
    if (!tossWinner) return;
    setSaving(true);
    await onAction("toss", { tossWinner, tossDecision });
    setSaving(false);
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-white mb-4">Pre-match setup</h3>
      {!canScore && (
        <p className="text-sm text-muted mb-4">
          Only the creator (no scorers assigned) or assigned scorers/admins can
          set the toss and start the match.
        </p>
      )}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-muted mb-2">Toss Winner</label>
          <select
            value={tossWinner}
            onChange={(e) => setTossWinner(e.target.value)}
            disabled={!canScore}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          >
            <option value="" className="bg-background">Select team</option>
            <option value={match.homeTeamId} className="bg-background">
              {match.homeTeam.name}
            </option>
            <option value={match.awayTeamId} className="bg-background">
              {match.awayTeam.name}
            </option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-2">Decision</label>
          <div className="flex gap-2">
            {(["BAT", "BOWL"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setTossDecision(d)}
                disabled={!canScore}
                className={cn(
                  "flex-1 py-3 rounded-xl border text-sm font-medium capitalize transition-colors disabled:opacity-50",
                  tossDecision === d
                    ? "bg-accent/20 border-accent text-white"
                    : "bg-white/5 border-white/10 text-muted"
                )}
              >
                {d === "BAT" ? "Bat first" : "Bowl first"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => void saveToss()}
            disabled={!canScore || !tossWinner}
            loading={saving}
          >
            Save Toss
          </Button>
        </div>
      </div>

      {match.tossWinner && match.tossDecision && canScore && (
        <div className="mt-6 border-t border-white/10 pt-4 text-center">
          <Button
            size="lg"
            onClick={() => void onAction("start")}
            loading={saving}
          >
            <Play className="w-4 h-4" />
            Start Match
          </Button>
          <p className="text-xs text-muted mt-2">
            Starts the match (status: READY). Then begin the first innings.
          </p>
        </div>
      )}
      {!match.tossWinner && canScore && (
        <p className="text-xs text-muted mt-4">
          Set the toss result before you can start the match.
        </p>
      )}
    </div>
  );
}

function SetOpenersModal({
  isOpen,
  onClose,
  battingPlayers,
  bowlingPlayers,
  onConfirm,
  submitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  battingPlayers: PlayerRef[];
  bowlingPlayers: PlayerRef[];
  onConfirm: (striker: string, nonStriker: string, bowler: string) => void;
  submitting: boolean;
}) {
  const [striker, setStriker] = useState<string | null>(null);
  const [nonStriker, setNonStriker] = useState<string | null>(null);
  const [bowler, setBowler] = useState<string | null>(null);
  const [pick, setPick] = useState<"striker" | "nonStriker" | "bowler" | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStriker(null);
      setNonStriker(null);
      setBowler(null);
    }
  }, [isOpen]);

  const ready = striker && nonStriker && bowler;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Set Openers & Bowler" size="md">
        <div className="space-y-3">
          <OpenersRow
            label="Striker"
            playerId={striker}
            players={battingPlayers}
            onPick={() => setPick("striker")}
          />
          <OpenersRow
            label="Non-Striker"
            playerId={nonStriker}
            players={battingPlayers}
            onPick={() => setPick("nonStriker")}
          />
          <OpenersRow
            label="Opening Bowler"
            playerId={bowler}
            players={bowlingPlayers}
            onPick={() => setPick("bowler")}
          />
          <div className="pt-2 flex justify-end">
            <Button
              onClick={() => {
                if (ready) onConfirm(striker, nonStriker, bowler);
              }}
              disabled={!ready}
              loading={submitting}
            >
              Begin Innings
            </Button>
          </div>
        </div>
      </Modal>
      <PlayerPickerModal
        isOpen={pick !== null}
        onClose={() => setPick(null)}
        title={
          pick === "striker"
            ? "Select Striker"
            : pick === "nonStriker"
              ? "Select Non-Striker"
              : "Select Bowler"
        }
        players={pick === "bowler" ? bowlingPlayers : battingPlayers}
        onSelect={(p) => {
          if (pick === "striker") setStriker(p.id);
          else if (pick === "nonStriker") setNonStriker(p.id);
          else setBowler(p.id);
          setPick(null);
        }}
        excludeIds={
          pick === "striker" && nonStriker
            ? [nonStriker]
            : pick === "nonStriker" && striker
              ? [striker]
              : []
        }
      />
    </>
  );
}

function OpenersRow({
  label,
  playerId,
  players,
  onPick,
}: {
  label: string;
  playerId: string | null;
  players: PlayerRef[];
  onPick: () => void;
}) {
  const p = players.find((x) => x.id === playerId);
  return (
    <button
      onClick={onPick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors",
        playerId
          ? "bg-accent/10 border-accent text-white"
          : "bg-white/5 border-white/10 text-muted hover:bg-white/10"
      )}
    >
      <span>{p?.name ?? `Select ${label}`}</span>
      <span className="text-xs text-accent">{playerId ? "Change" : "Pick"}</span>
    </button>
  );
}

function SetBatsmenModal({
  isOpen,
  onClose,
  players,
  onConfirm,
  submitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  players: PlayerRef[];
  onConfirm: (strikerId: string, nonStrikerId: string) => void;
  submitting: boolean;
}) {
  const [striker, setStriker] = useState<string | null>(null);
  const [nonStriker, setNonStriker] = useState<string | null>(null);
  const [pick, setPick] = useState<"striker" | "nonStriker" | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStriker(null);
      setNonStriker(null);
    }
  }, [isOpen]);

  const ready = striker && nonStriker && striker !== nonStriker;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Set Batsmen" size="sm">
        <div className="space-y-3">
          <OpenersRow
            label="Striker"
            playerId={striker}
            players={players}
            onPick={() => setPick("striker")}
          />
          <OpenersRow
            label="Non-Striker"
            playerId={nonStriker}
            players={players}
            onPick={() => setPick("nonStriker")}
          />
          <div className="pt-2 flex justify-end">
            <Button
              onClick={() => {
                if (ready) onConfirm(striker, nonStriker);
              }}
              disabled={!ready}
              loading={submitting}
            >
              Set Batsmen
            </Button>
          </div>
        </div>
      </Modal>
      <PlayerPickerModal
        isOpen={pick !== null}
        onClose={() => setPick(null)}
        title={pick === "striker" ? "Select Striker" : "Select Non-Striker"}
        players={players}
        onSelect={(p) => {
          if (pick === "striker") setStriker(p.id);
          else setNonStriker(p.id);
          setPick(null);
        }}
        excludeIds={
          pick === "striker" && nonStriker
            ? [nonStriker]
            : pick === "nonStriker" && striker
              ? [striker]
              : []
        }
      />
    </>
  );
}

function EditBallModal({
  isOpen,
  onClose,
  ball,
  onConfirm,
  submitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  ball: { id: string; runs: number; extraRuns: number } | null;
  onConfirm: (runs: number) => void;
  submitting: boolean;
}) {
  const [runs, setRuns] = useState(0);

  useEffect(() => {
    if (ball) setRuns(ball.runs + ball.extraRuns);
  }, [ball]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Ball" size="sm">
      <p className="text-sm text-muted mb-3">
        Update the total runs for this delivery. Wicket details are not changed
        here.
      </p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[0, 1, 2, 3, 4, 6].map((r) => (
          <button
            key={r}
            onClick={() => setRuns(r)}
            className={cn(
              "py-3 rounded-xl border text-lg font-bold transition-colors",
              runs === r
                ? "bg-accent/20 border-accent text-white"
                : "bg-white/5 border-white/10 text-muted"
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          loading={submitting}
          onClick={() => onConfirm(runs)}
        >
          Save
        </Button>
      </div>
    </Modal>
  );
}
