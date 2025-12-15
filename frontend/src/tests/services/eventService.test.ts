import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventService } from '../../services/eventService';
import { api } from '../../services/api';

// Mock the api module
vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    getWithMeta: vi.fn(),
  },
}));

describe('eventService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('should search events with params', async () => {
      const mockResponse = {
        data: [{ id: 'event1', eventType: 'PAGE_VIEW' }],
        meta: { total: 1 },
      };
      vi.mocked(api.getWithMeta).mockResolvedValue(mockResponse);

      const result = await eventService.search({ page: 1, limit: 10 });

      expect(api.getWithMeta).toHaveBeenCalledWith('/events', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });

    it('should search events with all filters', async () => {
      vi.mocked(api.getWithMeta).mockResolvedValue({ data: [], meta: {} });

      await eventService.search({
        userId: 'user123',
        sessionId: 'session456',
        eventType: 'PURCHASE',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(api.getWithMeta).toHaveBeenCalledWith('/events', {
        userId: 'user123',
        sessionId: 'session456',
        eventType: 'PURCHASE',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
    });
  });

  describe('getById', () => {
    it('should get event by ID', async () => {
      const mockEvent = { id: 'event123', eventType: 'CLICK' };
      vi.mocked(api.get).mockResolvedValue(mockEvent);

      const result = await eventService.getById('event123');

      expect(api.get).toHaveBeenCalledWith('/events/event123');
      expect(result).toEqual(mockEvent);
    });
  });

  describe('getBySessionId', () => {
    it('should get events by session ID', async () => {
      const mockEvents = [
        { id: 'event1', sessionId: 'session123' },
        { id: 'event2', sessionId: 'session123' },
      ];
      vi.mocked(api.get).mockResolvedValue(mockEvents);

      const result = await eventService.getBySessionId('session123');

      expect(api.get).toHaveBeenCalledWith('/events/session/session123');
      expect(result).toEqual(mockEvents);
    });
  });

  describe('getByUserId', () => {
    it('should get events by user ID', async () => {
      const mockEvents = [
        { id: 'event1', userId: 'user123' },
        { id: 'event2', userId: 'user123' },
      ];
      vi.mocked(api.get).mockResolvedValue(mockEvents);

      const result = await eventService.getByUserId('user123');

      expect(api.get).toHaveBeenCalledWith('/events/user/user123');
      expect(result).toEqual(mockEvents);
    });
  });
});
