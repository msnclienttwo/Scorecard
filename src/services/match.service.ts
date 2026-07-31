import { api } from './api';
import type { Match, Ball, Scorecard, PaginatedResponse } from '@/types';

interface MatchFilters {
  status?: string;
  teamId?: string;
  tournamentId?: string;
  page?: string;
  limit?: string;
}

export class MatchService {
  static async createMatch(data: Partial<Match>): Promise<Match> {
    const response = await api.post<Match>('/api/matches', data);
    return response.data!;
  }

  static async getMatch(id: string): Promise<Match> {
    const response = await api.get<Match>(`/api/matches/${id}`);
    return response.data!;
  }

  static async getMatches(
    params?: MatchFilters
  ): Promise<PaginatedResponse<Match>> {
    const response = await api.get<Match[]>('/api/matches', params as Record<string, string>);
    return response as unknown as PaginatedResponse<Match>;
  }

  static async updateMatch(id: string, data: Partial<Match>): Promise<Match> {
    const response = await api.patch<Match>(`/api/matches/${id}`, data);
    return response.data!;
  }

  static async deleteMatch(id: string): Promise<void> {
    await api.delete(`/api/matches/${id}`);
  }

  static async getMatchBallByBall(id: string): Promise<Ball[]> {
    const response = await api.get<Ball[]>(`/api/matches/${id}/ball-by-ball`);
    return response.data!;
  }

  static async getMatchScorecard(id: string): Promise<Scorecard> {
    const response = await api.get<Scorecard>(`/api/matches/${id}/scorecard`);
    return response.data!;
  }

  static async getLiveMatches(): Promise<Match[]> {
    const response = await api.get<Match[]>('/api/matches/live');
    return response.data!;
  }
}
