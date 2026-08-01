"use client";

import { Modal } from "@/components/ui/Modal";

const SHORTCUTS = [
  { keys: "0 – 6", label: "Score runs" },
  { keys: "W", label: "Wide" },
  { keys: "N", label: "No ball" },
  { keys: "B", label: "Bye" },
  { keys: "L", label: "Leg bye" },
  { keys: "K", label: "Wicket" },
  { keys: "U / Z", label: "Undo last ball" },
  { keys: "S", label: "Swap strike" },
  { keys: "O", label: "Change bowler" },
  { keys: "P", label: "Pause / Resume" },
  { keys: "Esc", label: "Close dialog" },
];

export function ShortcutsHelpModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="sm">
      <div className="space-y-2">
        {SHORTCUTS.map((s) => (
          <div
            key={s.keys}
            className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5"
          >
            <span className="text-sm text-white">{s.label}</span>
            <kbd className="rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-xs font-bold text-accent">
              {s.keys}
            </kbd>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-muted">
        Shortcuts are ignored while typing in search or input fields.
      </p>
    </Modal>
  );
}
