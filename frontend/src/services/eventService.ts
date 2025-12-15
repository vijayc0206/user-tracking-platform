import { api } from './api';
import { Event, ApiResponse, PaginationParams, EventType } from '../types';

export interface EventSearchParams extends PaginationParams {
  userId?: string;
  sessionId?: string;
  eventType?: EventType;
  startDate?: string;
  endDate?: string;
}

export const eventService = {
  async search(params: EventSearchParams): Promise<ApiResponse<Event[]>> {
    return api.getWithMeta<Event[]>('/events', params as Record<string, unknown>);
  },

  async getById(eventId: string): Promise<Event> {
    return api.get<Event>(`/events/${eventId}`);
  },

  async getBySessionId(sessionId: string): Promise<Event[]> {
    return api.get<Event[]>(`/events/session/${sessionId}`);
  },

  async getByUserId(userId: string): Promise<Event[]> {
    return api.get<Event[]>(`/events/user/${userId}`);
  },
};
