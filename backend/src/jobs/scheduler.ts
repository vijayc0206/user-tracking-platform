import cron from 'node-cron';
import { config } from '../config/index.js';
import { analyticsExportJob } from './analyticsExport.js';
import { sessionService } from '../services/sessionService.js';
import { logger } from '../utils/logger.js';

/**
 * Schedule and manage all background jobs
 */
export const startScheduledJobs = (): void => {
  logger.info('Initializing scheduled jobs...');

  // Daily Analytics Export - Run at 10:00 UTC
  // Cron: minute hour day-of-month month day-of-week
  cron.schedule(
    config.export.cronSchedule, // Default: '0 10 * * *'
    async () => {
      logger.info('Starting scheduled daily analytics export...');
      try {
        const result = await analyticsExportJob.runDailyExport();
        if (result.success) {
          logger.info(
            `Daily analytics export completed. Records: ${result.recordsExported}`
          );
        } else {
          logger.error(`Daily analytics export failed: ${result.error}`);
        }
      } catch (error) {
        logger.error('Daily analytics export job error:', error);
      }
    },
    {
      timezone: 'UTC',
    }
  );
  logger.info(`Daily analytics export scheduled at: ${config.export.cronSchedule} UTC`);

  // Session Cleanup - Run every 15 minutes to expire inactive sessions
  cron.schedule(
    '*/15 * * * *', // Every 15 minutes
    async () => {
      logger.debug('Running session cleanup job...');
      try {
        const expiredCount = await sessionService.expireInactiveSessions(30);
        if (expiredCount > 0) {
          logger.info(`Session cleanup: expired ${expiredCount} inactive sessions`);
        }
      } catch (error) {
        logger.error('Session cleanup job error:', error);
      }
    },
    {
      timezone: 'UTC',
    }
  );
  logger.info('Session cleanup job scheduled: every 15 minutes');

  // Hourly Health Check - Log system health metrics
  cron.schedule(
    '0 * * * *', // Every hour
    async () => {
      const memoryUsage = process.memoryUsage();
      logger.info('Hourly health check:', {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        uptime: `${Math.round(process.uptime() / 60)} minutes`,
      });
    },
    {
      timezone: 'UTC',
    }
  );
  logger.info('Hourly health check scheduled');

  // Weekly User Data Export - Run every Sunday at 02:00 UTC
  cron.schedule(
    '0 2 * * 0', // Sunday at 02:00 UTC
    async () => {
      logger.info('Starting weekly user data export...');
      try {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

        const result = await analyticsExportJob.exportUserData(startDate, endDate);
        if (result.success) {
          logger.info(
            `Weekly user data export completed. Records: ${result.recordsExported}`
          );
        } else {
          logger.error(`Weekly user data export failed: ${result.error}`);
        }
      } catch (error) {
        logger.error('Weekly user data export job error:', error);
      }
    },
    {
      timezone: 'UTC',
    }
  );
  logger.info('Weekly user data export scheduled: Sunday at 02:00 UTC');

  // Monthly Event Data Export - Run on the 1st of each month at 03:00 UTC
  cron.schedule(
    '0 3 1 * *', // 1st of each month at 03:00 UTC
    async () => {
      logger.info('Starting monthly event data export...');
      try {
        const endDate = new Date();
        endDate.setDate(1);
        endDate.setHours(0, 0, 0, 0);

        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);

        const result = await analyticsExportJob.exportEventData(startDate, endDate);
        if (result.success) {
          logger.info(
            `Monthly event data export completed. Records: ${result.recordsExported}`
          );
        } else {
          logger.error(`Monthly event data export failed: ${result.error}`);
        }
      } catch (error) {
        logger.error('Monthly event data export job error:', error);
      }
    },
    {
      timezone: 'UTC',
    }
  );
  logger.info('Monthly event data export scheduled: 1st of each month at 03:00 UTC');

  logger.info('All scheduled jobs initialized successfully');
};

/**
 * Stop all scheduled jobs (for graceful shutdown)
 */
export const stopScheduledJobs = (): void => {
  logger.info('Stopping all scheduled jobs...');
  // node-cron tasks are automatically stopped when the process exits
  // If you need explicit control, store task references and call task.stop()
};
