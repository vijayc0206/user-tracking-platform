import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  validateRequest,
  paginationSchema,
  dateRangeSchema,
  idParamSchema,
  mongoIdParamSchema,
} from '../../middlewares/validateRequest.js';
import { ValidationError } from '../../middlewares/errorHandler.js';

describe('ValidateRequest Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('validateRequest', () => {
    it('should validate body schema successfully', async () => {
      const bodySchema = z.object({
        name: z.string(),
        email: z.string().email(),
      });

      mockRequest.body = { name: 'Test', email: 'test@example.com' };

      const middleware = validateRequest({ body: bodySchema });
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({ name: 'Test', email: 'test@example.com' });
    });

    it('should call next with ValidationError on body validation failure', async () => {
      const bodySchema = z.object({
        name: z.string(),
        email: z.string().email(),
      });

      mockRequest.body = { name: 'Test', email: 'invalid-email' };

      const middleware = validateRequest({ body: bodySchema });
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should validate query schema successfully', async () => {
      const querySchema = z.object({
        page: z.string().optional(),
        limit: z.string().optional(),
      });

      mockRequest.query = { page: '1', limit: '10' };

      const middleware = validateRequest({ query: querySchema });
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate params schema successfully', async () => {
      const paramsSchema = z.object({
        id: z.string().min(1),
      });

      mockRequest.params = { id: 'user-123' };

      const middleware = validateRequest({ params: paramsSchema });
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with ValidationError on params validation failure', async () => {
      const paramsSchema = z.object({
        id: z.string().min(5),
      });

      mockRequest.params = { id: 'ab' };

      const middleware = validateRequest({ params: paramsSchema });
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should validate all schemas together', async () => {
      const bodySchema = z.object({ name: z.string() });
      const querySchema = z.object({ active: z.string().optional() });
      const paramsSchema = z.object({ id: z.string() });

      mockRequest.body = { name: 'Test' };
      mockRequest.query = { active: 'true' };
      mockRequest.params = { id: '123' };

      const middleware = validateRequest({
        body: bodySchema,
        query: querySchema,
        params: paramsSchema,
      });
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass non-Zod errors to next', async () => {
      const bodySchema = {
        parseAsync: jest.fn().mockRejectedValue(new Error('Unknown error')),
      } as unknown as z.ZodSchema;

      mockRequest.body = { name: 'Test' };

      const middleware = validateRequest({ body: bodySchema });
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('paginationSchema', () => {
    it('should parse valid pagination params', async () => {
      const result = await paginationSchema.parseAsync({
        page: '2',
        limit: '50',
        sortBy: 'createdAt',
        sortOrder: 'asc',
      });

      expect(result).toEqual({
        page: 2,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      });
    });

    it('should use defaults for missing params', async () => {
      const result = await paginationSchema.parseAsync({});

      expect(result).toEqual({
        page: 1,
        limit: 20,
        sortOrder: 'desc',
      });
    });

    it('should reject invalid page number', async () => {
      await expect(
        paginationSchema.parseAsync({ page: '0' })
      ).rejects.toThrow();
    });

    it('should reject limit over 100', async () => {
      await expect(
        paginationSchema.parseAsync({ limit: '101' })
      ).rejects.toThrow();
    });

    it('should reject invalid sortOrder', async () => {
      await expect(
        paginationSchema.parseAsync({ sortOrder: 'invalid' })
      ).rejects.toThrow();
    });
  });

  describe('dateRangeSchema', () => {
    it('should parse valid dates', async () => {
      const result = await dateRangeSchema.parseAsync({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it('should handle missing dates', async () => {
      const result = await dateRangeSchema.parseAsync({});

      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
    });

    it('should reject invalid date format', async () => {
      await expect(
        dateRangeSchema.parseAsync({ startDate: 'not-a-date' })
      ).rejects.toThrow();
    });
  });

  describe('idParamSchema', () => {
    it('should parse valid id', async () => {
      const result = await idParamSchema.parseAsync({ id: 'user-123' });

      expect(result).toEqual({ id: 'user-123' });
    });

    it('should reject empty id', async () => {
      await expect(idParamSchema.parseAsync({ id: '' })).rejects.toThrow();
    });
  });

  describe('mongoIdParamSchema', () => {
    it('should parse valid MongoDB ObjectId', async () => {
      const result = await mongoIdParamSchema.parseAsync({
        id: '507f1f77bcf86cd799439011',
      });

      expect(result).toEqual({ id: '507f1f77bcf86cd799439011' });
    });

    it('should reject invalid MongoDB ObjectId', async () => {
      await expect(
        mongoIdParamSchema.parseAsync({ id: 'invalid-id' })
      ).rejects.toThrow();
    });

    it('should reject ObjectId with wrong length', async () => {
      await expect(
        mongoIdParamSchema.parseAsync({ id: '507f1f77bcf86cd7994390' })
      ).rejects.toThrow();
    });
  });
});
