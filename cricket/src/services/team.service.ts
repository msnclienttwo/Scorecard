import { api } from './api';
import type { Team, Player, PaginatedResponse } from '@/types';

interface TeamFilters {
  search?: string;
  page?: string;
  limit?: string;
}

export class TeamService {
  static async createTeam(data: Partial<Team>): Promise<Team> {
    const response = await api.post<Team>('/api/teams', data);
    return response.data!;
  }

  static async getTeam(id: string): Promise<Team> {
    const response = await api.get<Team>(`/api/teams/${id}`);
    return response.data!;
  }

  static async getTeams(params?: TeamFilters): Promise<PaginatedResponse<Team>> {
    const response = await api.get<Team[]>('/api/teams', params as Record<string, string>);
    return response as unknown as PaginatedResponse<Team>;
  }

  static async updateTeam(id: string, data: Partial<Team>): Promise<Team> {
    const response = await api.patch<Team>(`/api/teams/${id}`, data);
    return response.data!;
  }

  static async getTeamPlayers(id: string): Promise<Player[]> {
    const response = await api.get<Player[]>(`/api/teams/${id}/players`);
    return response.data!;
  }

  static async deleteTeam(id: string): Promise<void> {
    await api.delete(`/api/teams/${id}`);
  }
}
