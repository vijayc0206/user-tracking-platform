import { Request, Response } from 'express';
import { healthController } from '../../controllers/healthController.js';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

// Mock mongoose
jest.mock('mongoose', () => ({
  connection: {
    readyState: 1,
    db: {
      admin: () => ({
        ping: jest.fn().mockResolvedValue({}),
      }),
    },
  },
}));

describe('HealthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should return healthy status', async () => {
      await healthController.check(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          status: 'healthy',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('detailedCheck', () => {
    it('should return detailed health status when database is connected', async () => {
      // Mock connected state
      (mongoose.connection as any).readyState = 1;

      await healthController.detailedCheck(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          version: expect.any(String),
          services: expect.objectContaining({
            database: expect.objectContaining({
              status: 'connected',
            }),
            memory: expect.objectContaining({
              heapUsed: expect.any(Number),
              heapTotal: expect.any(Number),
              rss: expect.any(Number),
              external: expect.any(Number),
            }),
            cpu: expect.objectContaining({
              user: expect.any(Number),
              system: expect.any(Number),
            }),
          }),
        }),
        meta: expect.objectContaining({
          responseTime: expect.any(Number),
        }),
      });
    });

    it('should return unhealthy status when database is disconnected', async () => {
      // Mock disconnected state
      (mongoose.connection as any).readyState = 0;

      await healthController.detailedCheck(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.SERVICE_UNAVAILABLE);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          data: expect.objectContaining({
            status: 'unhealthy',
            services: expect.objectContaining({
              database: expect.objectContaining({
                status: 'disconnected',
              }),
            }),
          }),
        })
      );
    });

    it('should return connecting status when database is connecting', async () => {
      // Mock connecting state
      (mongoose.connection as any).readyState = 2;

      await healthController.detailedCheck(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            services: expect.objectContaining({
              database: expect.objectContaining({
                status: 'connecting',
              }),
            }),
          }),
        })
      );
    });
  });

  describe('readiness', () => {
    it('should return ready when database is connected', async () => {
      (mongoose.connection as any).readyState = 1;

      await healthController.readiness(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { ready: true },
      });
    });

    it('should return not ready when database is disconnected', async () => {
      (mongoose.connection as any).readyState = 0;

      await healthController.readiness(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.SERVICE_UNAVAILABLE);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        data: { ready: false },
      });
    });

    it('should return not ready when database is connecting', async () => {
      (mongoose.connection as any).readyState = 2;

      await healthController.readiness(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.SERVICE_UNAVAILABLE);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        data: { ready: false },
      });
    });
  });

  describe('liveness', () => {
    it('should return alive', async () => {
      await healthController.liveness(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { alive: true },
      });
    });
  });
});
