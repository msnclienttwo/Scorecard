"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PlayerPickerModal } from "@/components/match/PlayerPickerModal";
import type { PlayerRef } from "@/hooks/useMatchLive";

interface StartMatchTeam {
  id: string;
  name: string;
  shortName: string;
}

interface StartMatchMatch {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: StartMatchTeam;
  awayTeam: StartMatchTeam;
  tossWinner?: string | null;
  tossDecision?: string | null;
  scoringAccess: { allowed: boolean };
  squads: { teamId: string; player: PlayerRef }[];
}

interface StartMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: StartMatchMatch;
  onStarted: () => void;
}

type Step = "toss" | "squads" | "openers";
type PickSlot = "striker" | "nonStriker" | "bowler" | null;

const STEPS: { id: Step; label: string }[] = [
  { id: "toss", label: "Toss" },
  { id: "squads", label: "Squads" },
  { id: "openers", label: "Openers & Bowler" },
];

function PlayingXISelector({
  teamName,
  players,
  selected,
  onToggle,
  saving,
  onSave,
}: {
  teamName: string;
  players: PlayerRef[];
  selected: string[];
  onToggle: (id: string) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">{teamName} — Playing XI</p>
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-full",
            selected.length === 11
              ? "bg-success/15 text-success"
              : "bg-warning/15 text-warning"
          )}
        >
          {selected.length}/11
        </span>
      </div>
      <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto">
        {players.length === 0 && (
          <p className="text-sm text-muted w-full text-center py-4">
            No players available for this team.
          </p>
        )}
        {players.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => onToggle(p.id)}
              disabled={!isSelected && selected.length >= 11}
              className={cn(
                "px-3 py-2 rounded-xl border text-sm transition-colors disabled:opacity-40",
                isSelected
                  ? "bg-accent/15 border-accent text-white"
                  : "bg-white/5 border-white/10 text-muted hover:bg-white/10"
              )}
            >
              {p.name}
            </button>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          loading={saving}
          disabled={selected.length === 0}
          onClick={onSave}
        >
          Save Playing XI
        </Button>
      </div>
    </div>
  );
}

export function StartMatchModal({
  isOpen,
  onClose,
  match,
  onStarted,
}: StartMatchModalProps) {
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("squads");
  const [tossWinner, setTossWinner] = useState<string>(match.tossWinner ?? "");
  const [tossDecision, setTossDecision] = useState<"BAT" | "BOWL">(
    (match.tossDecision as "BAT" | "BOWL") ?? "BAT"
  );
  const [strikerId, setStrikerId] = useState<string | null>(null);
  const [nonStrikerId, setNonStrikerId] = useState<string | null>(null);
  const [bowlerId, setBowlerId] = useState<string | null>(null);
  const [pick, setPick] = useState<PickSlot>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const [xiSelection, setXiSelection] = useState<Record<string, string[]>>({});
  const [xiOpen, setXiOpen] = useState<string | null>(null);
  const xiDirtyRef = useRef(false);

  const freshMatchQuery = useQuery({
    queryKey: ["match", match.id],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${match.id}`);
      if (!res.ok) throw new Error("Match not found");
      return res.json() as Promise<{ match: StartMatchMatch }>;
    },
    enabled: isOpen,
  });
  const liveMatch = freshMatchQuery.data?.match ?? match;

  useEffect(() => {
    const squads = liveMatch.squads ?? [];
    if (xiDirtyRef.current || !isOpen) return;
    const next: Record<string, string[]> = {};
    for (const s of squads) {
      (next[s.teamId] ??= []).push(s.player.id);
    }
    setXiSelection(next);
  }, [isOpen, liveMatch.squads]);

  const tossDone = Boolean(tossWinner && tossDecision);

  const battingTeamId = useMemo(() => {
    if (!tossWinner || !tossDecision) return null;
    if (tossDecision === "BAT") return tossWinner;
    return tossWinner === liveMatch.homeTeamId
      ? liveMatch.awayTeamId
      : liveMatch.homeTeamId;
  }, [tossWinner, tossDecision, liveMatch.homeTeamId, liveMatch.awayTeamId]);

  const bowlingTeamId = useMemo(() => {
    if (!battingTeamId) return null;
    return battingTeamId === liveMatch.homeTeamId
      ? liveMatch.awayTeamId
      : liveMatch.homeTeamId;
  }, [battingTeamId, liveMatch.homeTeamId, liveMatch.awayTeamId]);

  const teamIds = useMemo(
    () => [liveMatch.homeTeamId, liveMatch.awayTeamId],
    [liveMatch.homeTeamId, liveMatch.awayTeamId]
  );

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
    enabled: isOpen,
  });

  const allTeamPlayers = (teamId: string): PlayerRef[] => {
    const result: PlayerRef[] = [];
    const seen = new Set<string>();
    for (const s of liveMatch.squads ?? []) {
      if (s.teamId !== teamId || seen.has(s.player.id)) continue;
      seen.add(s.player.id);
      result.push(s.player);
    }
    for (const p of rostersQuery.data?.[teamId] ?? []) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      result.push(p);
    }
    return result;
  };

  const battingPlayers = battingTeamId ? allTeamPlayers(battingTeamId) : [];
  const bowlingPlayers = bowlingTeamId ? allTeamPlayers(bowlingTeamId) : [];

  const squadCount = (teamId: string) =>
    (liveMatch.squads ?? []).filter((s) => s.teamId === teamId).length;

  const xiReady =
    squadCount(liveMatch.homeTeamId) >= 11 &&
    squadCount(liveMatch.awayTeamId) >= 11;

  const battingTeamName =
    battingTeamId === liveMatch.homeTeamId
      ? liveMatch.homeTeam.name
      : liveMatch.awayTeam.name;
  const bowlingTeamName =
    bowlingTeamId === liveMatch.homeTeamId
      ? liveMatch.homeTeam.name
      : liveMatch.awayTeam.name;

  const openersReady =
    Boolean(strikerId && nonStrikerId && bowlerId) && strikerId !== nonStrikerId;

  const activeStep: Step = !tossDone ? "toss" : step;

  const post = async (action: string, extra: Record<string, unknown> = {}) => {
    try {
      const res = await fetch(`/api/matches/${match.id}/actions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed");
        return false;
      }
      return true;
    } catch {
      setError("Network error — please retry.");
      return false;
    }
  };

  const saveToss = async () => {
    if (!tossWinner) return;
    setSubmitting(true);
    setError(null);
    const ok = await post("toss", { tossWinner, tossDecision });
    setSubmitting(false);
    if (ok) setStep("squads");
  };

  const saveSquad = async (teamId: string, playerIds: string[]) => {
    setSubmitting(true);
    setError(null);
    try {
      const merged: Record<string, string[]> = {
        ...xiSelection,
        [teamId]: playerIds,
      };
      for (const s of liveMatch.squads ?? []) {
        if (merged[s.teamId]) continue;
        const list = merged[s.teamId] ?? [];
        if (!list.includes(s.player.id)) list.push(s.player.id);
        merged[s.teamId] = list;
      }
      const players = [
        ...(merged[liveMatch.homeTeamId] ?? []).map((pid, i) => ({
          playerId: pid,
          teamId: liveMatch.homeTeamId,
          battingOrder: i + 1,
        })),
        ...(merged[liveMatch.awayTeamId] ?? []).map((pid, i) => ({
          playerId: pid,
          teamId: liveMatch.awayTeamId,
          battingOrder: i + 1,
        })),
      ];
      const res = await fetch(`/api/matches/${match.id}/squads`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to save Playing XI");
        return;
      }
      xiDirtyRef.current = false;
      setXiSelection(merged);
      setXiOpen(null);
      await queryClient.invalidateQueries({ queryKey: ["match", match.id] });
    } catch {
      setError("Network error — please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleXiPlayer = (teamId: string, playerId: string) => {
    xiDirtyRef.current = true;
    setXiSelection((prev) => {
      const current = prev[teamId] ?? [];
      if (current.includes(playerId)) {
        return { ...prev, [teamId]: current.filter((x) => x !== playerId) };
      }
      if (current.length >= 11) return prev;
      return { ...prev, [teamId]: [...current, playerId] };
    });
  };

  const handleStart = async () => {
    if (!strikerId || !nonStrikerId || !bowlerId) return;
    setSubmitting(true);
    setError(null);

    setProgress("Starting match...");
    const okStart = await post("start");
    if (!okStart) {
      setSubmitting(false);
      return;
    }

    setProgress("Creating the first innings...");
    const okInnings = await post("start-innings");
    if (!okInnings) {
      setSubmitting(false);
      return;
    }

    setProgress("Setting openers and bowler...");
    const okOpeners = await post("set-openers", {
      strikerId,
      nonStrikerId,
      bowlerId,
    });
    setSubmitting(false);
    if (okOpeners) {
      await queryClient.invalidateQueries({ queryKey: ["match", match.id] });
      onStarted();
    }
  };

  const renderToss = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        The toss result has not been recorded yet. Set it to continue.
      </p>
      <div>
        <label className="block text-xs text-muted mb-2">Toss Winner</label>
        <select
          value={tossWinner}
          onChange={(e) => setTossWinner(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-primary transition-colors"
        >
          <option value="" className="bg-background">
            Select team
          </option>
          <option value={liveMatch.homeTeamId} className="bg-background">
            {liveMatch.homeTeam.name}
          </option>
          <option value={liveMatch.awayTeamId} className="bg-background">
            {liveMatch.awayTeam.name}
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
              className={cn(
                "flex-1 py-3 rounded-xl border text-sm font-medium capitalize transition-colors",
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
      <div className="pt-2 flex justify-end">
        <Button
          onClick={() => void saveToss()}
          disabled={!tossWinner}
          loading={submitting}
        >
          Continue
        </Button>
      </div>
    </div>
  );

  const renderSquads = () => {
    const teams = [
      { id: liveMatch.homeTeamId, team: liveMatch.homeTeam },
      { id: liveMatch.awayTeamId, team: liveMatch.awayTeam },
    ];
    return (
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          {teams.map(({ id, team }) => {
            const count = squadCount(id);
            const ready = count >= 11;
            const isOpen = xiOpen === id;
            const selected = xiSelection[id] ?? [];
            return (
              <div
                key={id}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl border",
                  ready
                    ? "bg-success/10 border-success/30"
                    : "bg-white/5 border-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  {ready ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <Users className="w-5 h-5 text-muted" />
                  )}
                  <div>
                    <p className="text-sm text-white font-medium">{team.name}</p>
                    <p className="text-xs text-muted">
                      {count} player{count === 1 ? "" : "s"} in the squad
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full",
                    ready
                      ? "bg-success/15 text-success"
                      : "bg-warning/15 text-warning"
                  )}
                >
                  {ready ? "XI Set" : "Incomplete"}
                </span>
                {!ready && (
                  <button
                    onClick={() => setXiOpen(isOpen ? null : id)}
                    className="text-xs text-accent hover:text-white transition-colors"
                  >
                    {isOpen ? "Close" : "Select XI"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {teams.map(({ id, team }) =>
          xiOpen === id ? (
            <PlayingXISelector
              key={id}
              teamName={team.name}
              players={allTeamPlayers(id)}
              selected={xiSelection[id] ?? []}
              onToggle={(pid) => toggleXiPlayer(id, pid)}
              saving={submitting}
              onSave={() => void saveSquad(id, xiSelection[id] ?? [])}
            />
          ) : null
        )}

        {!xiReady && (
          <p className="text-xs text-muted flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            Both teams need at least 11 players in the Playing XI. You can
            select the XI below or proceed — scorers can still use the full
            team roster during the match.
          </p>
        )}
        <div className="pt-2 flex justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => setStep("openers")}>
            Continue to Openers
          </Button>
        </div>
      </div>
    );
  };

  const renderOpeners = () => {
    const PickerRow = ({
      label,
      playerId,
      players,
      onPick,
    }: {
      label: string;
      playerId: string | null;
      players: PlayerRef[];
      onPick: () => void;
    }) => {
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
          <span className="text-xs text-accent">
            {playerId ? "Change" : "Pick"}
          </span>
        </button>
      );
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="px-3 py-1.5 rounded-xl bg-success/10 border border-success/30 text-success font-medium">
            {battingTeamName} batting
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-danger/10 border border-danger/30 text-danger font-medium">
            {bowlingTeamName} bowling
          </span>
        </div>
        <PickerRow
          label="Striker"
          playerId={strikerId}
          players={battingPlayers}
          onPick={() => setPick("striker")}
        />
        <PickerRow
          label="Non-Striker"
          playerId={nonStrikerId}
          players={battingPlayers}
          onPick={() => setPick("nonStriker")}
        />
        <PickerRow
          label="Opening Bowler"
          playerId={bowlerId}
          players={bowlingPlayers}
          onPick={() => setPick("bowler")}
        />
        {progress && (
          <p className="text-sm text-accent flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {progress}
          </p>
        )}
        <div className="pt-2 flex justify-between">
          <Button variant="ghost" size="sm" onClick={() => setStep("squads")}>
            Back
          </Button>
          <Button
            size="lg"
            onClick={() => void handleStart()}
            disabled={!openersReady}
            loading={submitting}
          >
            <Play className="w-4 h-4" />
            Start Match
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={submitting ? () => {} : onClose}
        title="Start Match"
        size="lg"
      >
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => {
            const isActive = s.id === activeStep;
            const isDone = STEPS.findIndex((x) => x.id === activeStep) > i;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary/20 text-primary"
                      : isDone
                        ? "bg-success/15 text-success"
                        : "bg-white/5 text-muted"
                  )}
                >
                  <span>
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      `${i + 1}.`
                    )}
                  </span>
                  <span className="whitespace-nowrap">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-px flex-1 bg-white/10" />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 flex items-center justify-between gap-3 bg-danger/10 border border-danger/30 rounded-2xl px-4 py-3">
            <p className="text-sm text-danger flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </p>
            <button
              onClick={() => setError(null)}
              className="text-danger hover:text-white"
            >
              <span className="sr-only">Dismiss</span>×
            </button>
          </div>
        )}

        {activeStep === "toss" && renderToss()}
        {activeStep === "squads" && renderSquads()}
        {activeStep === "openers" && renderOpeners()}
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
          if (pick === "striker") setStrikerId(p.id);
          else if (pick === "nonStriker") setNonStrikerId(p.id);
          else setBowlerId(p.id);
          setPick(null);
        }}
        excludeIds={
          pick === "striker" && nonStrikerId
            ? [nonStrikerId]
            : pick === "nonStriker" && strikerId
              ? [strikerId]
              : []
        }
      />
    </>
  );
}
