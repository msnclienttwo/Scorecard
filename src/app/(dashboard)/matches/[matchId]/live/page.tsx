"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Coffee,
  Loader2,
  Lock,
  Play,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StartMatchModal } from "@/components/match/StartMatchModal";
import {
  useLiveScoring,
  type EditBallPatch,
  type ExtraKind,
  type WicketConfirmInput,
} from "@/hooks/useLiveScoring";
import type { InningsDetail, MatchDetail } from "@/hooks/useMatchLive";
import { Scoreboard } from "@/components/scoring/Scoreboard";
import { CompactScorePill } from "@/components/scoring/CompactScorePill";
import { BatterCards } from "@/components/scoring/BatterCards";
import { BowlerCard } from "@/components/scoring/BowlerCard";
import { ThisOverStrip } from "@/components/scoring/ThisOverStrip";
import { PartnershipPanel } from "@/components/scoring/PartnershipPanel";
import { ScoringPad } from "@/components/scoring/ScoringPad";
import { QuickActionBar } from "@/components/scoring/QuickActionBar";
import { AdvancedScoringPanel } from "@/components/scoring/AdvancedScoringPanel";
import type { WicketTypeValue } from "@/components/scoring/scoreUtils";
import { SetUpInningsModal } from "@/components/scoring/SetUpInningsModal";
import { DismissalModal } from "@/components/scoring/DismissalModal";
import { NextBatterModal } from "@/components/scoring/NextBatterModal";
import { NextBowlerModal } from "@/components/scoring/NextBowlerModal";
import { ExtrasRunsModal } from "@/components/scoring/ExtrasRunsModal";
import { EditLastBallModal } from "@/components/scoring/EditLastBallModal";
import { ConfirmModal } from "@/components/scoring/ConfirmModal";
import { ShortcutsHelpModal } from "@/components/scoring/ShortcutsHelpModal";
import { formatStoredOvers } from "@/lib/utils";
import {
  advancedToBallInput,
  EMPTY_ADVANCED,
  getBattingHand,
  type AdvancedBallMeta,
} from "@/lib/advancedScoring";

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
}

export default function LiveScoringPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const live = useLiveScoring(matchId);

  const {
    match,
    currentInnings,
    isLoading,
    submitting,
    actionError,
    setActionError,
    canScore,
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
    lastBall,
    nextBallIsFreeHit,
    partnership,
    dismissedPlayerIds,
    crr,
    requiredRunRate,
    battingTeamPlayers,
    bowlingTeamPlayers,
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
    postAction,
  } = live;

  // ---- modal state ---------------------------------------------------------
  const [showOpeners, setShowOpeners] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showDismissal, setShowDismissal] = useState(false);
  const [batterPickerMode, setBatterPickerMode] = useState<
    "next" | "change" | null
  >(null);
  const [showBowlerPicker, setShowBowlerPicker] = useState(false);
  const [extrasKind, setExtrasKind] = useState<ExtraKind | null>(null);
  const [showEditLast, setShowEditLast] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [deferBowler, setDeferBowler] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [pendingAdvanced, setPendingAdvanced] =
    useState<AdvancedBallMeta>(EMPTY_ADVANCED);
  const [dismissalWicketType, setDismissalWicketType] =
    useState<WicketTypeValue | null>(null);

  // Compact floating score bar: shown only while the full scoreboard is
  // scrolled out of view, hidden again as soon as it comes back into view.
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const [scoreVisible, setScoreVisible] = useState(true);

  useEffect(() => {
    const node = scoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setScoreVisible(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Auto-open the setup / next-batter / next-bowler flows whenever the server
  // state demands them. This is the fix for BUG 1: the console no longer waits
  // for a ball to be recorded before the scoring UI is usable. All flows are
  // gated on the match being LIVE so they never pop open after the match ends.
  useEffect(() => {
    if (match?.status === "LIVE" && needsOpeners) setShowOpeners(true);
  }, [match?.status, needsOpeners]);

  useEffect(() => {
    if (match?.status === "LIVE" && needsNextBatter) setBatterPickerMode("next");
  }, [match?.status, needsNextBatter]);

  useEffect(() => {
    if (match?.status !== "LIVE") return;
    if (!needsNextBowler) return;
    if (needsNextBatter) {
      // A wicket on the final ball of an over needs the next batter first.
      setDeferBowler(true);
    } else {
      setShowBowlerPicker(true);
    }
  }, [match?.status, needsNextBowler, needsNextBatter]);

  useEffect(() => {
    if (match?.status === "LIVE" && !needsNextBatter && deferBowler) {
      setDeferBowler(false);
      setShowBowlerPicker(true);
    }
  }, [match?.status, needsNextBatter, deferBowler]);

  // ---- derived -------------------------------------------------------------
  const lastBowlerId = useMemo(() => {
    const completed = (currentInnings?.overs ?? []).filter(
      (o) => o.isCompleted
    );
    return completed.length
      ? completed[completed.length - 1].bowlerId
      : null;
  }, [currentInnings]);

  const nextBatterExcluded = useMemo(() => {
    const ids: string[] = [];
    if (currentInnings?.strikerId) ids.push(currentInnings.strikerId);
    if (currentInnings?.nonStrikerId) ids.push(currentInnings.nonStrikerId);
    return ids;
  }, [currentInnings]);

  const anyModalOpen =
    showOpeners ||
    showStart ||
    showDismissal ||
    batterPickerMode !== null ||
    showBowlerPicker ||
    extrasKind !== null ||
    showEditLast ||
    confirmState !== null ||
    showShortcuts;

  // ---- actions -------------------------------------------------------------
  const clearPendingAdvanced = useCallback(() => {
    setPendingAdvanced(EMPTY_ADVANCED);
  }, []);

  const onRuns = useCallback(
    async (runs: number) => {
      const ok = await recordBall({
        runs,
        ...advancedToBallInput(pendingAdvanced),
      });
      if (ok) clearPendingAdvanced();
    },
    [recordBall, pendingAdvanced, clearPendingAdvanced]
  );

  const onExtrasConfirm = useCallback(
    async (kind: ExtraKind, runs: number) => {
      const ok = await handleExtras(
        kind,
        runs,
        advancedToBallInput(pendingAdvanced)
      );
      if (ok) clearPendingAdvanced();
    },
    [handleExtras, pendingAdvanced, clearPendingAdvanced]
  );

  const onWicketConfirm = useCallback(
    async (input: WicketConfirmInput) => {
      setShowDismissal(false);
      const ok = await handleWicketConfirm(
        input,
        advancedToBallInput(pendingAdvanced)
      );
      if (ok) clearPendingAdvanced();
    },
    [handleWicketConfirm, pendingAdvanced, clearPendingAdvanced]
  );

  const openDismissal = useCallback(
    (preset: WicketTypeValue | null) => {
      if (!currentInnings?.strikerId || !currentInnings.nonStrikerId) return;
      setDismissalWicketType(preset);
      setShowDismissal(true);
    },
    [currentInnings]
  );

  const closeDismissal = useCallback(() => {
    setShowDismissal(false);
    setDismissalWicketType(null);
  }, []);

  const onNextBatter = useCallback(
    async (id: string) => {
      const mode = batterPickerMode;
      setBatterPickerMode(null);
      if (mode === "change") {
        const nonStriker = currentInnings?.nonStrikerId;
        if (nonStriker) await setBatsmen(id, nonStriker);
      } else {
        await setNextBatter(id);
      }
    },
    [batterPickerMode, currentInnings, setBatsmen, setNextBatter]
  );

  const onBowlerSelect = useCallback(
    async (id: string) => {
      setShowBowlerPicker(false);
      await setBowler(id);
    },
    [setBowler]
  );

  const onOpenersConfirm = useCallback(
    async (strikerId: string, nonStrikerId: string, bowlerId: string) => {
      setShowOpeners(false);
      await setOpeners(strikerId, nonStrikerId, bowlerId);
    },
    [setOpeners]
  );

  const resetTransient = useCallback(() => {
    setShowDismissal(false);
    setBatterPickerMode(null);
    setShowBowlerPicker(false);
    setShowOpeners(false);
  }, []);

  const onUndo = useCallback(async () => {
    const ok = await undoLast();
    if (ok) resetTransient();
  }, [undoLast, resetTransient]);

  const onDeleteBall = useCallback(async () => {
    if (!lastBall) return;
    setShowEditLast(false);
    const ok = await deleteBall(lastBall.id);
    if (ok) resetTransient();
  }, [lastBall, deleteBall, resetTransient]);

  const onEditSave = useCallback(
    async (patch: EditBallPatch) => {
      if (!lastBall) return;
      setShowEditLast(false);
      const ok = await editBall(lastBall.id, patch);
      if (ok) resetTransient();
    },
    [lastBall, editBall, resetTransient]
  );

  const onTogglePause = useCallback(() => {
    if (!match) return;
    void postAction(match.isPaused ? "resume" : "pause");
  }, [postAction, match]);

  const onStartInnings = useCallback(async () => {
    await postAction("start-innings");
  }, [postAction]);

  const ask = (
    title: string,
    message: string,
    confirmLabel: string,
    onConfirm: () => void,
    variant: "default" | "danger" = "default"
  ) => {
    setConfirmState({ title, message, confirmLabel, variant, onConfirm });
  };

  const onEndInnings = () => {
    ask(
      "End Innings",
      "End the current innings and lock in the batting side's score?",
      "End Innings",
      () => {
        setConfirmState(null);
        void postAction("end-innings");
      },
      "default"
    );
  };

  const onFinish = () => {
    ask(
      "Finish Match",
      "End the match with the current score? The result will be computed automatically.",
      "Finish Match",
      () => {
        setConfirmState(null);
        void postAction("finish");
      }
    );
  };

  const onRainDelay = () => {
    ask(
      "Rain Delay",
      "Suspend play due to rain? The match will be paused.",
      "Rain Delay",
      () => {
        setConfirmState(null);
        void postAction("rain-delay");
      }
    );
  };

  const onDrinks = () => {
    ask(
      "Drinks Break",
      "Take a drinks break? The match will be paused.",
      "Drinks Break",
      () => {
        setConfirmState(null);
        void postAction("drinks-break");
      }
    );
  };

  // ---- keyboard shortcuts --------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      if (anyModalOpen) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;
      if (key >= "0" && key <= "6") {
        e.preventDefault();
        void onRuns(Number(key));
        return;
      }
      const lower = key.toLowerCase();
      switch (lower) {
        case "w":
          e.preventDefault();
          setExtrasKind("WIDE");
          break;
        case "n":
          e.preventDefault();
          setExtrasKind("NO_BALL");
          break;
        case "b":
          e.preventDefault();
          setExtrasKind("BYE");
          break;
        case "l":
          e.preventDefault();
          setExtrasKind("LEG_BYE");
          break;
        case "k":
          e.preventDefault();
          openDismissal(null);
          break;
        case "u":
        case "z":
          e.preventDefault();
          void onUndo();
          break;
        case "s":
          e.preventDefault();
          if (striker && nonStriker) void swapStrike();
          break;
        case "o":
          e.preventDefault();
          setShowBowlerPicker(true);
          break;
        case "p":
          e.preventDefault();
          onTogglePause();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    anyModalOpen,
    currentInnings,
    striker,
    nonStriker,
    onRuns,
    openDismissal,
    onUndo,
    swapStrike,
    onTogglePause,
  ]);

  // ---- loading / access guards --------------------------------------------
  if (isLoading || !match) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-muted">Loading match…</p>
        </div>
      </div>
    );
  }

  if (!canScore) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-muted" />
          <h1 className="mt-4 text-lg font-bold text-white">
            Scoring unavailable
          </h1>
          <p className="mt-2 text-sm text-muted">
            {match.scoringAccess?.reason ??
              "You do not have permission to score this match."}
          </p>
        </div>
      </div>
    );
  }

  const status = match.status;
  const isScheduled = status === "SCHEDULED";
  const isReady = status === "READY";
  const isBreak = status === "INNINGS_BREAK";
  const isCompleted = status === "COMPLETED" || status === "ARCHIVED";
  const showConsole =
    status === "LIVE" && !!currentInnings && currentInnings.endedAt === null;
  const showDock = status === "LIVE" && !!currentInnings;

  const startMatchInput = {
    id: match.id,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeTeam: {
      id: match.homeTeam.id,
      name: match.homeTeam.name,
      shortName: match.homeTeam.shortName ?? "",
    },
    awayTeam: {
      id: match.awayTeam.id,
      name: match.awayTeam.name,
      shortName: match.awayTeam.shortName ?? "",
    },
    tossWinner: match.tossWinner,
    tossDecision: match.tossDecision,
    scoringAccess: match.scoringAccess,
    squads: match.squads,
  };

  return (
    <div className="min-h-screen">
      <CompactScorePill
        visible={!scoreVisible && showDock}
        match={match}
        currentInnings={currentInnings}
        legalBalls={legalBalls}
        isPaused={match.isPaused}
      />

      <div ref={scoreRef}>
        <Scoreboard
          match={match}
          currentInnings={currentInnings}
          legalBalls={legalBalls}
          crr={crr}
          requiredRunRate={requiredRunRate}
          onSetup={() => setShowOpeners(true)}
          showSetupButton={
            status === "LIVE" && !!currentInnings && legalBalls === 0
          }
        />
      </div>

      {actionError && (
        <div className="mx-auto max-w-6xl px-3 pt-3 md:px-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3">
            <p className="flex items-center gap-2 text-sm text-danger">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {actionError}
            </p>
            <button
              onClick={() => setActionError(null)}
              className="text-danger transition-colors hover:text-white"
            >
              <span className="sr-only">Dismiss</span>×
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-3 py-4 md:px-4">
        {isScheduled || (isReady && !currentInnings) ? (
          <PreStartCard
            status={status}
            onStart={
              isReady ? () => void onStartInnings() : () => setShowStart(true)
            }
          />
        ) : isBreak ? (
          <BreakCard innings={currentInnings} onStart={onStartInnings} />
        ) : isCompleted ? (
          <CompletedCard match={match} />
        ) : !currentInnings ? (
          <PreStartCard
            status={status}
            onStart={
              status === "LIVE" || status === "READY"
                ? () => void onStartInnings()
                : () => setShowStart(true)
            }
          />
        ) : showConsole ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="space-y-3">
              <ThisOverStrip over={thisOver} lastBall={lastBall} />
              <BatterCards
                striker={striker}
                nonStriker={nonStriker}
                strikerCard={strikerCard}
                nonStrikerCard={nonStrikerCard}
              />
              <div className="lg:hidden">
                <BowlerCard bowler={bowler} card={bowlerCard} />
              </div>
              <div className="lg:hidden">
                <PartnershipPanel
                  runs={partnership.runs}
                  balls={partnership.balls}
                  fallOfWickets={currentInnings.fallOfWickets ?? []}
                />
              </div>
            </div>
            <aside className="hidden space-y-3 lg:block">
              <BowlerCard bowler={bowler} card={bowlerCard} />
              <PartnershipPanel
                runs={partnership.runs}
                balls={partnership.balls}
                fallOfWickets={currentInnings.fallOfWickets ?? []}
              />
            </aside>
          </div>
        ) : (
          <BreakCard innings={currentInnings} onStart={onStartInnings} />
        )}
      </div>

      {showDock && (
        <div className="sticky bottom-0 z-40 border-t border-white/10 bg-[#0a0f1a]/95 backdrop-blur">
          <div className="mx-auto max-w-6xl space-y-2 px-3 py-2.5 md:px-4">
            <QuickActionBar
              submitting={submitting}
              hasLastBall={!!lastBall}
              isPaused={match.isPaused}
              onUndo={() => void onUndo()}
              onEditLast={() => setShowEditLast(true)}
              onSwap={() => {
                if (striker && nonStriker) void swapStrike();
              }}
              onChangeBatter={() => {
                if (currentInnings?.strikerId && currentInnings.nonStrikerId) {
                  setBatterPickerMode("change");
                }
              }}
              onChangeBowler={() => setShowBowlerPicker(true)}
              onTogglePause={onTogglePause}
              onRainDelay={onRainDelay}
              onDrinks={onDrinks}
              onEndInnings={onEndInnings}
              onFinish={onFinish}
              onHelp={() => setShowShortcuts(true)}
            />
            {showConsole && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex rounded-xl border border-white/10 bg-white/5 p-0.5">
                  <button
                    type="button"
                    onClick={() => setAdvancedMode(false)}
                    className={
                      !advancedMode
                        ? "rounded-lg bg-accent/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent"
                        : "rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted hover:text-white"
                    }
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvancedMode(true)}
                    className={
                      advancedMode
                        ? "rounded-lg bg-primary/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary"
                        : "rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted hover:text-white"
                    }
                  >
                    Advanced
                  </button>
                </div>
                {nextBallIsFreeHit && (
                  <span className="rounded-full bg-accent/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
                    Free hit next ball
                  </span>
                )}
              </div>
            )}
            {showConsole && advancedMode && (
              <AdvancedScoringPanel
                battingHand={getBattingHand(striker)}
                freeHit={nextBallIsFreeHit}
                submitting={submitting}
                meta={pendingAdvanced}
                onChange={setPendingAdvanced}
                onRunOut={() => openDismissal("RUN_OUT")}
              />
            )}
            <ScoringPad
              submitting={submitting}
              onRuns={onRuns}
              onWicket={() => openDismissal(null)}
              onExtras={(kind) => setExtrasKind(kind)}
            />
          </div>
        </div>
      )}

      <SetUpInningsModal
        isOpen={showOpeners}
        onClose={() => setShowOpeners(false)}
        battingPlayers={battingTeamPlayers}
        bowlingPlayers={bowlingTeamPlayers}
        initialStrikerId={currentInnings?.strikerId ?? null}
        initialNonStrikerId={currentInnings?.nonStrikerId ?? null}
        initialBowlerId={currentInnings?.currentBowlerId ?? null}
        submitting={submitting}
        onConfirm={(s, ns, b) => void onOpenersConfirm(s, ns, b)}
      />

      <StartMatchModal
        isOpen={showStart}
        onClose={() => setShowStart(false)}
        match={startMatchInput}
        onStarted={() => setShowStart(false)}
      />

      <DismissalModal
        isOpen={showDismissal}
        onClose={closeDismissal}
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
        initialWicketType={dismissalWicketType}
        submitting={submitting}
        onConfirm={(input) => void onWicketConfirm(input)}
      />

      <NextBatterModal
        isOpen={batterPickerMode !== null}
        onClose={() => setBatterPickerMode(null)}
        battingPlayers={battingTeamPlayers}
        excludedIds={nextBatterExcluded}
        dismissedIds={dismissedPlayerIds}
        submitting={submitting}
        title={batterPickerMode === "change" ? "Change Batter" : "Select Next Batter"}
        hint={
          batterPickerMode === "change"
            ? "Pick a batter to come to the crease."
            : undefined
        }
        onConfirm={(id) => void onNextBatter(id)}
      />

      <NextBowlerModal
        isOpen={showBowlerPicker}
        onClose={() => setShowBowlerPicker(false)}
        bowlingPlayers={bowlingTeamPlayers}
        lastBowlerId={lastBowlerId}
        submitting={submitting}
        hint={
          isOverComplete
            ? "The over is complete. Pick a bowler for the next over."
            : "Choose a bowler to replace the current one."
        }
        onConfirm={(id) => void onBowlerSelect(id)}
      />

      <ExtrasRunsModal
        isOpen={extrasKind !== null}
        kind={extrasKind}
        submitting={submitting}
        onClose={() => setExtrasKind(null)}
        onConfirm={(runs) => {
          const kind = extrasKind;
          setExtrasKind(null);
          if (kind) void onExtrasConfirm(kind, runs);
        }}
      />

      <EditLastBallModal
        isOpen={showEditLast}
        onClose={() => setShowEditLast(false)}
        ball={lastBall}
        battingPlayers={battingTeamPlayers}
        bowlingPlayers={bowlingTeamPlayers}
        submitting={submitting}
        onSave={(patch: EditBallPatch) => void onEditSave(patch)}
        onDelete={() => void onDeleteBall()}
      />

      <ConfirmModal
        isOpen={confirmState !== null}
        title={confirmState?.title ?? ""}
        message={confirmState?.message ?? ""}
        confirmLabel={confirmState?.confirmLabel ?? "Confirm"}
        variant={confirmState?.variant}
        loading={submitting}
        onConfirm={confirmState?.onConfirm ?? (() => {})}
        onClose={() => setConfirmState(null)}
      />

      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}

// ---- state cards -----------------------------------------------------------

function PreStartCard({
  status,
  onStart,
}: {
  status: string;
  onStart: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 p-8 text-center">
      <Play className="mx-auto h-10 w-10 text-accent" />
      <h2 className="mt-4 text-xl font-bold text-white">
        Ready to score this match?
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        {status === "READY"
          ? "The toss is done. Start the first innings, then choose the openers and opening bowler."
          : "Set up the toss, squads and openers, then start ball-by-ball scoring."}
      </p>
      <Button size="lg" className="mt-6" onClick={onStart}>
        <Play className="h-4 w-4" />
        {status === "READY" ? "Start First Innings" : "Start Scoring"}
      </Button>
    </div>
  );
}

function BreakCard({
  innings,
  onStart,
}: {
  innings: InningsDetail | null;
  onStart: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-warning/10 via-transparent to-accent/5 p-8 text-center">
      <Coffee className="mx-auto h-10 w-10 text-warning" />
      <h2 className="mt-4 text-xl font-bold text-white">Innings Break</h2>
      {innings && (
        <p className="mt-2 text-sm text-muted">
          Innings {innings.inningsNumber} ended at {innings.totalRuns}/
          {innings.totalWickets} in {formatStoredOvers(innings.totalOvers)} overs
        </p>
      )}
      <Button size="lg" className="mt-6" onClick={onStart}>
        <Play className="h-4 w-4" />
        Start Next Innings
      </Button>
    </div>
  );
}

function CompletedCard({ match }: { match: MatchDetail }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-success/10 via-transparent to-accent/5 p-8 text-center">
      <Trophy className="mx-auto h-10 w-10 text-success" />
      <h2 className="mt-4 text-xl font-bold text-white">
        {match.result ?? "Match Complete"}
      </h2>
      <p className="mt-2 text-sm text-muted">
        {match.completedAt
          ? "The final scorecard is available."
          : "This match has ended."}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href={`/matches/${match.id}`}>
          <Button>View Match</Button>
        </Link>
      </div>
    </div>
  );
}
