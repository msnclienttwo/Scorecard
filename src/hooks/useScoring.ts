'use client';

import { useMutation } from '@tanstack/react-query';
import { useMatchStore } from '@/store/useMatchStore';
import { api } from '@/services/api';
import type { Ball, Player } from '@/types';

interface AddBallData {
  matchId: string;
  inningsId: string;
  bowlerId: string;
  strikerId: string;
  nonStrikerId: string;
  runs?: number;
  extrasRuns?: number;
  extrasType?: string;
  wicket?: boolean;
  wicketType?: string;
  dismissedPlayerId?: string;
}

export function useScoring(matchId: string) {
  const { addBall, undoBall, changeBatsman, changeBowler, endOver, updateScore } =
    useMatchStore();

  const addBallMutation = useMutation({
    mutationFn: (data: AddBallData) =>
      api.post<Ball>(`/api/matches/${matchId}/balls`, data),
    onSuccess: (response) => {
      if (response.data) {
        addBall(response.data);
      }
    },
  });

  const undoBallMutation = useMutation({
    mutationFn: () => api.delete(`/api/matches/${matchId}/balls/last`),
    onSuccess: () => {
      undoBall();
    },
  });

  const changeStrikeMutation = useMutation({
    mutationFn: () => api.post(`/api/matches/${matchId}/change-strike`),
    onSuccess: () => {
      const store = useMatchStore.getState();
      const { striker, nonStriker } = store.batsmen;
      if (striker && nonStriker) {
        changeBatsman('striker', nonStriker);
        changeBatsman('nonStriker', striker);
      }
    },
  });

  const endOverMutation = useMutation({
    mutationFn: (data: { bowlerId: string }) =>
      api.post(`/api/matches/${matchId}/end-over`, data),
    onSuccess: () => {
      endOver();
    },
  });

  const setNewBowlerMutation = useMutation({
    mutationFn: (playerId: string) =>
      api.post(`/api/matches/${matchId}/set-bowler`, { playerId }),
    onSuccess: (response) => {
      if (response.data) {
        changeBowler(response.data as Player);
      }
    },
  });

  const setNewBatsmanMutation = useMutation({
    mutationFn: (data: { playerId: string; position: 'striker' | 'nonStriker' }) =>
      api.post(`/api/matches/${matchId}/set-batsman`, data),
    onSuccess: (response, variables) => {
      if (response.data) {
        changeBatsman(variables.position, response.data as Player);
      }
    },
  });

  return {
    addBall: addBallMutation.mutate,
    addBallAsync: addBallMutation.mutateAsync,
    isAddingBall: addBallMutation.isPending,

    undoLastBall: undoBallMutation.mutate,
    isUndoing: undoBallMutation.isPending,

    changeStrike: changeStrikeMutation.mutate,
    isChangingStrike: changeStrikeMutation.isPending,

    endOver: endOverMutation.mutate,
    isEndingOver: endOverMutation.isPending,

    setNewBowler: setNewBowlerMutation.mutate,
    isSettingBowler: setNewBowlerMutation.isPending,

    setNewBatsman: setNewBatsmanMutation.mutate,
    isSettingBatsman: setNewBatsmanMutation.isPending,
  };
}
