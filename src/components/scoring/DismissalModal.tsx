"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { WICKET_TYPES, type WicketTypeValue } from "./scoreUtils";
import type { PlayerRef } from "@/hooks/useMatchLive";
import type { WicketConfirmInput } from "@/hooks/useLiveScoring";

type Step = "type" | "dismissed" | "fielder";

interface DismissalModalProps {
  isOpen: boolean;
  onClose: () => void;
  battingPlayers: PlayerRef[];
  bowlingPlayers: PlayerRef[];
  dismissed: { strikerId: string; nonStrikerId: string } | null;
  initialWicketType?: WicketTypeValue | null;
  submitting: boolean;
  onConfirm: (input: WicketConfirmInput) => void;
}

export function DismissalModal({
  isOpen,
  onClose,
  battingPlayers,
  bowlingPlayers,
  dismissed,
  initialWicketType,
  submitting,
  onConfirm,
}: DismissalModalProps) {
  const [step, setStep] = useState<Step>("type");
  const [wicketType, setWicketType] = useState<WicketTypeValue | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [fielderId, setFielderId] = useState<string | null>(null);
  const [runsCompleted, setRunsCompleted] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const preset = initialWicketType ?? null;
      setWicketType(preset);
      setDismissedId(preset ? dismissed?.strikerId ?? null : null);
      setFielderId(null);
      setRunsCompleted(0);
      if (preset === "RUN_OUT") setStep("dismissed");
      else if (preset === "CAUGHT" || preset === "STUMPED") setStep("fielder");
      else setStep("type");
    }
  }, [isOpen, initialWicketType, dismissed]);

  const needsFielder =
    wicketType === "CAUGHT" ||
    wicketType === "STUMPED" ||
    wicketType === "RUN_OUT";

  const chooseType = (t: WicketTypeValue) => {
    setWicketType(t);
    setDismissedId(dismissed?.strikerId ?? null);
    setFielderId(null);
    if (t === "RUN_OUT") setStep("dismissed");
    else if (t === "CAUGHT" || t === "STUMPED") setStep("fielder");
    else setStep("type");
  };

  const chooseDismissed = (id: string) => {
    setDismissedId(id);
    if (needsFielder) setStep("fielder");
    else setStep("type");
  };

  const chooseFielder = (id: string | null) => {
    setFielderId(id);
    setStep("type");
  };

  const canConfirm = wicketType !== null && dismissedId !== null;
  const confirm = () => {
    if (!wicketType || !dismissedId) return;
    onConfirm({
      wicketType,
      dismissedPlayerId: dismissedId,
      fielderId,
      runsCompleted,
    });
  };

  const stepTitle =
    step === "dismissed"
      ? "Who was run out?"
      : step === "fielder"
        ? wicketType === "CAUGHT"
          ? "Who took the catch?"
          : "Who effected the dismissal?"
        : "How was the wicket taken?";

  const currentDismissed =
    battingPlayers.find((p) => p.id === dismissedId) ?? null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Wicket" size="lg">
      {/* runs completed */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <span className="text-sm text-white">Runs completed</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={submitting || runsCompleted <= 0}
            onClick={() => setRunsCompleted((r) => Math.max(0, r - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/15 disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-lg font-bold tabular-nums text-white">
            {runsCompleted}
          </span>
          <button
            type="button"
            disabled={submitting || runsCompleted >= 9}
            onClick={() => setRunsCompleted((r) => Math.min(9, r + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/15 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mb-3 text-sm text-muted">{stepTitle}</p>

      {step === "type" && (
        <div className="grid grid-cols-3 gap-2">
          {WICKET_TYPES.map((wt) => (
            <button
              key={wt.value}
              type="button"
              onClick={() => chooseType(wt.value)}
              className={cn(
                "rounded-xl border py-3 text-sm text-white transition-colors",
                wicketType === wt.value
                  ? "border-danger bg-danger/15"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              )}
            >
              {wt.label}
            </button>
          ))}
        </div>
      )}

      {step === "dismissed" && dismissed && (
        <div className="grid grid-cols-2 gap-2">
          {[dismissed.strikerId, dismissed.nonStrikerId].map((id) => {
            const p = battingPlayers.find((b) => b.id === id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => chooseDismissed(id)}
                className={cn(
                  "rounded-xl border py-4 text-sm text-white transition-colors",
                  dismissedId === id
                    ? "border-danger bg-danger/15"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                )}
              >
                {p?.name ?? "Batter"}
              </button>
            );
          })}
        </div>
      )}

      {step === "fielder" && (
        <div className="space-y-3">
          <div className="flex max-h-60 flex-wrap gap-2 overflow-y-auto">
            {bowlingPlayers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => chooseFielder(p.id)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm transition-colors",
                  fielderId === p.id
                    ? "border-accent bg-accent/15 text-white"
                    : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={submitting}
            onClick={() => chooseFielder(null)}
          >
            Skip (no fielder)
          </Button>
        </div>
      )}

      {wicketType && dismissedId && (
        <p className="mt-3 text-xs text-muted">
          {currentDismissed?.name ?? "Batter"} is out · {wicketType.replace(/_/g, " ")}
          {fielderId
            ? ` · fielder: ${
                bowlingPlayers.find((p) => p.id === fielderId)?.name ?? ""
              }`
            : ""}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        {(step === "dismissed" || step === "fielder") && (
          <Button
            variant="secondary"
            size="sm"
            disabled={submitting}
            onClick={() => setStep("type")}
          >
            Back
          </Button>
        )}
        <Button size="sm" disabled={!canConfirm} loading={submitting} onClick={confirm}>
          Confirm Wicket
        </Button>
      </div>
    </Modal>
  );
}
