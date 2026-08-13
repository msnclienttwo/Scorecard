'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocketStore } from '@/store/useSocketStore';

export interface CommentaryRef {
  id: string;
  matchId: string;
  userId: string | null;
  content: string;
  overNumber: number | null;
  ballNumber: number | null;
  inningsNumber: number | null;
  isAutomatic: boolean;
  isHighlight: boolean;
  eventType: string | null;
  emoji: string | null;
  isAIGenerated: boolean;
  generatedBy: string | null;
  provider: string | null;
  style: string | null;
  language: string | null;
  edited: boolean;
  pinned: boolean;
  aiGeneratedAt: string | null;
  ballId: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; image: string | null } | null;
  ball?: {
    id: string;
    ballNumber: number;
    over?: { id: string; overNumber: number } | null;
  } | null;
}

export interface CommentaryFilters {
  inningsNumber?: number;
  overNumber?: number | null;
  playerId?: string;
  bowlerId?: string;
  keyword?: string;
  eventType?: string;
  isAIGenerated?: boolean;
  pinned?: boolean;
}

export interface CommentarySettingsRef {
  aiEnabled: boolean;
  voiceEnabled: boolean;
  autoCommentary: boolean;
  style: string;
  language: string;
  provider: string;
  temperature: number;
  creativity: number;
}

export interface CreateCommentaryInput {
  content: string;
  ballId?: string | null;
  overNumber?: number | null;
  ballNumber?: number | null;
  inningsNumber?: number | null;
  isHighlight?: boolean;
  eventType?: string | null;
  emoji?: string | null;
  isAutomatic?: boolean;
}

export interface AiActionInput {
  action: 'generate' | 'enhance' | 'translate' | 'improve' | 'regenerate';
  commentaryId?: string;
  ballId?: string;
  text?: string;
  transcript?: string;
  language?: string;
  provider?: string;
  style?: string;
  temperature?: number;
  creativity?: number;
}

const SOCKET_EVENTS = [
  'commentary:added',
  'commentary:updated',
  'commentary:deleted',
];

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? 'Something went wrong'
    );
  }
  return data as T;
}

export function useCommentary(matchId: string) {
  const queryClient = useQueryClient();
  const { connect, subscribe, unsubscribe, on, off, isConnected } =
    useSocketStore();

  const [filters, setFilters] = useState<CommentaryFilters>({});
  const [page, setPage] = useState(1);
  const limit = 50;

  const commentaryQuery = useQuery({
    queryKey: ['commentary', matchId, filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (filters.inningsNumber != null)
        params.set('inningsNumber', String(filters.inningsNumber));
      if (filters.overNumber != null)
        params.set('over', String(filters.overNumber));
      if (filters.playerId) params.set('player', filters.playerId);
      if (filters.bowlerId) params.set('bowler', filters.bowlerId);
      if (filters.keyword) params.set('keyword', filters.keyword);
      if (filters.eventType) params.set('eventType', filters.eventType);
      if (filters.isAIGenerated != null)
        params.set('isAIGenerated', String(filters.isAIGenerated));
      if (filters.pinned != null) params.set('pinned', String(filters.pinned));

      return jsonFetch<{
        commentary: CommentaryRef[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`/api/matches/${matchId}/commentary?${params.toString()}`);
    },
    enabled: !!matchId,
    staleTime: 3_000,
  });

  const settingsQuery = useQuery({
    queryKey: ['commentary-settings', matchId],
    queryFn: async () =>
      jsonFetch<{ settings: CommentarySettingsRef }>(
        `/api/matches/${matchId}/commentary/settings`
      ),
    enabled: !!matchId,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!matchId) return;
    connect();
  }, [matchId, connect]);

  useEffect(() => {
    if (!isConnected || !matchId) return;
    subscribe(matchId);

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['commentary', matchId] });
    };

    const handlers = SOCKET_EVENTS.map((event) => {
      const handler = () => invalidate();
      on(event, handler);
      return { event, handler };
    });

    return () => {
      unsubscribe(matchId);
      handlers.forEach(({ event, handler }) => off(event, handler));
    };
  }, [isConnected, matchId, subscribe, unsubscribe, on, off, queryClient]);

  const createCommentary = useCallback(
    async (input: CreateCommentaryInput) => {
      const data = await jsonFetch<{ commentary: CommentaryRef }>(
        `/api/matches/${matchId}/commentary`,
        { method: 'POST', body: JSON.stringify(input) }
      );
      queryClient.invalidateQueries({ queryKey: ['commentary', matchId] });
      return data.commentary;
    },
    [matchId, queryClient]
  );

  const updateCommentary = useCallback(
    async (
      commentaryId: string,
      patch: {
        content?: string;
        isHighlight?: boolean;
        eventType?: string | null;
        emoji?: string | null;
        pinned?: boolean;
        language?: string;
        style?: string;
      }
    ) => {
      const data = await jsonFetch<{ commentary: CommentaryRef }>(
        `/api/matches/${matchId}/commentary/${commentaryId}`,
        { method: 'PATCH', body: JSON.stringify(patch) }
      );
      queryClient.invalidateQueries({ queryKey: ['commentary', matchId] });
      return data.commentary;
    },
    [matchId, queryClient]
  );

  const deleteCommentary = useCallback(
    async (commentaryId: string) => {
      await jsonFetch<{ success: boolean }>(
        `/api/matches/${matchId}/commentary/${commentaryId}`,
        { method: 'DELETE' }
      );
      queryClient.invalidateQueries({ queryKey: ['commentary', matchId] });
    },
    [matchId, queryClient]
  );

  const togglePin = useCallback(
    async (commentaryId: string, pinned: boolean) => {
      return updateCommentary(commentaryId, { pinned });
    },
    [updateCommentary]
  );

  const aiAction = useCallback(
    async (input: AiActionInput) => {
      const data = await jsonFetch<{
        content: string;
        provider: string | null;
        commentary?: CommentaryRef;
      }>(`/api/matches/${matchId}/commentary/ai`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (
        input.action === 'generate' ||
        input.action === 'regenerate' ||
        input.commentaryId
      ) {
        queryClient.invalidateQueries({ queryKey: ['commentary', matchId] });
      }
      return data;
    },
    [matchId, queryClient]
  );

  const updateSettings = useCallback(
    async (patch: Partial<CommentarySettingsRef>) => {
      const data = await jsonFetch<{ settings: CommentarySettingsRef }>(
        `/api/matches/${matchId}/commentary/settings`,
        { method: 'PATCH', body: JSON.stringify(patch) }
      );
      queryClient.invalidateQueries({
        queryKey: ['commentary-settings', matchId],
      });
      return data.settings;
    },
    [matchId, queryClient]
  );

  return {
    commentary: commentaryQuery.data?.commentary ?? [],
    pagination: commentaryQuery.data?.pagination,
    isLoading: commentaryQuery.isLoading,
    error: commentaryQuery.error,
    filters,
    setFilters,
    page,
    setPage,
    refetchCommentary: () =>
      queryClient.invalidateQueries({ queryKey: ['commentary', matchId] }),
    createCommentary,
    updateCommentary,
    deleteCommentary,
    togglePin,
    aiAction,
    settings: settingsQuery.data?.settings,
    settingsLoading: settingsQuery.isLoading,
    updateSettings,
    refetchSettings: () =>
      queryClient.invalidateQueries({
        queryKey: ['commentary-settings', matchId],
      }),
  };
}
