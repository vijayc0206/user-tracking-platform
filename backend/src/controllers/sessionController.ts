import { Request, Response } from 'express';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { sessionService } from '../services/sessionService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { SessionStatus } from '../types/index.js';

// Validation schemas
export const sessionCreateSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  device: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  entryPage: z.string().url().optional(),
});

export const sessionSearchSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  sortBy: z.string().optional().default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  userId: z.string().optional(),
  status: z.nativeEnum(SessionStatus).optional(),
  device: z.string().optional(),
  country: z.string().optional(),
  startDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  endDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
});

export const sessionEndSchema = z.object({
  exitPage: z.string().url().optional(),
});

class SessionController {
  /**
   * @swagger
   * /api/v1/sessions:
   *   post:
   *     summary: Create a new session
   *     tags: [Sessions]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SessionCreate'
   *     responses:
   *       201:
   *         description: Session created successfully
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const payload = sessionCreateSchema.parse(req.body);
    const session = await sessionService.create(payload);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: session,
    });
  });

  /**
   * @swagger
   * /api/v1/sessions:
   *   get:
   *     summary: Search sessions
   *     tags: [Sessions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [ACTIVE, ENDED, EXPIRED]
   *     responses:
   *       200:
   *         description: List of sessions
   */
  search = asyncHandler(async (req: Request, res: Response) => {
    const params = sessionSearchSchema.parse(req.query);
    const result = await sessionService.search(params);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result.sessions,
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
   * /api/v1/sessions/{sessionId}:
   *   get:
   *     summary: Get session by ID
   *     tags: [Sessions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Session details
   *       404:
   *         description: Session not found
   */
  getBySessionId = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const session = await sessionService.getBySessionId(sessionId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: session,
    });
  });

  /**
   * @swagger
   * /api/v1/sessions/user/{userId}:
   *   get:
   *     summary: Get sessions by user ID
   *     tags: [Sessions]
   *     security:
   *       - bearerAuth: []
   */
  getByUserId = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const sessions = await sessionService.getByUserId(userId, limit);

    res.status(StatusCodes.OK).json({
      success: true,
      data: sessions,
    });
  });

  /**
   * @swagger
   * /api/v1/sessions/{sessionId}/end:
   *   post:
   *     summary: End a session
   *     tags: [Sessions]
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Session ended successfully
   */
  endSession = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { exitPage } = sessionEndSchema.parse(req.body);
    const session = await sessionService.endSession(sessionId, exitPage);

    res.status(StatusCodes.OK).json({
      success: true,
      data: session,
    });
  });

  /**
   * @swagger
   * /api/v1/sessions/active:
   *   get:
   *     summary: Get active sessions
   *     tags: [Sessions]
   *     security:
   *       - bearerAuth: []
   */
  getActiveSessions = asyncHandler(async (_req: Request, res: Response) => {
    const sessions = await sessionService.getActiveSessions();

    res.status(StatusCodes.OK).json({
      success: true,
      data: sessions,
      meta: {
        total: sessions.length,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/sessions/stats:
   *   get:
   *     summary: Get session statistics
   *     tags: [Sessions]
   *     security:
   *       - bearerAuth: []
   */
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const stats = await sessionService.getStats(start, end);

    res.status(StatusCodes.OK).json({
      success: true,
      data: stats,
    });
  });

  /**
   * @swagger
   * /api/v1/sessions/expire-inactive:
   *   post:
   *     summary: Expire inactive sessions
   *     tags: [Sessions]
   *     security:
   *       - bearerAuth: []
   */
  expireInactiveSessions = asyncHandler(async (req: Request, res: Response) => {
    const inactiveMinutes = req.query.minutes
      ? parseInt(req.query.minutes as string, 10)
      : 30;
    const expiredCount = await sessionService.expireInactiveSessions(inactiveMinutes);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        expiredSessions: expiredCount,
      },
    });
  });
}

export const sessionController = new SessionController();
