import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyticsService } from '../../services/analyticsService';
import { api } from '../../services/api';

// Mock the api module
vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should get dashboard metrics without params', async () => {
      const mockMetrics = {
        overview: { totalEvents: 1000, totalUsers: 100 },
        trends: [],
      };
      vi.mocked(api.get).mockResolvedValue(mockMetrics);

      const result = await analyticsService.getDashboard();

      expect(api.get).toHaveBeenCalledWith('/analytics/dashboard', undefined);
      expect(result).toEqual(mockMetrics);
    });

    it('should get dashboard metrics with date range', async () => {
      vi.mocked(api.get).mockResolvedValue({});

      await analyticsService.getDashboard({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(api.get).toHaveBeenCalledWith('/analytics/dashboard', {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
    });
  });

  describe('getOverview', () => {
    it('should get analytics overview', async () => {
      const mockOverview = {
        today: { totalEvents: 100 },
        week: { totalEvents: 500 },
        month: { totalEvents: 2000 },
        trends: [],
      };
      vi.mocked(api.get).mockResolvedValue(mockOverview);

      const result = await analyticsService.getOverview();

      expect(api.get).toHaveBeenCalledWith('/analytics/overview');
      expect(result).toEqual(mockOverview);
    });
  });

  describe('getRealtime', () => {
    it('should get realtime analytics', async () => {
      const mockRealtime = {
        last15Minutes: { activeUsers: 50, events: 200, pageViews: 100 },
        lastHour: { activeUsers: 100, events: 500, pageViews: 300, purchases: 10 },
        topPages: [{ page: '/home', views: 50 }],
        eventBreakdown: [{ type: 'PAGE_VIEW', count: 100 }],
      };
      vi.mocked(api.get).mockResolvedValue(mockRealtime);

      const result = await analyticsService.getRealtime();

      expect(api.get).toHaveBeenCalledWith('/analytics/realtime');
      expect(result).toEqual(mockRealtime);
    });
  });

  describe('getUserInsights', () => {
    it('should get user insights without params', async () => {
      const mockInsights = {
        activeUsers: 100,
        newUsers: 20,
        returningUsers: 80,
      };
      vi.mocked(api.get).mockResolvedValue(mockInsights);

      const result = await analyticsService.getUserInsights();

      expect(api.get).toHaveBeenCalledWith('/analytics/user-insights', undefined);
      expect(result).toEqual(mockInsights);
    });

    it('should get user insights with date range', async () => {
      vi.mocked(api.get).mockResolvedValue({});

      await analyticsService.getUserInsights({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(api.get).toHaveBeenCalledWith('/analytics/user-insights', {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
    });
  });

  describe('getConversions', () => {
    it('should get conversion metrics', async () => {
      const mockConversions = {
        conversionRate: 3.5,
        totalPurchases: 100,
        totalRevenue: 5000,
        avgOrderValue: 50,
        purchaseFunnel: {
          pageViews: 10000,
          purchases: 100,
          conversionRate: 1,
        },
      };
      vi.mocked(api.get).mockResolvedValue(mockConversions);

      const result = await analyticsService.getConversions();

      expect(api.get).toHaveBeenCalledWith('/analytics/conversions', undefined);
      expect(result).toEqual(mockConversions);
    });
  });

  describe('getGeographic', () => {
    it('should get geographic analytics', async () => {
      const mockGeo = {
        countries: [
          { country: 'US', sessions: 500, users: 300 },
          { country: 'UK', sessions: 200, users: 150 },
        ],
      };
      vi.mocked(api.get).mockResolvedValue(mockGeo);

      const result = await analyticsService.getGeographic();

      expect(api.get).toHaveBeenCalledWith('/analytics/geographic', undefined);
      expect(result).toEqual(mockGeo);
    });
  });

  describe('getDevices', () => {
    it('should get device analytics', async () => {
      const mockDevices = {
        devices: [
          { device: 'desktop', count: 500, percentage: 50 },
          { device: 'mobile', count: 400, percentage: 40 },
          { device: 'tablet', count: 100, percentage: 10 },
        ],
      };
      vi.mocked(api.get).mockResolvedValue(mockDevices);

      const result = await analyticsService.getDevices();

      expect(api.get).toHaveBeenCalledWith('/analytics/devices', undefined);
      expect(result).toEqual(mockDevices);
    });
  });

  describe('getSummary', () => {
    it('should get analytics summary', async () => {
      const mockSummary = { totalEvents: 1000, totalUsers: 100 };
      vi.mocked(api.get).mockResolvedValue(mockSummary);

      const result = await analyticsService.getSummary();

      expect(api.get).toHaveBeenCalledWith('/analytics/summary', undefined);
      expect(result).toEqual(mockSummary);
    });
  });
});
