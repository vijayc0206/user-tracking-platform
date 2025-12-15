import { Request, Response } from 'express';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { userService } from '../services/userService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { ApiResponse } from '../types/index.js';

// Validation schemas
export const userSearchSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  sortBy: z.string().optional().default('lastSeen'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  tags: z.string().optional().transform((val) => (val ? val.split(',') : undefined)),
  segments: z.string().optional().transform((val) => (val ? val.split(',') : undefined)),
  minEvents: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  maxEvents: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
  startDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  endDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
});

export const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  attributes: z.record(z.unknown()).optional(),
});

export const userTagsSchema = z.object({
  tags: z.array(z.string().min(1)),
});

export const userSegmentsSchema = z.object({
  segments: z.array(z.string().min(1)),
});

class UserController {
  /**
   * @swagger
   * /api/v1/users:
   *   get:
   *     summary: Search users
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Items per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term
   *     responses:
   *       200:
   *         description: List of users
   */
  search = asyncHandler(async (req: Request, res: Response) => {
    const params = userSearchSchema.parse(req.query);
    const result = await userService.search(params);

    const response: ApiResponse<typeof result.users> = {
      success: true,
      data: result.users,
      meta: {
        page: params.page,
        limit: params.limit,
        total: result.total,
        totalPages: result.pages,
      },
    };

    res.status(StatusCodes.OK).json(response);
  });

  /**
   * @swagger
   * /api/v1/users/{visitorId}:
   *   get:
   *     summary: Get user by visitor ID
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: visitorId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: User details
   *       404:
   *         description: User not found
   */
  getByVisitorId = asyncHandler(async (req: Request, res: Response) => {
    const { visitorId } = req.params;
    const user = await userService.findByVisitorId(visitorId);

    if (!user) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  });

  /**
   * @swagger
   * /api/v1/users/{visitorId}:
   *   put:
   *     summary: Update user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { visitorId } = req.params;
    const data = userUpdateSchema.parse(req.body);
    const user = await userService.update(visitorId, data);

    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  });

  /**
   * @swagger
   * /api/v1/users/{visitorId}/journey:
   *   get:
   *     summary: Get user journey
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   */
  getJourney = asyncHandler(async (req: Request, res: Response) => {
    const { visitorId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const { eventService } = await import('../services/eventService.js');
    const journey = await eventService.getUserJourney(visitorId, start, end);

    res.status(StatusCodes.OK).json({
      success: true,
      data: journey,
    });
  });

  /**
   * @swagger
   * /api/v1/users/{visitorId}/tags:
   *   post:
   *     summary: Add tags to user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   */
  addTags = asyncHandler(async (req: Request, res: Response) => {
    const { visitorId } = req.params;
    const { tags } = userTagsSchema.parse(req.body);
    const user = await userService.addTags(visitorId, tags);

    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  });

  /**
   * @swagger
   * /api/v1/users/{visitorId}/tags:
   *   delete:
   *     summary: Remove tags from user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   */
  removeTags = asyncHandler(async (req: Request, res: Response) => {
    const { visitorId } = req.params;
    const { tags } = userTagsSchema.parse(req.body);
    const user = await userService.removeTags(visitorId, tags);

    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  });

  /**
   * @swagger
   * /api/v1/users/{visitorId}/segments:
   *   post:
   *     summary: Add user to segments
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   */
  addToSegments = asyncHandler(async (req: Request, res: Response) => {
    const { visitorId } = req.params;
    const { segments } = userSegmentsSchema.parse(req.body);
    const user = await userService.addToSegments(visitorId, segments);

    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  });

  /**
   * @swagger
   * /api/v1/users/stats:
   *   get:
   *     summary: Get user statistics
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   */
  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await userService.getStats();

    res.status(StatusCodes.OK).json({
      success: true,
      data: stats,
    });
  });

  /**
   * @swagger
   * /api/v1/users/top:
   *   get:
   *     summary: Get top users by events
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   */
  getTopUsers = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const users = await userService.getTopUsers(limit);

    res.status(StatusCodes.OK).json({
      success: true,
      data: users,
    });
  });

  /**
   * @swagger
   * /api/v1/users/{visitorId}:
   *   delete:
   *     summary: Delete user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { visitorId } = req.params;
    await userService.delete(visitorId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { message: 'User deleted successfully' },
    });
  });
}

export const userController = new UserController();
