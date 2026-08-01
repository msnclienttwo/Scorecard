"use client";

import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import type { ExtraKind } from "@/hooks/useLiveScoring";

const OPTIONS: Record<ExtraKind, number[]> = {
  WIDE: [1, 2, 3, 4, 6],
  NO_BALL: [0, 1, 2, 3, 4, 6],
  BYE: [1, 2, 3, 4, 6],
  LEG_BYE: [1, 2, 3, 4, 6],
};

const TITLES: Record<ExtraKind, string> = {
  WIDE: "Wide — total runs?",
  NO_BALL: "No ball — runs off the bat?",
  BYE: "Byes — total runs?",
  LEG_BYE: "Leg byes — total runs?",
};

interface ExtrasRunsModalProps {
  isOpen: boolean;
  kind: ExtraKind | null;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (runs: number) => void;
}

export function ExtrasRunsModal({
  isOpen,
  kind,
  submitting,
  onClose,
  onConfirm,
}: ExtrasRunsModalProps) {
  const options = kind ? OPTIONS[kind] : [];
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={kind ? TITLES[kind] : "Extras"}
      size="sm"
    >
      <div className="grid grid-cols-3 gap-2">
        {options.map((r) => (
          <motion.button
            key={r}
            type="button"
            whileTap={{ scale: 0.9 }}
            disabled={submitting}
            onClick={() => onConfirm(r)}
            className="rounded-xl bg-success/10 py-4 text-xl font-bold text-success transition-colors hover:bg-success/20 disabled:opacity-50"
          >
            {r}
          </motion.button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        No-ball: {OPTIONS.NO_BALL.join(", ")} · Byes/Leg-byes:{" "}
        {OPTIONS.BYE.join(", ")} · Wide: {OPTIONS.WIDE.join(", ")}
      </p>
    </Modal>
  );
}
