import { AdminUser, IAdminUserDocument } from '../models/AdminUser.js';
import { UserRole } from '../types/index.js';
import {
  generateTokens,
  verifyRefreshToken,
} from '../middlewares/auth.js';
import {
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from '../middlewares/errorHandler.js';
import { logger } from '../utils/logger.js';

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  tokens: AuthTokens;
}

class AuthService {
  /**
   * Register a new admin user
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await AdminUser.findByEmail(payload.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Create new user
    const user = await AdminUser.create({
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role || UserRole.ANALYST,
      isActive: true,
    });

    // Generate tokens
    const tokens = generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info(`New user registered: ${user.email}`);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    // Find user with password
    const user = await AdminUser.findByEmailWithPassword(payload.email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(payload.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const tokens = generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await AdminUser.findById(decoded.id);

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Account is deactivated');
      }

      return generateTokens({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      });
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<IAdminUserDocument> {
    const user = await AdminUser.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: Partial<{ firstName: string; lastName: string; email: string }>
  ): Promise<IAdminUserDocument> {
    const user = await AdminUser.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (data.email && data.email !== user.email) {
      const existing = await AdminUser.findByEmail(data.email);
      if (existing) {
        throw new ConflictError('Email already in use');
      }
    }

    Object.assign(user, data);
    await user.save();

    return user;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await AdminUser.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundError('User');
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);
  }

  /**
   * Deactivate user (admin only)
   */
  async deactivateUser(userId: string): Promise<void> {
    const user = await AdminUser.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User');
    }

    logger.info(`User deactivated: ${user.email}`);
  }

  /**
   * Activate user (admin only)
   */
  async activateUser(userId: string): Promise<void> {
    const user = await AdminUser.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User');
    }

    logger.info(`User activated: ${user.email}`);
  }

  /**
   * Get all admin users (admin only)
   */
  async getAllUsers(): Promise<IAdminUserDocument[]> {
    return AdminUser.find().sort({ createdAt: -1 });
  }

  /**
   * Update user role (admin only)
   */
  async updateRole(userId: string, role: UserRole): Promise<IAdminUserDocument> {
    const user = await AdminUser.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User');
    }

    logger.info(`User role updated: ${user.email} -> ${role}`);

    return user;
  }
}

export const authService = new AuthService();
