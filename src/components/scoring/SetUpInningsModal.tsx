"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PlayerPickerModal } from "@/components/match/PlayerPickerModal";
import type { PlayerRef } from "@/hooks/useMatchLive";
import { initials } from "./scoreUtils";

type PickSlot = "striker" | "nonStriker" | "bowler" | null;

interface SetUpInningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  battingPlayers: PlayerRef[];
  bowlingPlayers: PlayerRef[];
  initialStrikerId?: string | null;
  initialNonStrikerId?: string | null;
  initialBowlerId?: string | null;
  submitting: boolean;
  onConfirm: (strikerId: string, nonStrikerId: string, bowlerId: string) => void;
}

export function SetUpInningsModal({
  isOpen,
  onClose,
  battingPlayers,
  bowlingPlayers,
  initialStrikerId,
  initialNonStrikerId,
  initialBowlerId,
  submitting,
  onConfirm,
}: SetUpInningsModalProps) {
  const [strikerId, setStrikerId] = useState<string | null>(null);
  const [nonStrikerId, setNonStrikerId] = useState<string | null>(null);
  const [bowlerId, setBowlerId] = useState<string | null>(null);
  const [pick, setPick] = useState<PickSlot>(null);

  useEffect(() => {
    if (isOpen) {
      setStrikerId(initialStrikerId ?? null);
      setNonStrikerId(initialNonStrikerId ?? null);
      setBowlerId(initialBowlerId ?? null);
      setPick(null);
    }
  }, [isOpen, initialStrikerId, initialNonStrikerId, initialBowlerId]);

  const ready =
    !!strikerId &&
    !!nonStrikerId &&
    !!bowlerId &&
    strikerId !== nonStrikerId &&
    strikerId !== bowlerId &&
    nonStrikerId !== bowlerId;

  const pickerPlayers = pick === "bowler" ? bowlingPlayers : battingPlayers;
  const pickerTitle =
    pick === "striker"
      ? "Select Striker"
      : pick === "nonStriker"
        ? "Select Non-Striker"
        : "Select Opening Bowler";
  const excludeIds =
    pick === "striker" && nonStrikerId
      ? [nonStrikerId]
      : pick === "nonStriker" && strikerId
        ? [strikerId]
        : [];

  const Row = ({
    label,
    id,
    players,
    onPick,
  }: {
    label: string;
    id: string | null;
    players: PlayerRef[];
    onPick: () => void;
  }) => {
    const player = players.find((p) => p.id === id) ?? null;
    return (
      <button
        type="button"
        onClick={onPick}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
          player
            ? "border-accent/40 bg-accent/10"
            : "border-white/10 bg-white/5 hover:bg-white/10"
        )}
      >
        {player ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-xs font-bold text-white">
            {initials(player.name)}
          </div>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs text-muted">
            ?
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">
            {player?.name ?? `Select ${label}`}
          </p>
          <p className="text-[11px] text-muted">{label}</p>
        </div>
        <span className="text-xs text-accent">
          {player ? "Change" : "Pick"}
        </span>
      </button>
    );
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Set Up Innings"
        size="md"
      >
        <p className="mb-4 text-sm text-muted">
          Choose the two openers and the opening bowler to start scoring.
        </p>
        <div className="space-y-2.5">
          <Row
            label="Striker"
            id={strikerId}
            players={battingPlayers}
            onPick={() => setPick("striker")}
          />
          <Row
            label="Non-Striker"
            id={nonStrikerId}
            players={battingPlayers}
            onPick={() => setPick("nonStriker")}
          />
          <Row
            label="Opening Bowler"
            id={bowlerId}
            players={bowlingPlayers}
            onPick={() => setPick("bowler")}
          />
        </div>
        {!ready && (
          <p className="mt-3 text-xs text-muted">
            Striker, non-striker and bowler must all be different players.
          </p>
        )}
        <div className="mt-6 flex justify-end">
          <Button
            size="lg"
            disabled={!ready}
            loading={submitting}
            onClick={() =>
              ready && onConfirm(strikerId!, nonStrikerId!, bowlerId!)
            }
          >
            Start Scoring
          </Button>
        </div>
      </Modal>

      <PlayerPickerModal
        isOpen={pick !== null}
        onClose={() => setPick(null)}
        title={pickerTitle}
        players={pickerPlayers}
        excludeIds={excludeIds}
        onSelect={(p) => {
          if (pick === "striker") setStrikerId(p.id);
          else if (pick === "nonStriker") setNonStrikerId(p.id);
          else if (pick === "bowler") setBowlerId(p.id);
          setPick(null);
        }}
      />
    </>
  );
}
