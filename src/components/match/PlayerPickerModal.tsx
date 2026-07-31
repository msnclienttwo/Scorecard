"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { PlayerRef } from "@/hooks/useMatchLive";

interface PlayerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  players: PlayerRef[];
  selectedId?: string | null;
  onSelect: (player: PlayerRef) => void;
  excludeIds?: string[];
  hint?: string;
}

export function PlayerPickerModal({
  isOpen,
  onClose,
  title,
  players,
  selectedId,
  onSelect,
  excludeIds = [],
  hint,
}: PlayerPickerModalProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const excluded = new Set(excludeIds);
    const q = query.trim().toLowerCase();
    return players.filter((p) => {
      if (excluded.has(p.id)) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.shortName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [players, query, excludeIds]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      {hint && <p className="text-xs text-muted mb-3">{hint}</p>}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="max-h-80 overflow-y-auto space-y-1.5">
        {filtered.length === 0 && (
          <p className="text-sm text-muted text-center py-8">
            No players available.
          </p>
        )}
        {filtered.map((player) => {
          const isSelected = player.id === selectedId;
          return (
            <button
              key={player.id}
              onClick={() => {
                onSelect(player);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                isSelected
                  ? "border-accent bg-accent/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                {player.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white font-medium">{player.name}</p>
                {player.role && (
                  <p className="text-xs text-muted">{player.role}</p>
                )}
              </div>
              {isSelected && (
                <span className="text-xs text-accent font-medium">Selected</span>
              )}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
