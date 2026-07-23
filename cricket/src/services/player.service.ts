import { api } from './api';
import type { Player, PaginatedResponse } from '@/types';

interface PlayerFilters {
  teamId?: string;
  role?: string;
  search?: string;
  page?: string;
  limit?: string;
}

export class PlayerService {
  static async createPlayer(data: Partial<Player>): Promise<Player> {
    const response = await api.post<Player>('/api/players', data);
    return response.data!;
  }

  static async getPlayer(id: string): Promise<Player> {
    const response = await api.get<Player>(`/api/players/${id}`);
    return response.data!;
  }

  static async getPlayers(params?: PlayerFilters): Promise<PaginatedResponse<Player>> {
    const response = await api.get<Player[]>('/api/players', params as Record<string, string>);
    return response as unknown as PaginatedResponse<Player>;
  }

  static async updatePlayer(id: string, data: Partial<Player>): Promise<Player> {
    const response = await api.patch<Player>(`/api/players/${id}`, data);
    return response.data!;
  }

  static async getPlayerStats(id: string): Promise<any> {
    const response = await api.get<any>(`/api/players/${id}/stats`);
    return response.data!;
  }

  static async deletePlayer(id: string): Promise<void> {
    await api.delete(`/api/players/${id}`);
  }
}
