'use client';

import { useEffect, useCallback } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import { useMatchStore } from '@/store/useMatchStore';

interface UseSocketOptions {
  matchId: string;
  enabled?: boolean;
}

export function useSocket({ matchId, enabled = true }: UseSocketOptions) {
  const { connect, disconnect, subscribe, unsubscribe, on, off, isConnected } =
    useSocketStore();
  const { addBall, updateScore, changeBatsman } = useMatchStore();

  const handleBallAdded = useCallback(
    (data: any) => {
      addBall(data.ball);
    },
    [addBall]
  );

  const handleScoreUpdated = useCallback(
    (data: any) => {
      updateScore(data.score);
    },
    [updateScore]
  );

  const handleWicketFallen = useCallback(
    (data: any) => {
      if (data.batsman) {
        const store = useMatchStore.getState();
        if (store.batsmen.striker?.id === data.batsman.id) {
          changeBatsman('striker', data.newBatsman);
        } else {
          changeBatsman('nonStriker', data.newBatsman);
        }
      }
    },
    [changeBatsman]
  );

  useEffect(() => {
    if (!enabled || !matchId) return;

    connect();

    return () => {
      if (!enabled) {
        disconnect();
      }
    };
  }, [enabled, matchId, connect, disconnect]);

  useEffect(() => {
    if (!isConnected || !matchId) return;

    subscribe(matchId);

    on('ball-added', handleBallAdded);
    on('score-updated', handleScoreUpdated);
    on('wicket-fallen', handleWicketFallen);

    return () => {
      unsubscribe(matchId);
      off('ball-added', handleBallAdded);
      off('score-updated', handleScoreUpdated);
      off('wicket-fallen', handleWicketFallen);
    };
  }, [
    isConnected,
    matchId,
    subscribe,
    unsubscribe,
    on,
    off,
    handleBallAdded,
    handleScoreUpdated,
    handleWicketFallen,
  ]);

  return { isConnected };
}
