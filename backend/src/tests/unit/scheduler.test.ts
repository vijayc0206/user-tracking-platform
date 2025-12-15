import cron from 'node-cron';

// Mock node-cron before importing scheduler
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

// Mock logger
jest.mock('../../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock config
jest.mock('../../config/index.js', () => ({
  config: {
    export: {
      cronSchedule: '0 10 * * *',
    },
  },
}));

// Mock analyticsExportJob
jest.mock('../../jobs/analyticsExport.js', () => ({
  analyticsExportJob: {
    runDailyExport: jest.fn().mockResolvedValue({ success: true, recordsExported: 100 }),
    exportUserData: jest.fn().mockResolvedValue({ success: true, recordsExported: 50 }),
    exportEventData: jest.fn().mockResolvedValue({ success: true, recordsExported: 1000 }),
  },
}));

// Mock sessionService
jest.mock('../../services/sessionService.js', () => ({
  sessionService: {
    expireInactiveSessions: jest.fn().mockResolvedValue(5),
  },
}));

// Import after mocks are set up
import { startScheduledJobs, stopScheduledJobs } from '../../jobs/scheduler.js';

describe('Scheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startScheduledJobs', () => {
    it('should schedule daily analytics export', () => {
      startScheduledJobs();

      // Check that cron.schedule was called with daily analytics export
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 10 * * *',
        expect.any(Function),
        expect.objectContaining({ timezone: 'UTC' })
      );
    });

    it('should schedule session cleanup every 15 minutes', () => {
      startScheduledJobs();

      // Check that cron.schedule was called with session cleanup schedule
      expect(cron.schedule).toHaveBeenCalledWith(
        '*/15 * * * *',
        expect.any(Function),
        expect.objectContaining({ timezone: 'UTC' })
      );
    });

    it('should schedule hourly health check', () => {
      startScheduledJobs();

      // Check that cron.schedule was called with hourly health check
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 * * * *',
        expect.any(Function),
        expect.objectContaining({ timezone: 'UTC' })
      );
    });

    it('should schedule weekly user data export', () => {
      startScheduledJobs();

      // Check that cron.schedule was called with weekly user data export (Sunday at 02:00)
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 2 * * 0',
        expect.any(Function),
        expect.objectContaining({ timezone: 'UTC' })
      );
    });

    it('should schedule monthly event data export', () => {
      startScheduledJobs();

      // Check that cron.schedule was called with monthly event data export (1st of month at 03:00)
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 3 1 * *',
        expect.any(Function),
        expect.objectContaining({ timezone: 'UTC' })
      );
    });

    it('should schedule all 5 jobs', () => {
      startScheduledJobs();

      // Should have 5 scheduled jobs:
      // 1. Daily analytics export
      // 2. Session cleanup (every 15 min)
      // 3. Hourly health check
      // 4. Weekly user data export
      // 5. Monthly event data export
      expect(cron.schedule).toHaveBeenCalledTimes(5);
    });
  });

  describe('stopScheduledJobs', () => {
    it('should be exported and callable', () => {
      expect(stopScheduledJobs).toBeDefined();
      expect(typeof stopScheduledJobs).toBe('function');

      // Should not throw
      expect(() => stopScheduledJobs()).not.toThrow();
    });
  });

  describe('cron schedule patterns', () => {
    it('should use correct pattern for daily export (10:00 UTC)', () => {
      startScheduledJobs();

      const calls = (cron.schedule as jest.Mock).mock.calls;
      const dailyExportCall = calls.find((call) => call[0] === '0 10 * * *');

      expect(dailyExportCall).toBeDefined();
    });

    it('should use correct pattern for session cleanup (every 15 min)', () => {
      startScheduledJobs();

      const calls = (cron.schedule as jest.Mock).mock.calls;
      const sessionCleanupCall = calls.find((call) => call[0] === '*/15 * * * *');

      expect(sessionCleanupCall).toBeDefined();
    });

    it('should use correct pattern for hourly health check', () => {
      startScheduledJobs();

      const calls = (cron.schedule as jest.Mock).mock.calls;
      const hourlyCall = calls.find((call) => call[0] === '0 * * * *');

      expect(hourlyCall).toBeDefined();
    });

    it('should use correct pattern for weekly user export (Sunday 02:00)', () => {
      startScheduledJobs();

      const calls = (cron.schedule as jest.Mock).mock.calls;
      const weeklyCall = calls.find((call) => call[0] === '0 2 * * 0');

      expect(weeklyCall).toBeDefined();
    });

    it('should use correct pattern for monthly event export (1st at 03:00)', () => {
      startScheduledJobs();

      const calls = (cron.schedule as jest.Mock).mock.calls;
      const monthlyCall = calls.find((call) => call[0] === '0 3 1 * *');

      expect(monthlyCall).toBeDefined();
    });

    it('should use UTC timezone for all schedules', () => {
      startScheduledJobs();

      const calls = (cron.schedule as jest.Mock).mock.calls;
      const allUseUTC = calls.every((call) => call[2]?.timezone === 'UTC');

      expect(allUseUTC).toBe(true);
    });
  });
});
