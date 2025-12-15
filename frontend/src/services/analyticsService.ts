import { api } from './api';
import { DashboardMetrics, UserInsights } from '../types';

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
  [key: string]: string | undefined;
}

export const analyticsService = {
  async getDashboard(params?: DateRangeParams): Promise<DashboardMetrics> {
    return api.get<DashboardMetrics>('/analytics/dashboard', params);
  },

  async getOverview(): Promise<{
    today: DashboardMetrics['overview'];
    week: DashboardMetrics['overview'];
    month: DashboardMetrics['overview'];
    trends: DashboardMetrics['trends'];
  }> {
    return api.get('/analytics/overview');
  },

  async getRealtime(): Promise<{
    last15Minutes: {
      activeUsers: number;
      events: number;
      pageViews: number;
    };
    lastHour: {
      activeUsers: number;
      events: number;
      pageViews: number;
      purchases: number;
    };
    topPages: Array<{ page: string; views: number }>;
    eventBreakdown: Array<{ type: string; count: number }>;
  }> {
    return api.get('/analytics/realtime');
  },

  async getUserInsights(params?: DateRangeParams): Promise<UserInsights> {
    return api.get<UserInsights>('/analytics/user-insights', params);
  },

  async getConversions(params?: DateRangeParams): Promise<{
    conversionRate: number;
    totalPurchases: number;
    totalRevenue: number;
    avgOrderValue: number;
    purchaseFunnel: {
      pageViews: number;
      purchases: number;
      conversionRate: number;
    };
  }> {
    return api.get('/analytics/conversions', params);
  },

  async getGeographic(params?: DateRangeParams): Promise<{
    countries: Array<{ country: string; sessions: number; users: number }>;
  }> {
    return api.get('/analytics/geographic', params);
  },

  async getDevices(params?: DateRangeParams): Promise<{
    devices: Array<{ device: string; count: number; percentage: number }>;
  }> {
    return api.get('/analytics/devices', params);
  },

  async getSummary(params?: DateRangeParams): Promise<unknown> {
    return api.get('/analytics/summary', params);
  },
};
