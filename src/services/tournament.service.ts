import { api } from './api';
import type { Tournament, PaginatedResponse } from '@/types';

interface TournamentFilters {
  status?: string;
  search?: string;
  page?: string;
  limit?: string;
}

export class TournamentService {
  static async createTournament(data: Partial<Tournament>): Promise<Tournament> {
    const response = await api.post<Tournament>('/api/tournaments', data);
    return response.data!;
  }

  static async getTournament(id: string): Promise<Tournament> {
    const response = await api.get<Tournament>(`/api/tournaments/${id}`);
    return response.data!;
  }

  static async getTournaments(
    params?: TournamentFilters
  ): Promise<PaginatedResponse<Tournament>> {
    const response = await api.get<Tournament[]>(
      '/api/tournaments',
      params as Record<string, string>
    );
    return response as unknown as PaginatedResponse<Tournament>;
  }

  static async updateTournament(
    id: string,
    data: Partial<Tournament>
  ): Promise<Tournament> {
    const response = await api.patch<Tournament>(`/api/tournaments/${id}`, data);
    return response.data!;
  }

  static async getStandings(id: string): Promise<any> {
    const response = await api.get<any>(`/api/tournaments/${id}/standings`);
    return response.data!;
  }

  static async deleteTournament(id: string): Promise<void> {
    await api.delete(`/api/tournaments/${id}`);
  }
}
