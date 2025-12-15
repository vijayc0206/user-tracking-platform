import { Event } from '../../models/Event.js';
import { User } from '../../models/User.js';
import { Session } from '../../models/Session.js';
import { analyticsService } from '../../services/analyticsService.js';
import { EventType, SessionStatus } from '../../types/index.js';

describe('AnalyticsService', () => {
  const baseDate = new Date('2024-01-15T10:00:00Z');
  const startDate = new Date('2024-01-01T00:00:00Z');
  const endDate = new Date('2024-01-31T23:59:59Z');

  beforeEach(async () => {
    // Create test users
    await User.create([
      {
        visitorId: 'analytics-user-1',
        email: 'user1@example.com',
        firstSeen: new Date('2024-01-01'),
        lastSeen: new Date('2024-01-15'),
        totalEvents: 100,
        totalPurchases: 5,
        totalRevenue: 499.99,
        segments: ['premium', 'active'],
      },
      {
        visitorId: 'analytics-user-2',
        firstSeen: new Date('2024-01-10'),
        lastSeen: new Date('2024-01-15'),
        totalEvents: 50,
        totalPurchases: 2,
        totalRevenue: 99.99,
        segments: ['new'],
      },
    ]);

    // Create test sessions
    await Session.create([
      {
        sessionId: 'analytics-session-1',
        userId: 'analytics-user-1',
        status: SessionStatus.ENDED,
        startTime: baseDate,
        duration: 300,
        pageViews: 5,
        device: 'Desktop',
        country: 'US',
      },
      {
        sessionId: 'analytics-session-2',
        userId: 'analytics-user-2',
        status: SessionStatus.ACTIVE,
        startTime: baseDate,
        duration: 60,
        pageViews: 1,
        device: 'Mobile',
        country: 'UK',
      },
    ]);

    // Create test events
    await Event.create([
      {
        eventId: 'analytics-event-1',
        userId: 'analytics-user-1',
        sessionId: 'analytics-session-1',
        eventType: EventType.PAGE_VIEW,
        timestamp: baseDate,
        pageUrl: 'https://example.com/home',
      },
      {
        eventId: 'analytics-event-2',
        userId: 'analytics-user-1',
        sessionId: 'analytics-session-1',
        eventType: EventType.PAGE_VIEW,
        timestamp: new Date(baseDate.getTime() + 1000),
        pageUrl: 'https://example.com/products',
      },
      {
        eventId: 'analytics-event-3',
        userId: 'analytics-user-1',
        sessionId: 'analytics-session-1',
        eventType: EventType.PURCHASE,
        timestamp: new Date(baseDate.getTime() + 2000),
        properties: { amount: 99.99 },
      },
      {
        eventId: 'analytics-event-4',
        userId: 'analytics-user-2',
        sessionId: 'analytics-session-2',
        eventType: EventType.PAGE_VIEW,
        timestamp: baseDate,
        pageUrl: 'https://example.com/home',
      },
      {
        eventId: 'analytics-event-5',
        userId: 'analytics-user-2',
        sessionId: 'analytics-session-2',
        eventType: EventType.CLICK,
        timestamp: new Date(baseDate.getTime() + 500),
      },
    ]);
  });

  describe('getDashboardMetrics', () => {
    it('should return comprehensive dashboard metrics', async () => {
      const metrics = await analyticsService.getDashboardMetrics(startDate, endDate);

      expect(metrics).toBeDefined();
      expect(metrics.overview).toBeDefined();
      expect(metrics.trends).toBeDefined();
      expect(metrics.topPages).toBeDefined();
      expect(metrics.eventBreakdown).toBeDefined();
      expect(metrics.userActivity).toBeDefined();
      expect(metrics.geographicData).toBeDefined();
      expect(metrics.deviceBreakdown).toBeDefined();
    });

    it('should include correct overview metrics', async () => {
      const metrics = await analyticsService.getDashboardMetrics(startDate, endDate);

      expect(metrics.overview.totalEvents).toBe(5);
      expect(metrics.overview.totalPageViews).toBe(3);
      expect(metrics.overview.totalPurchases).toBe(1);
      expect(metrics.overview.totalSessions).toBe(2);
    });

    it('should calculate trends correctly', async () => {
      const metrics = await analyticsService.getDashboardMetrics(startDate, endDate);

      expect(metrics.trends).toHaveProperty('usersChange');
      expect(metrics.trends).toHaveProperty('sessionsChange');
      expect(metrics.trends).toHaveProperty('eventsChange');
      expect(metrics.trends).toHaveProperty('revenueChange');
    });
  });

  describe('getUserInsights', () => {
    it('should return user insights', async () => {
      const insights = await analyticsService.getUserInsights(startDate, endDate);

      expect(insights).toBeDefined();
      expect(insights.activeUsers).toBeDefined();
      expect(insights.userSegments).toBeDefined();
      expect(insights.topUsersByEvents).toBeDefined();
      expect(insights.newVsReturning).toBeDefined();
    });

    it('should include active user counts', async () => {
      const insights = await analyticsService.getUserInsights(startDate, endDate);

      expect(insights.activeUsers).toHaveProperty('daily');
      expect(insights.activeUsers).toHaveProperty('weekly');
      expect(insights.activeUsers).toHaveProperty('monthly');
    });

    it('should return top users by events', async () => {
      const insights = await analyticsService.getUserInsights(startDate, endDate);

      expect(insights.topUsersByEvents.length).toBeGreaterThanOrEqual(0);

      if (insights.topUsersByEvents.length > 0) {
        const topUser = insights.topUsersByEvents[0];
        expect(topUser).toHaveProperty('userId');
        expect(topUser).toHaveProperty('events');
        expect(topUser).toHaveProperty('purchases');
        expect(topUser).toHaveProperty('revenue');
      }
    });

    it('should calculate new vs returning users', async () => {
      const insights = await analyticsService.getUserInsights(startDate, endDate);

      expect(insights.newVsReturning).toHaveProperty('newUsers');
      expect(insights.newVsReturning).toHaveProperty('returningUsers');
      expect(typeof insights.newVsReturning.newUsers).toBe('number');
      expect(typeof insights.newVsReturning.returningUsers).toBe('number');
    });
  });

  describe('getAnalyticsSummary', () => {
    it('should return analytics summary for export', async () => {
      const summary = await analyticsService.getAnalyticsSummary(startDate, endDate);

      expect(summary).toBeDefined();
      expect(summary.period).toEqual({ start: startDate, end: endDate });
      expect(summary.totalEvents).toBe(5);
      expect(summary.totalPageViews).toBe(3);
      expect(summary.totalPurchases).toBe(1);
      expect(summary.totalSessions).toBe(2);
    });

    it('should include top pages in summary', async () => {
      const summary = await analyticsService.getAnalyticsSummary(startDate, endDate);

      expect(summary.topPages).toBeDefined();
      expect(Array.isArray(summary.topPages)).toBe(true);
    });

    it('should include event breakdown', async () => {
      const summary = await analyticsService.getAnalyticsSummary(startDate, endDate);

      expect(summary.eventBreakdown).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty date range', async () => {
      const futureStart = new Date('2030-01-01');
      const futureEnd = new Date('2030-01-31');

      const metrics = await analyticsService.getDashboardMetrics(
        futureStart,
        futureEnd
      );

      expect(metrics.overview.totalEvents).toBe(0);
      expect(metrics.overview.totalSessions).toBe(0);
    });

    it('should handle single day range', async () => {
      const singleDay = new Date('2024-01-15T00:00:00Z');
      const singleDayEnd = new Date('2024-01-15T23:59:59Z');

      const metrics = await analyticsService.getDashboardMetrics(
        singleDay,
        singleDayEnd
      );

      expect(metrics).toBeDefined();
      expect(metrics.overview).toBeDefined();
    });
  });
});
