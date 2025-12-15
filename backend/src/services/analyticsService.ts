import { Event } from '../models/Event.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { EventType, IAnalyticsSummary } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface DashboardMetrics {
  overview: {
    totalUsers: number;
    totalSessions: number;
    totalEvents: number;
    totalPageViews: number;
    totalPurchases: number;
    totalRevenue: number;
    avgSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
  trends: {
    usersChange: number;
    sessionsChange: number;
    eventsChange: number;
    revenueChange: number;
  };
  topPages: Array<{ page: string; views: number; uniqueUsers: number }>;
  topProducts: Array<{ productId: string; name: string; views: number; purchases: number }>;
  eventBreakdown: Array<{ type: string; count: number; percentage: number }>;
  userActivity: Array<{ date: string; users: number; sessions: number; events: number }>;
  geographicData: Array<{ country: string; sessions: number; users: number }>;
  deviceBreakdown: Array<{ device: string; count: number; percentage: number }>;
}

export interface UserInsights {
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  userSegments: Array<{ segment: string; count: number }>;
  topUsersByEvents: Array<{
    userId: string;
    email?: string;
    events: number;
    purchases: number;
    revenue: number;
  }>;
  newVsReturning: {
    newUsers: number;
    returningUsers: number;
  };
  userRetention: Array<{
    cohort: string;
    week0: number;
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  }>;
}

class AnalyticsService {
  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<DashboardMetrics> {
    // Calculate previous period for trend comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodDuration);
    const prevEndDate = startDate;

    const [
      currentMetrics,
      previousMetrics,
      topPages,
      eventBreakdown,
      userActivity,
      geographicData,
      deviceBreakdown,
    ] = await Promise.all([
      this.getOverviewMetrics(startDate, endDate),
      this.getOverviewMetrics(prevStartDate, prevEndDate),
      this.getTopPages(startDate, endDate, 10),
      this.getEventBreakdown(startDate, endDate),
      this.getUserActivity(startDate, endDate),
      this.getGeographicData(startDate, endDate),
      this.getDeviceBreakdown(startDate, endDate),
    ]);

    // Calculate trends
    const trends = {
      usersChange: this.calculateChange(
        currentMetrics.totalUsers,
        previousMetrics.totalUsers
      ),
      sessionsChange: this.calculateChange(
        currentMetrics.totalSessions,
        previousMetrics.totalSessions
      ),
      eventsChange: this.calculateChange(
        currentMetrics.totalEvents,
        previousMetrics.totalEvents
      ),
      revenueChange: this.calculateChange(
        currentMetrics.totalRevenue,
        previousMetrics.totalRevenue
      ),
    };

    return {
      overview: currentMetrics,
      trends,
      topPages,
      topProducts: [], // Would be populated from product tracking
      eventBreakdown,
      userActivity,
      geographicData,
      deviceBreakdown,
    };
  }

  /**
   * Get overview metrics for a period
   */
  private async getOverviewMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<DashboardMetrics['overview']> {
    const [
      eventStats,
      sessionStats,
      userCount,
      purchaseStats,
    ] = await Promise.all([
      Event.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' },
            pageViews: {
              $sum: {
                $cond: [{ $eq: ['$eventType', EventType.PAGE_VIEW] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            totalEvents: 1,
            totalUsers: { $size: '$uniqueUsers' },
            pageViews: 1,
          },
        },
      ]),
      Session.aggregate([
        {
          $match: {
            startTime: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            avgDuration: { $avg: '$duration' },
            bounced: {
              $sum: {
                $cond: [{ $lte: ['$pageViews', 1] }, 1, 0],
              },
            },
          },
        },
      ]),
      User.countDocuments({
        lastSeen: { $gte: startDate, $lte: endDate },
      }),
      Event.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate },
            eventType: EventType.PURCHASE,
          },
        },
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: 1 },
            totalRevenue: { $sum: '$properties.amount' },
            purchaseUsers: { $addToSet: '$userId' },
          },
        },
      ]),
    ]);

    const events = eventStats[0] || { totalEvents: 0, totalUsers: 0, pageViews: 0 };
    const sessions = sessionStats[0] || {
      totalSessions: 0,
      avgDuration: 0,
      bounced: 0,
    };
    const purchases = purchaseStats[0] || {
      totalPurchases: 0,
      totalRevenue: 0,
      purchaseUsers: [],
    };

    const bounceRate =
      sessions.totalSessions > 0
        ? (sessions.bounced / sessions.totalSessions) * 100
        : 0;

    const conversionRate =
      events.totalUsers > 0
        ? (purchases.purchaseUsers.length / events.totalUsers) * 100
        : 0;

    return {
      totalUsers: userCount,
      totalSessions: sessions.totalSessions,
      totalEvents: events.totalEvents,
      totalPageViews: events.pageViews,
      totalPurchases: purchases.totalPurchases,
      totalRevenue: purchases.totalRevenue || 0,
      avgSessionDuration: Math.round(sessions.avgDuration || 0),
      bounceRate: Math.round(bounceRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  /**
   * Get top pages
   */
  private async getTopPages(
    startDate: Date,
    endDate: Date,
    limit: number
  ): Promise<Array<{ page: string; views: number; uniqueUsers: number }>> {
    const result = await Event.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          eventType: EventType.PAGE_VIEW,
          pageUrl: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$pageUrl',
          views: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
        },
      },
      {
        $project: {
          _id: 0,
          page: '$_id',
          views: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
        },
      },
      { $sort: { views: -1 } },
      { $limit: limit },
    ]);

    return result;
  }

  /**
   * Get event breakdown by type
   */
  private async getEventBreakdown(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ type: string; count: number; percentage: number }>> {
    const result = await Event.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const total = result.reduce((sum, item) => sum + item.count, 0);

    return result.map((item) => ({
      type: item._id,
      count: item.count,
      percentage: Math.round((item.count / total) * 10000) / 100,
    }));
  }

  /**
   * Get user activity over time
   */
  private async getUserActivity(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; users: number; sessions: number; events: number }>> {
    const result = await Event.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          },
          users: { $addToSet: '$userId' },
          sessions: { $addToSet: '$sessionId' },
          events: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id.date',
          users: { $size: '$users' },
          sessions: { $size: '$sessions' },
          events: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    return result;
  }

  /**
   * Get geographic data
   */
  private async getGeographicData(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ country: string; sessions: number; users: number }>> {
    const result = await Session.aggregate([
      {
        $match: {
          startTime: { $gte: startDate, $lte: endDate },
          country: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$country',
          sessions: { $sum: 1 },
          users: { $addToSet: '$userId' },
        },
      },
      {
        $project: {
          _id: 0,
          country: '$_id',
          sessions: 1,
          users: { $size: '$users' },
        },
      },
      { $sort: { sessions: -1 } },
      { $limit: 20 },
    ]);

    return result;
  }

  /**
   * Get device breakdown
   */
  private async getDeviceBreakdown(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ device: string; count: number; percentage: number }>> {
    const result = await Session.aggregate([
      {
        $match: {
          startTime: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$device', 'Unknown'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const total = result.reduce((sum, item) => sum + item.count, 0);

    return result.map((item) => ({
      device: item._id,
      count: item.count,
      percentage: Math.round((item.count / total) * 10000) / 100,
    }));
  }

  /**
   * Get user insights
   */
  async getUserInsights(startDate: Date, endDate: Date): Promise<UserInsights> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      dailyActive,
      weeklyActive,
      monthlyActive,
      userSegments,
      topUsers,
      newVsReturning,
    ] = await Promise.all([
      User.countDocuments({ lastSeen: { $gte: dayAgo } }),
      User.countDocuments({ lastSeen: { $gte: weekAgo } }),
      User.countDocuments({ lastSeen: { $gte: monthAgo } }),
      this.getUserSegments(),
      this.getTopUsersByEvents(10),
      this.getNewVsReturningUsers(startDate, endDate),
    ]);

    return {
      activeUsers: {
        daily: dailyActive,
        weekly: weeklyActive,
        monthly: monthlyActive,
      },
      userSegments,
      topUsersByEvents: topUsers,
      newVsReturning,
      userRetention: [], // Complex retention analysis would go here
    };
  }

  /**
   * Get user segments breakdown
   */
  private async getUserSegments(): Promise<Array<{ segment: string; count: number }>> {
    const result = await User.aggregate([
      { $unwind: '$segments' },
      {
        $group: {
          _id: '$segments',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          segment: '$_id',
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    return result;
  }

  /**
   * Get top users by events
   */
  private async getTopUsersByEvents(
    limit: number
  ): Promise<
    Array<{
      userId: string;
      email?: string;
      events: number;
      purchases: number;
      revenue: number;
    }>
  > {
    const result = await User.find()
      .sort({ totalEvents: -1 })
      .limit(limit)
      .select('visitorId email totalEvents totalPurchases totalRevenue');

    return result.map((user) => ({
      userId: user.visitorId,
      email: user.email,
      events: user.totalEvents,
      purchases: user.totalPurchases,
      revenue: user.totalRevenue,
    }));
  }

  /**
   * Get new vs returning users
   */
  private async getNewVsReturningUsers(
    startDate: Date,
    endDate: Date
  ): Promise<{ newUsers: number; returningUsers: number }> {
    const [newUsers, returningUsers] = await Promise.all([
      User.countDocuments({
        firstSeen: { $gte: startDate, $lte: endDate },
      }),
      User.countDocuments({
        firstSeen: { $lt: startDate },
        lastSeen: { $gte: startDate, $lte: endDate },
      }),
    ]);

    return { newUsers, returningUsers };
  }

  /**
   * Get analytics summary for export
   */
  async getAnalyticsSummary(
    startDate: Date,
    endDate: Date
  ): Promise<IAnalyticsSummary> {
    const [overview, eventCounts, topPages] = await Promise.all([
      this.getOverviewMetrics(startDate, endDate),
      Event.getEventCounts(startDate, endDate),
      this.getTopPages(startDate, endDate, 20),
    ]);

    const eventBreakdown: Record<EventType, number> = {} as Record<EventType, number>;
    eventCounts.forEach((item) => {
      eventBreakdown[item._id] = item.count;
    });

    return {
      period: { start: startDate, end: endDate },
      totalUsers: overview.totalUsers,
      totalSessions: overview.totalSessions,
      totalEvents: overview.totalEvents,
      totalPageViews: overview.totalPageViews,
      totalPurchases: overview.totalPurchases,
      totalRevenue: overview.totalRevenue,
      avgSessionDuration: overview.avgSessionDuration,
      bounceRate: overview.bounceRate,
      conversionRate: overview.conversionRate,
      topPages: topPages.map((p) => ({ page: p.page, views: p.views })),
      topProducts: [],
      eventBreakdown,
    };
  }

  /**
   * Calculate percentage change
   */
  private calculateChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 10000) / 100;
  }
}

export const analyticsService = new AnalyticsService();
