import { api } from './api';
import { User, ApiResponse, PaginationParams } from '../types';

export interface UserSearchParams extends PaginationParams {
  search?: string;
  tags?: string[];
  segments?: string[];
  minEvents?: number;
  maxEvents?: number;
  startDate?: string;
  endDate?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  avgEventsPerUser: number;
  avgSessionsPerUser: number;
  topUsers: User[];
}

export const userService = {
  async search(params: UserSearchParams): Promise<ApiResponse<User[]>> {
    return api.getWithMeta<User[]>('/users', {
      ...params,
      tags: params.tags?.join(','),
      segments: params.segments?.join(','),
    });
  },

  async getByVisitorId(visitorId: string): Promise<User> {
    return api.get<User>(`/users/${visitorId}`);
  },

  async update(visitorId: string, data: Partial<User>): Promise<User> {
    return api.put<User>(`/users/${visitorId}`, data);
  },

  async getJourney(
    visitorId: string,
    startDate?: string,
    endDate?: string
  ): Promise<unknown[]> {
    return api.get(`/users/${visitorId}/journey`, { startDate, endDate });
  },

  async addTags(visitorId: string, tags: string[]): Promise<User> {
    return api.post<User>(`/users/${visitorId}/tags`, { tags });
  },

  async removeTags(visitorId: string, _tags: string[]): Promise<User> {
    return api.delete<User>(`/users/${visitorId}/tags`);
  },

  async addToSegments(visitorId: string, segments: string[]): Promise<User> {
    return api.post<User>(`/users/${visitorId}/segments`, { segments });
  },

  async getStats(): Promise<UserStats> {
    return api.get<UserStats>('/users/stats');
  },

  async getTopUsers(limit: number = 10): Promise<User[]> {
    return api.get<User[]>('/users/top', { limit });
  },

  async delete(visitorId: string): Promise<void> {
    await api.delete(`/users/${visitorId}`);
  },
};
