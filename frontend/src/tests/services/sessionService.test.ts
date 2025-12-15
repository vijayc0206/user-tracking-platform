import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sessionService } from '../../services/sessionService';
import { api } from '../../services/api';

// Mock the api module
vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    getWithMeta: vi.fn(),
  },
}));

describe('sessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('should search sessions with params', async () => {
      const mockResponse = {
        data: [{ sessionId: 'session1', status: 'ACTIVE' }],
        meta: { total: 1 },
      };
      vi.mocked(api.getWithMeta).mockResolvedValue(mockResponse);

      const result = await sessionService.search({ page: 1, limit: 10 });

      expect(api.getWithMeta).toHaveBeenCalledWith('/sessions', { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });

    it('should search sessions with all filters', async () => {
      vi.mocked(api.getWithMeta).mockResolvedValue({ data: [], meta: {} });

      await sessionService.search({
        userId: 'user123',
        status: 'ACTIVE',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(api.getWithMeta).toHaveBeenCalledWith('/sessions', {
        userId: 'user123',
        status: 'ACTIVE',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
    });
  });

  describe('getById', () => {
    it('should get session by ID', async () => {
      const mockSession = { sessionId: 'session123', status: 'ACTIVE' };
      vi.mocked(api.get).mockResolvedValue(mockSession);

      const result = await sessionService.getById('session123');

      expect(api.get).toHaveBeenCalledWith('/sessions/session123');
      expect(result).toEqual(mockSession);
    });
  });

  describe('getByUserId', () => {
    it('should get sessions by user ID', async () => {
      const mockSessions = [
        { sessionId: 'session1', userId: 'user123' },
        { sessionId: 'session2', userId: 'user123' },
      ];
      vi.mocked(api.get).mockResolvedValue(mockSessions);

      const result = await sessionService.getByUserId('user123');

      expect(api.get).toHaveBeenCalledWith('/sessions/user/user123');
      expect(result).toEqual(mockSessions);
    });
  });
});
