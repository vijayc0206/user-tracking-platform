import { Request, Response } from 'express';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { eventService } from '../services/eventService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { EventType } from '../types/index.js';

// Validation schemas
export const eventIngestionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  sessionId: z.string().min(1, 'Session ID is required'),
  eventType: z.nativeEnum(EventType),
  timestamp: z.string().datetime().optional().transform((val) => (val ? new Date(val) : undefined)),
  properties: z.record(z.unknown()).optional(),
  metadata: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    device: z.string().optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional(),
    city: z.string().optional(),
  }).optional(),
  pageUrl: z.string().url().optional(),
  referrer: z.string().url().optional(),
  duration: z.number().min(0).optional(),
});

export const eventBatchSchema = z.object({
  events: z.array(eventIngestionSchema).min(1).max(1000),
});

export const eventSearchSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  sortBy: z.string().optional().default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  eventType: z.nativeEnum(EventType).optional(),
  pageUrl: z.string().optional(),
  startDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  endDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
});

class EventController {
  /**
   * @swagger
   * /api/v1/events:
   *   post:
   *     summary: Ingest a single event
   *     tags: [Events]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Event'
   *     responses:
   *       201:
   *         description: Event created successfully
   */
  ingest = asyncHandler(async (req: Request, res: Response) => {
    const payload = eventIngestionSchema.parse(req.body);
    const event = await eventService.ingest(payload);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: event,
    });
  });

  /**
   * @swagger
   * /api/v1/events/batch:
   *   post:
   *     summary: Ingest multiple events in batch
   *     tags: [Events]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               events:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/Event'
   *     responses:
   *       201:
   *         description: Events created successfully
   */
  ingestBatch = asyncHandler(async (req: Request, res: Response) => {
    const { events } = eventBatchSchema.parse(req.body);
    const result = await eventService.ingestBatch(events);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: result,
    });
  });

  /**
   * @swagger
   * /api/v1/events:
   *   get:
   *     summary: Search events
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *       - in: query
   *         name: eventType
   *         schema:
   *           type: string
   *           enum: [SESSION_START, SESSION_END, PAGE_VIEW, PRODUCT_VIEW, ADD_TO_CART, REMOVE_FROM_CART, PURCHASE, SEARCH, CLICK, SCROLL]
   *     responses:
   *       200:
   *         description: List of events
   */
  search = asyncHandler(async (req: Request, res: Response) => {
    const params = eventSearchSchema.parse(req.query);
    const result = await eventService.search(params);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result.events,
      meta: {
        page: params.page,
        limit: params.limit,
        total: result.total,
        totalPages: result.pages,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/events/{eventId}:
   *   get:
   *     summary: Get event by ID
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: eventId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Event details
   *       404:
   *         description: Event not found
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const event = await eventService.getById(eventId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: event,
    });
  });

  /**
   * @swagger
   * /api/v1/events/user/{userId}:
   *   get:
   *     summary: Get events by user ID
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   */
  getByUserId = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { startDate, endDate, limit } = req.query;

    const events = await eventService.getByUserId(userId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string, 10) : 100,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: events,
    });
  });

  /**
   * @swagger
   * /api/v1/events/session/{sessionId}:
   *   get:
   *     summary: Get events by session ID
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   */
  getBySessionId = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const events = await eventService.getBySessionId(sessionId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: events,
    });
  });

  /**
   * @swagger
   * /api/v1/events/stats:
   *   get:
   *     summary: Get event statistics
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const stats = await eventService.getStats(start, end);

    res.status(StatusCodes.OK).json({
      success: true,
      data: stats,
    });
  });

  /**
   * @swagger
   * /api/v1/events/daily-stats:
   *   get:
   *     summary: Get daily event statistics
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   */
  getDailyStats = asyncHandler(async (req: Request, res: Response) => {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const stats = await eventService.getDailyStats(days);

    res.status(StatusCodes.OK).json({
      success: true,
      data: stats,
    });
  });

  /**
   * @swagger
   * /api/v1/events/page-views:
   *   get:
   *     summary: Get page view statistics
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   */
  getPageViewStats = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, limit } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    const limitNum = limit ? parseInt(limit as string, 10) : 10;

    const stats = await eventService.getPageViewStats(start, end, limitNum);

    res.status(StatusCodes.OK).json({
      success: true,
      data: stats,
    });
  });

  /**
   * @swagger
   * /api/v1/events/types:
   *   get:
   *     summary: Get all event types
   *     tags: [Events]
   */
  getEventTypes = asyncHandler(async (_req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({
      success: true,
      data: Object.values(EventType),
    });
  });
}

export const eventController = new EventController();
