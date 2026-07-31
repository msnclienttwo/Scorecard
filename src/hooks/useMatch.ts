'use client';

import { useQuery } from '@tanstack/react-query';
import { MatchService } from '@/services/match.service';
import type { Match } from '@/types';

interface UseMatchResult {
  match: Match | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useMatch(matchId: string | null): UseMatchResult {
  const { data, isLoading, error, refetch } = useQuery<Match, Error>({
    queryKey: ['match', matchId],
    queryFn: () => MatchService.getMatch(matchId!),
    enabled: !!matchId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return {
    match: data,
    isLoading,
    error,
    refetch,
  };
}
