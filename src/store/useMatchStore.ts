'use client';

import { create } from 'zustand';
import type { Match, Innings, Over, Ball, Player } from '@/types';

interface MatchState {
  currentMatch: Match | null;
  currentInnings: Innings | null;
  currentOver: Over | null;
  score: {
    runs: number;
    wickets: number;
    overs: number;
    balls: number;
    extras: number;
  };
  batsmen: {
    striker: Player | null;
    nonStriker: Player | null;
  };
  currentBowler: Player | null;
  recentBalls: Ball[];
  lastBall: Ball | null;
  partnerships: any[];
  fallOfWickets: any[];

  setMatch: (match: Match) => void;
  updateScore: (score: Partial<MatchState['score']>) => void;
  addBall: (ball: Ball) => void;
  undoBall: () => void;
  changeBatsman: (type: 'striker' | 'nonStriker', player: Player) => void;
  changeBowler: (player: Player) => void;
  endOver: () => void;
  setInnings: (innings: Innings) => void;
  resetMatch: () => void;
}

const initialState = {
  currentMatch: null,
  currentInnings: null,
  currentOver: null,
  score: { runs: 0, wickets: 0, overs: 0, balls: 0, extras: 0 },
  batsmen: { striker: null, nonStriker: null },
  currentBowler: null,
  recentBalls: [],
  lastBall: null,
  partnerships: [],
  fallOfWickets: [],
};

export const useMatchStore = create<MatchState>((set) => ({
  ...initialState,

  setMatch: (match) => set({ currentMatch: match }),

  updateScore: (score) =>
    set((state) => ({ score: { ...state.score, ...score } })),

  addBall: (ball) =>
    set((state) => {
      const updatedBalls = [ball, ...state.recentBalls];
      const newBalls = (state.score.balls % 6) + 1;
      const isLegalDelivery =
        !ball.extraType ||
        (ball.extraType !== 'WIDE' && ball.extraType !== 'NO_BALL');

      let runs = state.score.runs + (ball.runs || 0) + (ball.extraRuns || 0);
      let wickets = state.score.wickets + (ball.isWicket ? 1 : 0);
      let extras = state.score.extras + (ball.extraRuns || 0);
      let overs = state.score.overs;
      let balls = state.score.balls + 1;

      if (isLegalDelivery && newBalls === 6) {
        overs += 1;
      }

      return {
        recentBalls: updatedBalls,
        lastBall: ball,
        score: {
          runs,
          wickets,
          overs: isLegalDelivery && newBalls === 6 ? overs : state.score.overs,
          balls,
          extras,
        },
      };
    }),

  undoBall: () =>
    set((state) => {
      if (state.recentBalls.length === 0) return state;

      const [removed, ...remaining] = state.recentBalls;
      const runs = state.score.runs - (removed.runs || 0) - (removed.extraRuns || 0);
      const wickets = state.score.wickets - (removed.isWicket ? 1 : 0);
      const extras = state.score.extras - (removed.extraRuns || 0);
      const balls = Math.max(0, state.score.balls - 1);
      const isLegalDelivery =
        !removed.extraType ||
        (removed.extraType !== 'WIDE' && removed.extraType !== 'NO_BALL');

      let overs = state.score.overs;
      if (isLegalDelivery && state.score.balls % 6 === 0) {
        overs = Math.max(0, overs - 1);
      }

      return {
        recentBalls: remaining,
        lastBall: remaining[0] || null,
        score: { runs, wickets, overs, balls, extras },
      };
    }),

  changeBatsman: (type, player) =>
    set((state) => ({
      batsmen: { ...state.batsmen, [type]: player },
    })),

  changeBowler: (player) => set({ currentBowler: player }),

  endOver: () =>
    set((state) => ({
      currentOver: null,
      score: { ...state.score, balls: 0 },
    })),

  setInnings: (innings) => set({ currentInnings: innings }),

  resetMatch: () => set(initialState),
}));
