import { api } from './api';

interface SearchFilters {
  type?: 'players' | 'teams' | 'matches';
  limit?: number;
}

interface SearchResult {
  players: any[];
  teams: any[];
  matches: any[];
}

export class SearchService {
  static async search(
    query: string,
    filters?: SearchFilters
  ): Promise<SearchResult> {
    const params: Record<string, string> = { q: query };
    if (filters?.type) params.type = filters.type;
    if (filters?.limit) params.limit = String(filters.limit);

    const response = await api.get<SearchResult>('/api/search', params);
    return response.data!;
  }

  static async searchPlayers(query: string): Promise<any[]> {
    const response = await api.get<any[]>('/api/search/players', { q: query });
    return response.data!;
  }

  static async searchTeams(query: string): Promise<any[]> {
    const response = await api.get<any[]>('/api/search/teams', { q: query });
    return response.data!;
  }

  static async searchMatches(query: string): Promise<any[]> {
    const response = await api.get<any[]>('/api/search/matches', { q: query });
    return response.data!;
  }
}
