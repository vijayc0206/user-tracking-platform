import { createApp } from './app.js';
import { config } from './config/index.js';
import { database } from './config/database.js';
import { logger } from './utils/logger.js';
import { startScheduledJobs } from './jobs/scheduler.js';

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await database.connect();
    logger.info('Database connected successfully');

    // Create Express app
    const app = createApp();

    // Start scheduled jobs
    if (config.env !== 'test') {
      startScheduledJobs();
      logger.info('Scheduled jobs started');
    }

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`
========================================
🚀 Server started successfully!
========================================
Environment: ${config.env}
Port: ${config.port}
API Docs: http://localhost:${config.port}/api/docs
Health: http://localhost:${config.port}/health
========================================
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await database.disconnect();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
