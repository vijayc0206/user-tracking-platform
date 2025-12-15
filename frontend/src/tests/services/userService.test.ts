import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../../services/userService';
import { api } from '../../services/api';

// Mock the api module
vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    getWithMeta: vi.fn(),
  },
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('should search users with basic params', async () => {
      const mockResponse = {
        data: [{ visitorId: 'user1' }],
        meta: { total: 1 },
      };
      vi.mocked(api.getWithMeta).mockResolvedValue(mockResponse);

      const result = await userService.search({ page: 1, limit: 10 });

      expect(api.getWithMeta).toHaveBeenCalledWith('/users', {
        page: 1,
        limit: 10,
        tags: undefined,
        segments: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should convert tags array to comma-separated string', async () => {
      vi.mocked(api.getWithMeta).mockResolvedValue({ data: [], meta: {} });

      await userService.search({ tags: ['tag1', 'tag2'] });

      expect(api.getWithMeta).toHaveBeenCalledWith('/users', {
        tags: 'tag1,tag2',
        segments: undefined,
      });
    });

    it('should convert segments array to comma-separated string', async () => {
      vi.mocked(api.getWithMeta).mockResolvedValue({ data: [], meta: {} });

      await userService.search({ segments: ['segment1', 'segment2'] });

      expect(api.getWithMeta).toHaveBeenCalledWith('/users', {
        tags: undefined,
        segments: 'segment1,segment2',
      });
    });
  });

  describe('getByVisitorId', () => {
    it('should get user by visitor ID', async () => {
      const mockUser = { visitorId: 'user123', email: 'test@test.com' };
      vi.mocked(api.get).mockResolvedValue(mockUser);

      const result = await userService.getByVisitorId('user123');

      expect(api.get).toHaveBeenCalledWith('/users/user123');
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const updateData = { firstName: 'Updated' };
      const mockUpdatedUser = { visitorId: 'user123', firstName: 'Updated' };
      vi.mocked(api.put).mockResolvedValue(mockUpdatedUser);

      const result = await userService.update('user123', updateData);

      expect(api.put).toHaveBeenCalledWith('/users/user123', updateData);
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('getJourney', () => {
    it('should get user journey', async () => {
      const mockJourney = [{ event: 'page_view' }, { event: 'click' }];
      vi.mocked(api.get).mockResolvedValue(mockJourney);

      const result = await userService.getJourney('user123');

      expect(api.get).toHaveBeenCalledWith('/users/user123/journey', {
        startDate: undefined,
        endDate: undefined,
      });
      expect(result).toEqual(mockJourney);
    });

    it('should get user journey with date range', async () => {
      vi.mocked(api.get).mockResolvedValue([]);

      await userService.getJourney('user123', '2024-01-01', '2024-01-31');

      expect(api.get).toHaveBeenCalledWith('/users/user123/journey', {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
    });
  });

  describe('addTags', () => {
    it('should add tags to user', async () => {
      const mockUser = { visitorId: 'user123', tags: ['tag1', 'tag2'] };
      vi.mocked(api.post).mockResolvedValue(mockUser);

      const result = await userService.addTags('user123', ['tag1', 'tag2']);

      expect(api.post).toHaveBeenCalledWith('/users/user123/tags', {
        tags: ['tag1', 'tag2'],
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('removeTags', () => {
    it('should remove tags from user', async () => {
      const mockUser = { visitorId: 'user123', tags: [] };
      vi.mocked(api.delete).mockResolvedValue(mockUser);

      const result = await userService.removeTags('user123', ['tag1']);

      expect(api.delete).toHaveBeenCalledWith('/users/user123/tags');
      expect(result).toEqual(mockUser);
    });
  });

  describe('addToSegments', () => {
    it('should add user to segments', async () => {
      const mockUser = { visitorId: 'user123', segments: ['vip'] };
      vi.mocked(api.post).mockResolvedValue(mockUser);

      const result = await userService.addToSegments('user123', ['vip']);

      expect(api.post).toHaveBeenCalledWith('/users/user123/segments', {
        segments: ['vip'],
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('getStats', () => {
    it('should get user stats', async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 50,
        newUsersToday: 5,
      };
      vi.mocked(api.get).mockResolvedValue(mockStats);

      const result = await userService.getStats();

      expect(api.get).toHaveBeenCalledWith('/users/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('getTopUsers', () => {
    it('should get top users with default limit', async () => {
      const mockUsers = [{ visitorId: 'user1' }];
      vi.mocked(api.get).mockResolvedValue(mockUsers);

      const result = await userService.getTopUsers();

      expect(api.get).toHaveBeenCalledWith('/users/top', { limit: 10 });
      expect(result).toEqual(mockUsers);
    });

    it('should get top users with custom limit', async () => {
      vi.mocked(api.get).mockResolvedValue([]);

      await userService.getTopUsers(20);

      expect(api.get).toHaveBeenCalledWith('/users/top', { limit: 20 });
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined);

      await userService.delete('user123');

      expect(api.delete).toHaveBeenCalledWith('/users/user123');
    });
  });
});
