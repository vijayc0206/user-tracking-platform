import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { asyncHandler } from '../middlewares/errorHandler.js';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'connecting';
      latency?: number;
    };
    memory: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
      external: number;
    };
    cpu: {
      user: number;
      system: number;
    };
  };
}

class HealthController {
  /**
   * @swagger
   * /api/v1/health:
   *   get:
   *     summary: Basic health check
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is healthy
   */
  check = asyncHandler(async (_req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * @swagger
   * /api/v1/health/detailed:
   *   get:
   *     summary: Detailed health check
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Detailed health status
   */
  detailedCheck = asyncHandler(async (_req: Request, res: Response) => {
    const startTime = Date.now();

    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    const dbStateMap: Record<number, 'disconnected' | 'connected' | 'connecting'> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnected',
    };

    // Measure database latency
    let dbLatency: number | undefined;
    if (dbState === 1) {
      const dbStart = Date.now();
      await mongoose.connection.db?.admin().ping();
      dbLatency = Date.now() - dbStart;
    }

    // Get memory usage
    const memoryUsage = process.memoryUsage();

    // Get CPU usage
    const cpuUsage = process.cpuUsage();

    // Determine overall status
    let overallStatus: HealthStatus['status'] = 'healthy';
    if (dbState !== 1) {
      overallStatus = 'unhealthy';
    } else if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9) {
      overallStatus = 'degraded';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: {
          status: dbStateMap[dbState] || 'disconnected',
          latency: dbLatency,
        },
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
        },
        cpu: {
          user: Math.round(cpuUsage.user / 1000),
          system: Math.round(cpuUsage.system / 1000),
        },
      },
    };

    const statusCode =
      overallStatus === 'healthy'
        ? StatusCodes.OK
        : overallStatus === 'degraded'
        ? StatusCodes.OK
        : StatusCodes.SERVICE_UNAVAILABLE;

    res.status(statusCode).json({
      success: overallStatus !== 'unhealthy',
      data: healthStatus,
      meta: {
        responseTime: Date.now() - startTime,
      },
    });
  });

  /**
   * @swagger
   * /api/v1/health/ready:
   *   get:
   *     summary: Readiness probe
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is ready
   *       503:
   *         description: Service is not ready
   */
  readiness = asyncHandler(async (_req: Request, res: Response) => {
    const isReady = mongoose.connection.readyState === 1;

    if (isReady) {
      res.status(StatusCodes.OK).json({
        success: true,
        data: { ready: true },
      });
    } else {
      res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        success: false,
        data: { ready: false },
      });
    }
  });

  /**
   * @swagger
   * /api/v1/health/live:
   *   get:
   *     summary: Liveness probe
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is alive
   */
  liveness = asyncHandler(async (_req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({
      success: true,
      data: { alive: true },
    });
  });
}

export const healthController = new HealthController();
