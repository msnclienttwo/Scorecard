"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { generateInitials } from "@/lib/utils";
import type { PlayerRef } from "@/hooks/useMatchLive";

interface NextBowlerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bowlingPlayers: PlayerRef[];
  lastBowlerId: string | null;
  submitting: boolean;
  title?: string;
  hint?: string;
  onConfirm: (bowlerId: string) => void;
}

export function NextBowlerModal({
  isOpen,
  onClose,
  bowlingPlayers,
  lastBowlerId,
  submitting,
  title = "Select Next Bowler",
  hint,
  onConfirm,
}: NextBowlerModalProps) {
  const [query, setQuery] = useState("");

  const eligible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bowlingPlayers.filter((p) => {
      if (lastBowlerId && p.id === lastBowlerId) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.shortName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [bowlingPlayers, lastBowlerId, query]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      {hint && <p className="mb-3 text-xs text-muted">{hint}</p>}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players…"
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="max-h-80 space-y-1.5 overflow-y-auto">
        {eligible.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">
            No bowlers available.
          </p>
        )}
        {eligible.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={submitting}
            onClick={() => onConfirm(p.id)}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-xs font-bold text-white">
              {generateInitials(p.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {p.name}
              </p>
              {p.role && <p className="text-xs text-muted">{p.role}</p>}
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
