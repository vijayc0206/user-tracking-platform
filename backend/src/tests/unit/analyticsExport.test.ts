import { ExportJob } from '../../models/ExportJob.js';

// Mock dependencies before any imports that might use them
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
}));

jest.mock('../../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../config/index.js', () => ({
  config: {
    env: 'test',
    aws: {
      region: 'us-east-1',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
      s3Bucket: '',
    },
    export: {
      destinationUrl: '',
      cronSchedule: '0 10 * * *',
    },
    integration: {
      externalDataApiKey: 'test-api-key',
    },
  },
}));

jest.mock('../../services/analyticsService.js', () => ({
  analyticsService: {
    getAnalyticsSummary: jest.fn().mockResolvedValue({
      totalEvents: 100,
      totalSessions: 50,
      totalUsers: 25,
    }),
    getDashboardMetrics: jest.fn().mockResolvedValue({
      overview: {
        totalEvents: 100,
        totalSessions: 50,
        totalUsers: 25,
      },
    }),
    getUserInsights: jest.fn().mockResolvedValue({
      activeUsers: 20,
      newUsers: 5,
    }),
  },
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

describe('AnalyticsExportJob', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await ExportJob.deleteMany({});
  });

  describe('ExportJob Model Integration', () => {
    it('should create DAILY_ANALYTICS export job', async () => {
      const job = await ExportJob.create({
        jobId: 'test-daily-001',
        type: 'DAILY_ANALYTICS',
        status: 'PENDING',
        destination: 'local',
      });

      expect(job.jobId).toBe('test-daily-001');
      expect(job.type).toBe('DAILY_ANALYTICS');
      expect(job.status).toBe('PENDING');
    });

    it('should create USER_DATA export job', async () => {
      const job = await ExportJob.create({
        jobId: 'test-user-001',
        type: 'USER_DATA',
        status: 'PENDING',
        destination: 'local',
      });

      expect(job.jobId).toBe('test-user-001');
      expect(job.type).toBe('USER_DATA');
    });

    it('should create EVENT_DATA export job', async () => {
      const job = await ExportJob.create({
        jobId: 'test-event-001',
        type: 'EVENT_DATA',
        status: 'PENDING',
        destination: 'local',
      });

      expect(job.jobId).toBe('test-event-001');
      expect(job.type).toBe('EVENT_DATA');
    });

    it('should track job lifecycle (PENDING -> RUNNING -> COMPLETED)', async () => {
      const job = await ExportJob.create({
        jobId: 'lifecycle-test-001',
        type: 'DAILY_ANALYTICS',
        destination: 'local',
      });

      expect(job.status).toBe('PENDING');

      await job.markRunning();
      expect(job.status).toBe('RUNNING');

      await job.markCompleted(100);
      expect(job.status).toBe('COMPLETED');
      expect(job.recordsProcessed).toBe(100);
      expect(job.endTime).toBeDefined();
    });

    it('should track job failure', async () => {
      const job = await ExportJob.create({
        jobId: 'failure-test-001',
        type: 'DAILY_ANALYTICS',
        destination: 'local',
      });

      await job.markRunning();
      await job.markFailed('Connection timeout');

      expect(job.status).toBe('FAILED');
      expect(job.error).toBe('Connection timeout');
      expect(job.endTime).toBeDefined();
    });
  });

  describe('Export Job Static Methods', () => {
    it('should get recent jobs sorted by start time', async () => {
      await ExportJob.create({
        jobId: 'recent-001',
        type: 'DAILY_ANALYTICS',
        destination: 'local',
        startTime: new Date('2024-01-01'),
      });
      await ExportJob.create({
        jobId: 'recent-002',
        type: 'DAILY_ANALYTICS',
        destination: 'local',
        startTime: new Date('2024-01-02'),
      });

      const jobs = await ExportJob.getRecentJobs();

      expect(jobs.length).toBe(2);
      expect(jobs[0].jobId).toBe('recent-002'); // Most recent first
    });

    it('should filter recent jobs by type', async () => {
      await ExportJob.create({
        jobId: 'filter-001',
        type: 'DAILY_ANALYTICS',
        destination: 'local',
      });
      await ExportJob.create({
        jobId: 'filter-002',
        type: 'USER_DATA',
        destination: 'local',
      });

      const analyticsJobs = await ExportJob.getRecentJobs('DAILY_ANALYTICS');

      expect(analyticsJobs.length).toBe(1);
      expect(analyticsJobs[0].type).toBe('DAILY_ANALYTICS');
    });

    it('should get pending jobs', async () => {
      await ExportJob.create({
        jobId: 'pending-001',
        type: 'DAILY_ANALYTICS',
        destination: 'local',
      });
      const runningJob = await ExportJob.create({
        jobId: 'running-001',
        type: 'DAILY_ANALYTICS',
        destination: 'local',
      });
      await runningJob.markRunning();

      const pendingJobs = await ExportJob.getPendingJobs();

      expect(pendingJobs.length).toBe(1);
      expect(pendingJobs[0].jobId).toBe('pending-001');
    });

    it('should get running jobs', async () => {
      await ExportJob.create({
        jobId: 'pending-002',
        type: 'DAILY_ANALYTICS',
        destination: 'local',
      });
      const runningJob = await ExportJob.create({
        jobId: 'running-002',
        type: 'DAILY_ANALYTICS',
        destination: 'local',
      });
      await runningJob.markRunning();

      const runningJobs = await ExportJob.getRunningJobs();

      expect(runningJobs.length).toBe(1);
      expect(runningJobs[0].jobId).toBe('running-002');
    });
  });
});
