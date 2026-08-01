"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EXTRA_TYPES, WICKET_TYPES } from "./scoreUtils";
import {
  SHOTS,
  ZONES,
  parseFieldPositions,
  type ShotType,
  type PlacementZone,
} from "@/lib/advancedScoring";
import type { BallRef, PlayerRef } from "@/hooks/useMatchLive";
import type { EditBallPatch, ExtraKind } from "@/hooks/useLiveScoring";

interface EditLastBallModalProps {
  isOpen: boolean;
  onClose: () => void;
  ball: BallRef | null;
  battingPlayers: PlayerRef[];
  bowlingPlayers: PlayerRef[];
  submitting: boolean;
  onSave: (patch: EditBallPatch) => void;
  onDelete: () => void;
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

export function EditLastBallModal({
  isOpen,
  onClose,
  ball,
  battingPlayers,
  bowlingPlayers,
  submitting,
  onSave,
  onDelete,
}: EditLastBallModalProps) {
  const [runs, setRuns] = useState(0);
  const [extraType, setExtraType] = useState<string>("");
  const [extraRuns, setExtraRuns] = useState(0);
  const [isWicket, setIsWicket] = useState(false);
  const [wicketType, setWicketType] = useState<string>("");
  const [dismissedId, setDismissedId] = useState<string>("");
  const [fielderId, setFielderId] = useState<string>("");
  const [shotType, setShotType] = useState<string>("");
  const [placementZone, setPlacementZone] = useState<string>("");
  const [isOverthrow, setIsOverthrow] = useState(false);

  useEffect(() => {
    if (isOpen && ball) {
      setRuns(ball.runs);
      setExtraType(ball.extraType ?? "");
      setExtraRuns(ball.extraRuns);
      setIsWicket(ball.isWicket);
      setWicketType(ball.wicketType ?? "");
      setDismissedId(ball.dismissedPlayerId ?? "");
      setFielderId(ball.fielderId ?? "");
      setShotType(ball.shotType ?? "");
      setPlacementZone(ball.placementZone ?? "");
      setIsOverthrow(!!ball.isOverthrow);
    }
  }, [isOpen, ball]);

  const save = () => {
    if (!ball) return;
    onSave({
      runs,
      extraType: extraType ? (extraType as ExtraKind) : null,
      extraRuns: extraType ? extraRuns : 0,
      isWicket,
      wicketType: isWicket ? wicketType || null : null,
      dismissedPlayerId: isWicket ? dismissedId || null : null,
      fielderId: isWicket && fielderId ? fielderId : null,
      shotType: shotType ? (shotType as ShotType) : null,
      placementZone: placementZone
        ? (placementZone as PlacementZone)
        : null,
      isOverthrow,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Last Ball"
      size="md"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-muted">
              Runs off the bat
            </label>
            <input
              type="number"
              min={0}
              max={9}
              value={runs}
              onChange={(e) => setRuns(Number(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-muted">Extra</label>
            <select
              value={extraType}
              onChange={(e) => setExtraType(e.target.value)}
              className={cn(inputClass, "appearance-none")}
            >
              <option value="" className="bg-background">
                None
              </option>
              {EXTRA_TYPES.map((x) => (
                <option key={x.value} value={x.value} className="bg-background">
                  {x.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {extraType && (
          <div>
            <label className="mb-1.5 block text-xs text-muted">
              Extra runs
            </label>
            <input
              type="number"
              min={0}
              max={9}
              value={extraRuns}
              onChange={(e) => setExtraRuns(Number(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
        )}

        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-sm text-white">Wicket on this ball</span>
          <button
            type="button"
            role="switch"
            aria-checked={isWicket}
            onClick={() => setIsWicket((w) => !w)}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              isWicket ? "bg-danger" : "bg-white/15"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                isWicket ? "left-[22px]" : "left-0.5"
              )}
            />
          </button>
        </label>

        {isWicket && (
          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div>
              <label className="mb-1.5 block text-xs text-muted">
                Dismissal type
              </label>
              <select
                value={wicketType}
                onChange={(e) => setWicketType(e.target.value)}
                className={cn(inputClass, "appearance-none")}
              >
                <option value="" className="bg-background">
                  Select type
                </option>
                {WICKET_TYPES.map((w) => (
                  <option key={w.value} value={w.value} className="bg-background">
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted">
                Dismissed batter
              </label>
              <select
                value={dismissedId}
                onChange={(e) => setDismissedId(e.target.value)}
                className={cn(inputClass, "appearance-none")}
              >
                <option value="" className="bg-background">
                  Select batter
                </option>
                {battingPlayers.map((p) => (
                  <option key={p.id} value={p.id} className="bg-background">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted">Fielder</label>
              <select
                value={fielderId}
                onChange={(e) => setFielderId(e.target.value)}
                className={cn(inputClass, "appearance-none")}
              >
                <option value="" className="bg-background">
                  None
                </option>
                {bowlingPlayers.map((p) => (
                  <option key={p.id} value={p.id} className="bg-background">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-primary/20 bg-primary/[0.03] p-3">
          <div>
            <label className="mb-1.5 block text-xs text-muted">Shot</label>
            <select
              value={shotType}
              onChange={(e) => setShotType(e.target.value)}
              className={cn(inputClass, "appearance-none")}
            >
              <option value="" className="bg-background">
                None
              </option>
              {SHOTS.map((s) => (
                <option key={s.code} value={s.code} className="bg-background">
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-muted">
              Placement
            </label>
            <select
              value={placementZone}
              onChange={(e) => setPlacementZone(e.target.value)}
              className={cn(inputClass, "appearance-none")}
            >
              <option value="" className="bg-background">
                None
              </option>
              {ZONES.map((z) => (
                <option key={z.code} value={z.code} className="bg-background">
                  {z.label}
                  {z.ring === "BOUNDARY" ? " (boundary)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
            <span className="text-sm text-white">
              Overthrow{isOverthrow ? " recorded" : ""}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isOverthrow}
              onClick={() => setIsOverthrow((v) => !v)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                isOverthrow ? "bg-warning" : "bg-white/15"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                  isOverthrow ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {ball?.isFreeHit && (
              <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                Free hit
              </span>
            )}
            {!!ball?.fieldPositions && (
              <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] text-muted">
                Field: {parseFieldPositions(ball.fieldPositions).length}{" "}
                positions
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={submitting}
            onClick={onDelete}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Delete Ball
          </Button>
          <Button
            size="sm"
            disabled={!ball || (isWicket && !wicketType)}
            loading={submitting}
            onClick={save}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
