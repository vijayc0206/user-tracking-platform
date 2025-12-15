import { Session } from '../../models/Session.js';
import { User } from '../../models/User.js';
import { sessionService } from '../../services/sessionService.js';
import { SessionStatus } from '../../types/index.js';
import { NotFoundError } from '../../middlewares/errorHandler.js';

describe('SessionService', () => {
  beforeEach(async () => {
    // Create test user
    await User.create({
      visitorId: 'test-user',
      firstSeen: new Date(),
      lastSeen: new Date(),
    });
  });

  describe('create', () => {
    it('should create a new session', async () => {
      const session = await sessionService.create({
        userId: 'test-user',
        device: 'Desktop',
        browser: 'Chrome',
        os: 'Windows',
        country: 'US',
        entryPage: 'https://example.com/home',
      });

      expect(session).toBeDefined();
      expect(session.sessionId).toBeDefined();
      expect(session.userId).toBe('test-user');
      expect(session.status).toBe(SessionStatus.ACTIVE);
      expect(session.device).toBe('Desktop');
      expect(session.browser).toBe('Chrome');
      expect(session.os).toBe('Windows');
      expect(session.country).toBe('US');
      expect(session.entryPage).toBe('https://example.com/home');
      expect(session.pageViews).toBe(1);
    });

    it('should create session without entry page', async () => {
      const session = await sessionService.create({
        userId: 'test-user',
      });

      expect(session).toBeDefined();
      expect(session.pageViews).toBe(0);
    });
  });

  describe('getBySessionId', () => {
    it('should return session by session ID', async () => {
      const created = await sessionService.create({
        userId: 'test-user',
      });

      const found = await sessionService.getBySessionId(created.sessionId);

      expect(found.sessionId).toBe(created.sessionId);
    });

    it('should throw NotFoundError for non-existent session', async () => {
      await expect(sessionService.getBySessionId('non-existent')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('getByUserId', () => {
    it('should return sessions for a user', async () => {
      await sessionService.create({ userId: 'session-user' });
      await sessionService.create({ userId: 'session-user' });

      const sessions = await sessionService.getByUserId('session-user');

      expect(sessions.length).toBe(2);
    });

    it('should respect limit parameter', async () => {
      await sessionService.create({ userId: 'limit-user' });
      await sessionService.create({ userId: 'limit-user' });
      await sessionService.create({ userId: 'limit-user' });

      const sessions = await sessionService.getByUserId('limit-user', 2);

      expect(sessions.length).toBe(2);
    });
  });

  describe('endSession', () => {
    it('should end an active session', async () => {
      const created = await sessionService.create({
        userId: 'test-user',
        entryPage: 'https://example.com/start',
      });

      const ended = await sessionService.endSession(
        created.sessionId,
        'https://example.com/end'
      );

      expect(ended.status).toBe(SessionStatus.ENDED);
      expect(ended.exitPage).toBe('https://example.com/end');
      expect(ended.endTime).toBeDefined();
      expect(ended.duration).toBeGreaterThanOrEqual(0);
    });

    it('should throw NotFoundError for non-existent session', async () => {
      await expect(
        sessionService.endSession('non-existent')
      ).rejects.toThrow(NotFoundError);
    });

    it('should return session if already ended', async () => {
      const created = await sessionService.create({ userId: 'test-user' });
      await sessionService.endSession(created.sessionId);

      const result = await sessionService.endSession(created.sessionId);

      expect(result.status).toBe(SessionStatus.ENDED);
    });
  });

  describe('incrementPageViews', () => {
    it('should increment page views', async () => {
      const created = await sessionService.create({
        userId: 'test-user',
        entryPage: 'https://example.com',
      });

      expect(created.pageViews).toBe(1);

      const updated = await sessionService.incrementPageViews(created.sessionId);

      expect(updated.pageViews).toBe(2);
    });

    it('should throw NotFoundError for non-existent session', async () => {
      await expect(
        sessionService.incrementPageViews('non-existent')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      const baseTime = Date.now();

      await Session.create([
        {
          sessionId: 'search-1',
          userId: 'user-1',
          status: SessionStatus.ACTIVE,
          startTime: new Date(baseTime),
          device: 'Desktop',
          country: 'US',
        },
        {
          sessionId: 'search-2',
          userId: 'user-1',
          status: SessionStatus.ENDED,
          startTime: new Date(baseTime + 1000),
          device: 'Mobile',
          country: 'UK',
        },
        {
          sessionId: 'search-3',
          userId: 'user-2',
          status: SessionStatus.ACTIVE,
          startTime: new Date(baseTime + 2000),
          device: 'Desktop',
          country: 'US',
        },
      ]);
    });

    it('should return paginated sessions', async () => {
      const result = await sessionService.search({ page: 1, limit: 2 });

      expect(result.sessions.length).toBe(2);
      expect(result.total).toBe(3);
      expect(result.pages).toBe(2);
    });

    it('should filter by userId', async () => {
      const result = await sessionService.search({ userId: 'user-1' });

      expect(result.sessions.length).toBe(2);
      expect(result.sessions.every((s) => s.userId === 'user-1')).toBe(true);
    });

    it('should filter by status', async () => {
      const result = await sessionService.search({ status: SessionStatus.ACTIVE });

      expect(result.sessions.length).toBe(2);
      expect(result.sessions.every((s) => s.status === SessionStatus.ACTIVE)).toBe(
        true
      );
    });

    it('should filter by device', async () => {
      const result = await sessionService.search({ device: 'Desktop' });

      expect(result.sessions.length).toBe(2);
    });

    it('should filter by country', async () => {
      const result = await sessionService.search({ country: 'UK' });

      expect(result.sessions.length).toBe(1);
      expect(result.sessions[0].country).toBe('UK');
    });
  });

  describe('getActiveSessions', () => {
    it('should return only active sessions', async () => {
      await Session.create([
        {
          sessionId: 'active-1',
          userId: 'user-1',
          status: SessionStatus.ACTIVE,
          startTime: new Date(),
        },
        {
          sessionId: 'ended-1',
          userId: 'user-2',
          status: SessionStatus.ENDED,
          startTime: new Date(),
        },
      ]);

      const activeSessions = await sessionService.getActiveSessions();

      expect(activeSessions.length).toBe(1);
      expect(activeSessions[0].status).toBe(SessionStatus.ACTIVE);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      const now = new Date();

      await Session.create([
        {
          sessionId: 'stats-1',
          userId: 'user-1',
          status: SessionStatus.ACTIVE,
          startTime: now,
          device: 'Desktop',
          country: 'US',
          pageViews: 5,
          duration: 300,
        },
        {
          sessionId: 'stats-2',
          userId: 'user-2',
          status: SessionStatus.ENDED,
          startTime: now,
          device: 'Mobile',
          country: 'UK',
          pageViews: 1,
          duration: 60,
        },
      ]);
    });

    it('should return session statistics', async () => {
      const startDate = new Date(Date.now() - 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 60 * 60 * 1000);

      const stats = await sessionService.getStats(startDate, endDate);

      expect(stats.totalSessions).toBe(2);
      expect(stats.activeSessions).toBe(1);
      expect(stats.sessionsByDevice).toBeDefined();
      expect(stats.sessionsByCountry).toBeDefined();
    });
  });

  describe('deleteByUserId', () => {
    it('should delete all sessions for a user', async () => {
      await Session.create([
        {
          sessionId: 'delete-1',
          userId: 'delete-user',
          status: SessionStatus.ACTIVE,
          startTime: new Date(),
        },
        {
          sessionId: 'delete-2',
          userId: 'delete-user',
          status: SessionStatus.ENDED,
          startTime: new Date(),
        },
        {
          sessionId: 'keep-1',
          userId: 'other-user',
          status: SessionStatus.ACTIVE,
          startTime: new Date(),
        },
      ]);

      const deletedCount = await sessionService.deleteByUserId('delete-user');

      expect(deletedCount).toBe(2);

      const remaining = await Session.find({});
      expect(remaining.length).toBe(1);
      expect(remaining[0].userId).toBe('other-user');
    });
  });

  describe('deleteOldSessions', () => {
    it('should delete sessions before a date', async () => {
      const oldDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentDate = new Date();

      await Session.create([
        {
          sessionId: 'old-1',
          userId: 'user-1',
          status: SessionStatus.ENDED,
          startTime: oldDate,
        },
        {
          sessionId: 'recent-1',
          userId: 'user-2',
          status: SessionStatus.ACTIVE,
          startTime: recentDate,
        },
      ]);

      const deletedCount = await sessionService.deleteOldSessions(
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      expect(deletedCount).toBe(1);

      const remaining = await Session.find({});
      expect(remaining.length).toBe(1);
      expect(remaining[0].sessionId).toBe('recent-1');
    });
  });
});
