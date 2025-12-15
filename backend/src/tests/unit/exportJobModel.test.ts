import mongoose from 'mongoose';
import { ExportJob } from '../../models/ExportJob.js';

describe('ExportJob Model', () => {
  beforeEach(async () => {
    await ExportJob.deleteMany({});
  });

  describe('create', () => {
    it('should create an export job with required fields', async () => {
      const jobData = {
        jobId: 'job-001',
        type: 'DAILY_ANALYTICS',
        destination: 's3://bucket/path',
      };

      const job = await ExportJob.create(jobData);

      expect(job.jobId).toBe('job-001');
      expect(job.type).toBe('DAILY_ANALYTICS');
      expect(job.status).toBe('PENDING');
      expect(job.destination).toBe('s3://bucket/path');
      expect(job.recordsProcessed).toBe(0);
    });

    it('should create job with USER_DATA type', async () => {
      const job = await ExportJob.create({
        jobId: 'job-002',
        type: 'USER_DATA',
        destination: 's3://bucket/users',
      });

      expect(job.type).toBe('USER_DATA');
    });

    it('should create job with EVENT_DATA type', async () => {
      const job = await ExportJob.create({
        jobId: 'job-003',
        type: 'EVENT_DATA',
        destination: 's3://bucket/events',
      });

      expect(job.type).toBe('EVENT_DATA');
    });

    it('should fail with invalid type', async () => {
      const jobData = {
        jobId: 'job-004',
        type: 'INVALID_TYPE',
        destination: 's3://bucket/path',
      };

      await expect(ExportJob.create(jobData)).rejects.toThrow();
    });

    it('should fail without required jobId', async () => {
      const jobData = {
        type: 'DAILY_ANALYTICS',
        destination: 's3://bucket/path',
      };

      await expect(ExportJob.create(jobData)).rejects.toThrow();
    });

    it('should fail without required destination', async () => {
      const jobData = {
        jobId: 'job-005',
        type: 'DAILY_ANALYTICS',
      };

      await expect(ExportJob.create(jobData)).rejects.toThrow();
    });

    it('should enforce unique jobId', async () => {
      const jobData = {
        jobId: 'job-006',
        type: 'DAILY_ANALYTICS',
        destination: 's3://bucket/path',
      };

      await ExportJob.create(jobData);
      // Ensure indexes are synced before testing unique constraint
      await ExportJob.syncIndexes();
      await expect(ExportJob.create(jobData)).rejects.toThrow();
    });
  });

  describe('instance methods', () => {
    describe('markRunning', () => {
      it('should mark job as running', async () => {
        const job = await ExportJob.create({
          jobId: 'job-running-001',
          type: 'DAILY_ANALYTICS',
          destination: 's3://bucket/path',
        });

        const updatedJob = await job.markRunning();

        expect(updatedJob.status).toBe('RUNNING');
      });
    });

    describe('markCompleted', () => {
      it('should mark job as completed with records count', async () => {
        const job = await ExportJob.create({
          jobId: 'job-complete-001',
          type: 'DAILY_ANALYTICS',
          destination: 's3://bucket/path',
        });

        const updatedJob = await job.markCompleted(1000);

        expect(updatedJob.status).toBe('COMPLETED');
        expect(updatedJob.recordsProcessed).toBe(1000);
        expect(updatedJob.endTime).toBeDefined();
      });
    });

    describe('markFailed', () => {
      it('should mark job as failed with error message', async () => {
        const job = await ExportJob.create({
          jobId: 'job-failed-001',
          type: 'DAILY_ANALYTICS',
          destination: 's3://bucket/path',
        });

        const updatedJob = await job.markFailed('Connection timeout');

        expect(updatedJob.status).toBe('FAILED');
        expect(updatedJob.error).toBe('Connection timeout');
        expect(updatedJob.endTime).toBeDefined();
      });
    });
  });

  describe('static methods', () => {
    describe('getRecentJobs', () => {
      it('should return recent jobs sorted by startTime', async () => {
        await ExportJob.create({
          jobId: 'job-recent-001',
          type: 'DAILY_ANALYTICS',
          destination: 's3://bucket/path',
          startTime: new Date('2024-01-01'),
        });
        await ExportJob.create({
          jobId: 'job-recent-002',
          type: 'USER_DATA',
          destination: 's3://bucket/path',
          startTime: new Date('2024-01-02'),
        });

        const jobs = await ExportJob.getRecentJobs();

        expect(jobs).toHaveLength(2);
        expect(jobs[0].jobId).toBe('job-recent-002');
      });

      it('should filter by type', async () => {
        await ExportJob.create({
          jobId: 'job-type-001',
          type: 'DAILY_ANALYTICS',
          destination: 's3://bucket/path',
        });
        await ExportJob.create({
          jobId: 'job-type-002',
          type: 'USER_DATA',
          destination: 's3://bucket/path',
        });

        const jobs = await ExportJob.getRecentJobs('DAILY_ANALYTICS');

        expect(jobs).toHaveLength(1);
        expect(jobs[0].type).toBe('DAILY_ANALYTICS');
      });

      it('should respect limit parameter', async () => {
        for (let i = 0; i < 5; i++) {
          await ExportJob.create({
            jobId: `job-limit-${i}`,
            type: 'DAILY_ANALYTICS',
            destination: 's3://bucket/path',
          });
        }

        const jobs = await ExportJob.getRecentJobs(undefined, 3);

        expect(jobs).toHaveLength(3);
      });
    });

    describe('getPendingJobs', () => {
      it('should return only pending jobs', async () => {
        const pendingJob = await ExportJob.create({
          jobId: 'job-pending-001',
          type: 'DAILY_ANALYTICS',
          destination: 's3://bucket/path',
        });
        const runningJob = await ExportJob.create({
          jobId: 'job-pending-002',
          type: 'USER_DATA',
          destination: 's3://bucket/path',
        });
        await runningJob.markRunning();

        const jobs = await ExportJob.getPendingJobs();

        expect(jobs).toHaveLength(1);
        expect(jobs[0].jobId).toBe('job-pending-001');
      });
    });

    describe('getRunningJobs', () => {
      it('should return only running jobs', async () => {
        await ExportJob.create({
          jobId: 'job-running-stat-001',
          type: 'DAILY_ANALYTICS',
          destination: 's3://bucket/path',
        });
        const runningJob = await ExportJob.create({
          jobId: 'job-running-stat-002',
          type: 'USER_DATA',
          destination: 's3://bucket/path',
        });
        await runningJob.markRunning();

        const jobs = await ExportJob.getRunningJobs();

        expect(jobs).toHaveLength(1);
        expect(jobs[0].jobId).toBe('job-running-stat-002');
      });
    });
  });
});
