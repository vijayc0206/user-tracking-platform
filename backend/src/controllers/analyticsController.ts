import { Request, Response } from 'express';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { analyticsService } from '../services/analyticsService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

// Validation schemas
export const dateRangeSchema = z.object({
  startDate: z.string().optional().transform((val) => {
    if (!val) return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return new Date(val);
  }),
  endDate: z.string().optional().transform((val) => {
    if (!val) return new Date();
    return new Date(val);
  }),
});

class AnalyticsController {
  /**
   * @swagger
   * /api/v1/analytics/dashboard:
   *   get:
   *     summary: Get dashboard metrics
   *     tags: [Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date for analytics period
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date for analytics period
   *     responses:
   *       200:
   *         description: Dashboard metrics
   */
  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    const metrics = await analyticsService.getDashboardMetrics(startDate, endDate);

    res.status(StatusCodes.OK).json({
      success: true,
      data: metrics,
    });
  });

  /**
   * @swagger
   * /api/v1/analytics/user-insights:
   *   get:
   *     summary: Get user insights
   *     tags: [Analytics]
   *     security:
   *       - bearerAuth: []
   */
  getUserInsights = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    const insights = await analyticsService.getUserInsights(startDate, endDate);

    res.status(StatusCodes.OK).json({
      success: true,
      data: insights,
    });
  });

  /**
   * @swagger
   * /api/v1/analytics/summary:
   *   get:
   *     summary: Get analytics summary for export
   *     tags: [Analytics]
   *     security:
   *       - bearerAuth: []
   */
  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    const summary = await analyticsService.getAnalyticsSummary(startDate, endDate);

    res.status(StatusCodes.OK).json({
      success: true,
      data: summary,
    });
  });

  /**
   * @swagger
   * /api/v1/analytics/overview:
   *   get:
   *     summary: Get quick overview metrics
   *     tags: [Analytics]
   *     security:
   *       - bearerAuth: []
   */
  getOverview = asyncHandler(async (req: Request, res: Response) => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [todayMetrics, weekMetrics, monthMetrics] = await Promise.all([
      analyticsService.getDashboardMetrics(startOfDay, new Date()),
      analyticsService.getDashboardMetrics(last7Days, new Date()),
      analyticsService.getDashboardMetrics(last30Days, new Date()),
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        today: todayMetrics.overview,
        week: weekMetrics.overview,
        month: monthMetrics.overview,
        trends: monthMetrics.trends,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/analytics/realtime:
   *   get:
   *     summary: Get real-time analytics
   *     tags: [Analytics]
   *     security:
   *       - bearerAuth: []
   */
  getRealtime = asyncHandler(async (_req: Request, res: Response) => {
    const last15Minutes = new Date(Date.now() - 15 * 60 * 1000);
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);

    const metrics = await analyticsService.getDashboardMetrics(last15Minutes, new Date());
    const hourlyMetrics = await analyticsService.getDashboardMetrics(lastHour, new Date());

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        last15Minutes: {
          activeUsers: metrics.overview.totalUsers,
          events: metrics.overview.totalEvents,
          pageViews: metrics.overview.totalPageViews,
        },
        lastHour: {
          activeUsers: hourlyMetrics.overview.totalUsers,
          events: hourlyMetrics.overview.totalEvents,
          pageViews: hourlyMetrics.overview.totalPageViews,
          purchases: hourlyMetrics.overview.totalPurchases,
        },
        topPages: metrics.topPages.slice(0, 5),
        eventBreakdown: metrics.eventBreakdown.slice(0, 5),
      },
    });
  });

  /**
   * @swagger
   * /api/v1/analytics/conversions:
   *   get:
   *     summary: Get conversion analytics
   *     tags: [Analytics]
   *     security:
   *       - bearerAuth: []
   */
  getConversions = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    const metrics = await analyticsService.getDashboardMetrics(startDate, endDate);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        conversionRate: metrics.overview.conversionRate,
        totalPurchases: metrics.overview.totalPurchases,
        totalRevenue: metrics.overview.totalRevenue,
        avgOrderValue: metrics.overview.totalPurchases > 0
          ? metrics.overview.totalRevenue / metrics.overview.totalPurchases
          : 0,
        purchaseFunnel: {
          pageViews: metrics.overview.totalPageViews,
          purchases: metrics.overview.totalPurchases,
          conversionRate: metrics.overview.conversionRate,
        },
      },
    });
  });

  /**
   * @swagger
   * /api/v1/analytics/geographic:
   *   get:
   *     summary: Get geographic analytics
   *     tags: [Analytics]
   *     security:
   *       - bearerAuth: []
   */
  getGeographic = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    const metrics = await analyticsService.getDashboardMetrics(startDate, endDate);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        countries: metrics.geographicData,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/analytics/devices:
   *   get:
   *     summary: Get device analytics
   *     tags: [Analytics]
   *     security:
   *       - bearerAuth: []
   */
  getDevices = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = dateRangeSchema.parse(req.query);
    const metrics = await analyticsService.getDashboardMetrics(startDate, endDate);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        devices: metrics.deviceBreakdown,
      },
    });
  });
}

export const analyticsController = new AnalyticsController();
