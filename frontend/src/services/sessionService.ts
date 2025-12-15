import { api } from './api';
import { Session, ApiResponse, PaginationParams } from '../types';

export interface SessionSearchParams extends PaginationParams {
  userId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const sessionService = {
  async search(params: SessionSearchParams): Promise<ApiResponse<Session[]>> {
    return api.getWithMeta<Session[]>('/sessions', params as Record<string, unknown>);
  },

  async getById(sessionId: string): Promise<Session> {
    return api.get<Session>(`/sessions/${sessionId}`);
  },

  async getByUserId(userId: string): Promise<Session[]> {
    return api.get<Session[]>(`/sessions/user/${userId}`);
  },
};
