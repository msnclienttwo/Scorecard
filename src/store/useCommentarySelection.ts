'use client';

import { create } from 'zustand';

interface CommentarySelectionState {
  selectedBallId: string | null;
  linkedCommentaryByBall: Record<string, string>;

  setSelectedBallId: (ballId: string | null) => void;
  clearSelection: () => void;
  linkBallCommentary: (ballId: string, commentaryId: string) => void;
  unlinkBall: (ballId: string) => void;
  clearLinks: () => void;
}

export const useCommentarySelection = create<CommentarySelectionState>(
  (set) => ({
    selectedBallId: null,
    linkedCommentaryByBall: {},

    setSelectedBallId: (ballId) => set({ selectedBallId: ballId }),

    clearSelection: () => set({ selectedBallId: null }),

    linkBallCommentary: (ballId, commentaryId) =>
      set((state) => ({
        linkedCommentaryByBall: {
          ...state.linkedCommentaryByBall,
          [ballId]: commentaryId,
        },
      })),

    unlinkBall: (ballId) =>
      set((state) => {
        const next = { ...state.linkedCommentaryByBall };
        delete next[ballId];
        return { linkedCommentaryByBall: next };
      }),

    clearLinks: () => set({ linkedCommentaryByBall: {} }),
  })
);
