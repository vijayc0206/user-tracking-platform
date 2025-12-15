import { Request, Response } from 'express';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { authService } from '../services/authService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { AuthenticatedRequest, UserRole } from '../types/index.js';

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.nativeEnum(UserRole).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const updateRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

class AuthController {
  /**
   * @swagger
   * /api/v1/auth/register:
   *   post:
   *     summary: Register a new admin user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 8
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [USER, ADMIN, ANALYST]
   *     responses:
   *       201:
   *         description: User registered successfully
   *       409:
   *         description: User already exists
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const payload = registerSchema.parse(req.body);
    const result = await authService.register(payload);

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: result,
    });
  });

  /**
   * @swagger
   * /api/v1/auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const payload = loginSchema.parse(req.body);
    const result = await authService.login(payload);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  });

  /**
   * @swagger
   * /api/v1/auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Tokens refreshed successfully
   *       401:
   *         description: Invalid refresh token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const tokens = await authService.refreshToken(refreshToken);

    res.status(StatusCodes.OK).json({
      success: true,
      data: tokens,
    });
  });

  /**
   * @swagger
   * /api/v1/auth/profile:
   *   get:
   *     summary: Get current user profile
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile
   */
  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await authService.getProfile(req.user!.id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  });

  /**
   * @swagger
   * /api/v1/auth/profile:
   *   put:
   *     summary: Update user profile
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   */
  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = updateProfileSchema.parse(req.body);
    const user = await authService.updateProfile(req.user!.id, data);

    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  });

  /**
   * @swagger
   * /api/v1/auth/change-password:
   *   post:
   *     summary: Change password
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   */
  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user!.id, currentPassword, newPassword);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { message: 'Password changed successfully' },
    });
  });

  /**
   * @swagger
   * /api/v1/auth/users:
   *   get:
   *     summary: Get all admin users (admin only)
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   */
  getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
    const users = await authService.getAllUsers();

    res.status(StatusCodes.OK).json({
      success: true,
      data: users,
    });
  });

  /**
   * @swagger
   * /api/v1/auth/users/{userId}/role:
   *   put:
   *     summary: Update user role (admin only)
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   */
  updateRole = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { role } = updateRoleSchema.parse(req.body);
    const user = await authService.updateRole(userId, role);

    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
    });
  });

  /**
   * @swagger
   * /api/v1/auth/users/{userId}/deactivate:
   *   post:
   *     summary: Deactivate user (admin only)
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   */
  deactivateUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    await authService.deactivateUser(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { message: 'User deactivated successfully' },
    });
  });

  /**
   * @swagger
   * /api/v1/auth/users/{userId}/activate:
   *   post:
   *     summary: Activate user (admin only)
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   */
  activateUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    await authService.activateUser(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { message: 'User activated successfully' },
    });
  });
}

export const authController = new AuthController();
