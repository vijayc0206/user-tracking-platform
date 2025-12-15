import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  authenticate,
  optionalAuth,
  authorize,
  generateTokens,
  verifyRefreshToken,
} from '../../middlewares/auth.js';
import { AdminUser } from '../../models/AdminUser.js';
import { config } from '../../config/index.js';
import { AuthenticatedRequest, UserRole } from '../../types/index.js';
import { UnauthorizedError, ForbiddenError } from '../../middlewares/errorHandler.js';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../models/AdminUser.js');
jest.mock('../../config/index.js', () => ({
  config: {
    jwt: {
      secret: 'test-secret',
      refreshSecret: 'test-refresh-secret',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
    },
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid token successfully', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@example.com',
        role: UserRole.ADMIN,
        isActive: true,
      };
      const mockDecoded = {
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.ADMIN,
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };

      mockRequest.headers = { authorization: 'Bearer valid-token' };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);
      (AdminUser.findById as jest.Mock).mockResolvedValue(mockUser);

      await authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', config.jwt.secret);
      expect(AdminUser.findById).toHaveBeenCalledWith('user-id');
      expect(mockRequest.user).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.ADMIN,
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject request without authorization header', async () => {
      mockRequest.headers = {};

      await authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should reject request without Bearer prefix', async () => {
      mockRequest.headers = { authorization: 'invalid-token' };

      await authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should reject when user no longer exists', async () => {
      const mockDecoded = {
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.ADMIN,
      };

      mockRequest.headers = { authorization: 'Bearer valid-token' };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);
      (AdminUser.findById as jest.Mock).mockResolvedValue(null);

      await authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should reject when user is deactivated', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@example.com',
        role: UserRole.ADMIN,
        isActive: false,
      };
      const mockDecoded = {
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.ADMIN,
      };

      mockRequest.headers = { authorization: 'Bearer valid-token' };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);
      (AdminUser.findById as jest.Mock).mockResolvedValue(mockUser);

      await authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should handle invalid JWT error', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      await authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should handle expired JWT error', async () => {
      mockRequest.headers = { authorization: 'Bearer expired-token' };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('token expired', new Date());
      });

      await authenticate(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('optionalAuth', () => {
    it('should continue without auth if no token provided', async () => {
      mockRequest.headers = {};

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should attach user if valid token provided', async () => {
      const mockDecoded = {
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.VIEWER,
      };

      mockRequest.headers = { authorization: 'Bearer valid-token' };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.VIEWER,
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without error if token is invalid', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid token');
      });

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('authorize', () => {
    it('should allow authorized role', () => {
      mockRequest.user = {
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.ADMIN,
      };

      const middleware = authorize(UserRole.ADMIN, UserRole.VIEWER);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject unauthorized role', () => {
      mockRequest.user = {
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.VIEWER,
      };

      const middleware = authorize(UserRole.ADMIN);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should reject when no user is authenticated', () => {
      mockRequest.user = undefined;

      const middleware = authorize(UserRole.ADMIN);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should allow multiple roles', () => {
      mockRequest.user = {
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.VIEWER,
      };

      const middleware = authorize(UserRole.ADMIN, UserRole.VIEWER, UserRole.ANALYST);
      middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      (jwt.sign as jest.Mock).mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const user = {
        id: 'user-id',
        email: 'test@example.com',
        role: UserRole.ADMIN,
      };

      const tokens = generateTokens(user);

      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: user.id },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );
      expect(tokens).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'user-id' });

      const result = verifyRefreshToken('valid-refresh-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', config.jwt.refreshSecret);
      expect(result).toEqual({ id: 'user-id' });
    });

    it('should throw on invalid refresh token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid token');
      });

      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });
  });
});
