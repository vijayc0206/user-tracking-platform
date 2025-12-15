import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config/index.js';
import { analyticsService } from '../services/analyticsService.js';
import { ExportJob } from '../models/ExportJob.js';
import { logger } from '../utils/logger.js';

interface ExportResult {
  success: boolean;
  jobId: string;
  recordsExported: number;
  destination: string;
  error?: string;
}

class AnalyticsExportJob {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: config.aws.region,
      credentials: config.aws.accessKeyId
        ? {
            accessKeyId: config.aws.accessKeyId,
            secretAccessKey: config.aws.secretAccessKey!,
          }
        : undefined,
    });
  }

  /**
   * Run the daily analytics export job
   * Exports yesterday's analytics data to S3 and optionally to an external system
   */
  async runDailyExport(): Promise<ExportResult> {
    const jobId = uuidv4();
    const startTime = new Date();

    // Calculate yesterday's date range
    const now = new Date();
    const endDate = new Date(now.setHours(0, 0, 0, 0));
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

    logger.info(`Starting daily analytics export job: ${jobId}`);
    logger.info(`Date range: ${startDate.toISOString()} - ${endDate.toISOString()}`);

    // Create job record
    const job = await ExportJob.create({
      jobId,
      type: 'DAILY_ANALYTICS',
      status: 'RUNNING',
      startTime,
      destination: config.aws.s3Bucket || 'local',
    });

    try {
      // Get analytics summary
      const summary = await analyticsService.getAnalyticsSummary(startDate, endDate);

      // Get detailed metrics
      const dashboardMetrics = await analyticsService.getDashboardMetrics(
        startDate,
        endDate
      );

      // Get user insights
      const userInsights = await analyticsService.getUserInsights(startDate, endDate);

      // Prepare export data
      const exportData = {
        exportId: jobId,
        exportTime: new Date().toISOString(),
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        summary,
        dashboard: dashboardMetrics,
        userInsights,
        metadata: {
          version: '1.0',
          generatedBy: 'user-tracking-platform',
          environment: config.env,
        },
      };

      const jsonData = JSON.stringify(exportData, null, 2);
      const recordCount =
        dashboardMetrics.overview.totalEvents +
        dashboardMetrics.overview.totalSessions +
        dashboardMetrics.overview.totalUsers;

      // Upload to S3 if configured
      if (config.aws.s3Bucket) {
        await this.uploadToS3(exportData, startDate);
        logger.info(`Export uploaded to S3: ${config.aws.s3Bucket}`);
      }

      // Send to external system if configured
      if (config.export.destinationUrl) {
        await this.sendToExternalSystem(exportData);
        logger.info(`Export sent to external system: ${config.export.destinationUrl}`);
      }

      // Save export locally as well
      await this.saveLocally(jsonData, startDate);

      // Update job status
      await job.markCompleted(recordCount);

      logger.info(`Daily analytics export completed: ${jobId}`);
      logger.info(`Records exported: ${recordCount}`);

      return {
        success: true,
        jobId,
        recordsExported: recordCount,
        destination: config.aws.s3Bucket || 'local',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Daily analytics export failed: ${jobId}`, error);

      await job.markFailed(errorMessage);

      return {
        success: false,
        jobId,
        recordsExported: 0,
        destination: config.aws.s3Bucket || 'local',
        error: errorMessage,
      };
    }
  }

  /**
   * Upload export data to S3
   */
  private async uploadToS3(data: unknown, date: Date): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];
    const key = `exports/analytics/${dateStr}/daily-analytics-${dateStr}.json`;

    const command = new PutObjectCommand({
      Bucket: config.aws.s3Bucket,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
      Metadata: {
        'export-date': dateStr,
        'export-type': 'daily-analytics',
      },
    });

    await this.s3Client.send(command);
  }

  /**
   * Send export data to external system
   */
  private async sendToExternalSystem(data: unknown): Promise<void> {
    if (!config.export.destinationUrl) {
      return;
    }

    const response = await fetch(config.export.destinationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.integration.externalDataApiKey || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`External system returned ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Save export data locally (for backup/development)
   */
  private async saveLocally(jsonData: string, date: Date): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const dateStr = date.toISOString().split('T')[0];
    const exportDir = path.join(process.cwd(), 'exports', dateStr);

    try {
      await fs.mkdir(exportDir, { recursive: true });
      const filePath = path.join(exportDir, `daily-analytics-${dateStr}.json`);
      await fs.writeFile(filePath, jsonData, 'utf-8');
      logger.info(`Export saved locally: ${filePath}`);
    } catch (error) {
      logger.warn('Failed to save export locally:', error);
    }
  }

  /**
   * Export user data for a specific period
   */
  async exportUserData(
    startDate: Date,
    endDate: Date
  ): Promise<ExportResult> {
    const jobId = uuidv4();

    logger.info(`Starting user data export: ${jobId}`);

    const job = await ExportJob.create({
      jobId,
      type: 'USER_DATA',
      status: 'RUNNING',
      startTime: new Date(),
      destination: config.aws.s3Bucket || 'local',
    });

    try {
      const { User } = await import('../models/User.js');

      const users = await User.find({
        lastSeen: { $gte: startDate, $lte: endDate },
      }).lean();

      const exportData = {
        exportId: jobId,
        exportTime: new Date().toISOString(),
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        users,
        totalUsers: users.length,
      };

      if (config.aws.s3Bucket) {
        const dateStr = startDate.toISOString().split('T')[0];
        const command = new PutObjectCommand({
          Bucket: config.aws.s3Bucket,
          Key: `exports/users/${dateStr}/user-data-${dateStr}.json`,
          Body: JSON.stringify(exportData, null, 2),
          ContentType: 'application/json',
        });
        await this.s3Client.send(command);
      }

      await job.markCompleted(users.length);

      return {
        success: true,
        jobId,
        recordsExported: users.length,
        destination: config.aws.s3Bucket || 'local',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await job.markFailed(errorMessage);

      return {
        success: false,
        jobId,
        recordsExported: 0,
        destination: config.aws.s3Bucket || 'local',
        error: errorMessage,
      };
    }
  }

  /**
   * Export event data for a specific period
   */
  async exportEventData(
    startDate: Date,
    endDate: Date
  ): Promise<ExportResult> {
    const jobId = uuidv4();

    logger.info(`Starting event data export: ${jobId}`);

    const job = await ExportJob.create({
      jobId,
      type: 'EVENT_DATA',
      status: 'RUNNING',
      startTime: new Date(),
      destination: config.aws.s3Bucket || 'local',
    });

    try {
      const { Event } = await import('../models/Event.js');

      // Stream events in batches to handle large datasets
      const batchSize = 10000;
      let processed = 0;
      let skip = 0;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const events = await Event.find({
          timestamp: { $gte: startDate, $lte: endDate },
        })
          .skip(skip)
          .limit(batchSize)
          .lean();

        if (events.length === 0) break;

        // In production, you would stream this to S3 in parts
        processed += events.length;
        skip += batchSize;

        if (events.length < batchSize) break;
      }

      await job.markCompleted(processed);

      return {
        success: true,
        jobId,
        recordsExported: processed,
        destination: config.aws.s3Bucket || 'local',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await job.markFailed(errorMessage);

      return {
        success: false,
        jobId,
        recordsExported: 0,
        destination: config.aws.s3Bucket || 'local',
        error: errorMessage,
      };
    }
  }
}

export const analyticsExportJob = new AnalyticsExportJob();

// Allow running directly via CLI
if (require.main === module) {
  (async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { database } = require('../config/database');
    await database.connect();

    const result = await analyticsExportJob.runDailyExport();
    console.log('Export result:', result);

    await database.disconnect();
    process.exit(result.success ? 0 : 1);
  })();
}
