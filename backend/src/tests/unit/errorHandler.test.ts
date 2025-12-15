import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError, ZodIssue } from 'zod';
import {
  errorHandler,
  asyncHandler,
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../../middlewares/errorHandler.js';

// Mock the logger
jest.mock('../../utils/logger.js', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRequest = {
      path: '/test',
      method: 'GET',
    };
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('Custom Error Classes', () => {
    describe('AppError', () => {
      it('should create AppError with default values', () => {
        const error = new AppError('Test error');
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(error.code).toBe('INTERNAL_ERROR');
        expect(error.isOperational).toBe(true);
      });

      it('should create AppError with custom values', () => {
        const error = new AppError('Custom error', StatusCodes.BAD_REQUEST, 'CUSTOM_ERROR', { field: 'test' });
        expect(error.message).toBe('Custom error');
        expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(error.code).toBe('CUSTOM_ERROR');
        expect(error.details).toEqual({ field: 'test' });
      });
    });

    describe('NotFoundError', () => {
      it('should create NotFoundError with default resource', () => {
        const error = new NotFoundError();
        expect(error.message).toBe('Resource not found');
        expect(error.statusCode).toBe(StatusCodes.NOT_FOUND);
        expect(error.code).toBe('NOT_FOUND');
      });

      it('should create NotFoundError with custom resource', () => {
        const error = new NotFoundError('User');
        expect(error.message).toBe('User not found');
      });
    });

    describe('ValidationError', () => {
      it('should create ValidationError', () => {
        const error = new ValidationError('Invalid input', { field: 'email' });
        expect(error.message).toBe('Invalid input');
        expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.details).toEqual({ field: 'email' });
      });
    });

    describe('UnauthorizedError', () => {
      it('should create UnauthorizedError with default message', () => {
        const error = new UnauthorizedError();
        expect(error.message).toBe('Unauthorized access');
        expect(error.statusCode).toBe(StatusCodes.UNAUTHORIZED);
        expect(error.code).toBe('UNAUTHORIZED');
      });

      it('should create UnauthorizedError with custom message', () => {
        const error = new UnauthorizedError('Token expired');
        expect(error.message).toBe('Token expired');
      });
    });

    describe('ForbiddenError', () => {
      it('should create ForbiddenError with default message', () => {
        const error = new ForbiddenError();
        expect(error.message).toBe('Access forbidden');
        expect(error.statusCode).toBe(StatusCodes.FORBIDDEN);
        expect(error.code).toBe('FORBIDDEN');
      });

      it('should create ForbiddenError with custom message', () => {
        const error = new ForbiddenError('Admin access required');
        expect(error.message).toBe('Admin access required');
      });
    });

    describe('ConflictError', () => {
      it('should create ConflictError with default message', () => {
        const error = new ConflictError();
        expect(error.message).toBe('Resource already exists');
        expect(error.statusCode).toBe(StatusCodes.CONFLICT);
        expect(error.code).toBe('CONFLICT');
      });

      it('should create ConflictError with custom message', () => {
        const error = new ConflictError('Email already registered');
        expect(error.message).toBe('Email already registered');
      });
    });
  });

  describe('errorHandler middleware', () => {
    it('should handle AppError', () => {
      const error = new AppError('Test error', StatusCodes.BAD_REQUEST, 'TEST_ERROR');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error',
          details: undefined,
        },
      });
    });

    it('should handle ZodError', () => {
      const zodIssues: ZodIssue[] = [
        { code: 'invalid_type', expected: 'string', received: 'number', path: ['email'], message: 'Expected string' },
      ];
      const error = new ZodError(zodIssues);

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ field: 'email', message: 'Expected string' }],
        },
      });
    });

    it('should handle MongoDB duplicate key error', () => {
      const error = { code: 11000, message: 'Duplicate key error' } as unknown as Error;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.CONFLICT);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DUPLICATE_KEY',
          message: 'A resource with this identifier already exists',
        },
      });
    });

    it('should handle MongoDB validation error', () => {
      const error = new Error('Path `email` is required');
      error.name = 'ValidationError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Path `email` is required',
        },
      });
    });

    it('should handle JsonWebTokenError', () => {
      const error = new Error('jwt malformed');
      error.name = 'JsonWebTokenError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
        },
      });
    });

    it('should handle TokenExpiredError', () => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
        },
      });
    });

    it('should handle generic error in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Something went wrong');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
        },
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle generic error in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Internal details');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle NotFoundError', () => {
      const error = new NotFoundError('User');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          details: undefined,
        },
      });
    });

    it('should handle UnauthorizedError', () => {
      const error = new UnauthorizedError('Invalid credentials');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
          details: undefined,
        },
      });
    });

    it('should handle ForbiddenError', () => {
      const error = new ForbiddenError('Access denied');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
          details: undefined,
        },
      });
    });
  });

  describe('asyncHandler', () => {
    it('should pass successful async function result', async () => {
      const mockHandler = jest.fn().mockResolvedValue('success');
      const wrapped = asyncHandler(mockHandler);

      await wrapped(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch async errors and pass to next', async () => {
      const testError = new Error('Async error');
      const mockHandler = jest.fn().mockRejectedValue(testError);
      const wrapped = asyncHandler(mockHandler);

      await wrapped(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should handle synchronous errors in async functions', async () => {
      const testError = new Error('Sync error in async');
      const mockHandler = jest.fn().mockImplementation(async () => {
        throw testError;
      });
      const wrapped = asyncHandler(mockHandler);

      await wrapped(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(testError);
    });
  });
});
