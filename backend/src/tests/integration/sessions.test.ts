import request from 'supertest';
import { createApp } from '../../app.js';
import { User } from '../../models/User.js';
import { Session } from '../../models/Session.js';
import { Application } from 'express';
import { SessionStatus } from '../../types/index.js';

describe('Sessions API Integration Tests', () => {
  let app: Application;
  let accessToken: string;

  beforeAll(async () => {
    app = createApp();

    // Create test admin user and get token
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'sessionadmin@example.com',
        password: 'password123',
        firstName: 'Session',
        lastName: 'Admin',
      });

    accessToken = response.body.data.accessToken;
  });

  beforeEach(async () => {
    // Create test user for sessions
    await User.create({
      visitorId: 'session-test-user',
      firstSeen: new Date(),
      lastSeen: new Date(),
    });
  });

  describe('POST /api/v1/sessions', () => {
    it('should create a new session', async () => {
      const response = await request(app)
        .post('/api/v1/sessions')
        .send({
          userId: 'session-test-user',
          device: 'Desktop',
          browser: 'Chrome',
          os: 'Windows',
          country: 'US',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBeDefined();
      expect(response.body.data.status).toBe(SessionStatus.ACTIVE);
      expect(response.body.data.device).toBe('Desktop');
    });

    it('should create session with entry page', async () => {
      const response = await request(app)
        .post('/api/v1/sessions')
        .send({
          userId: 'session-test-user',
          entryPage: 'https://example.com/landing',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.entryPage).toBe('https://example.com/landing');
      expect(response.body.data.pageViews).toBe(1);
    });

    it('should return 400 for missing userId', async () => {
      const response = await request(app)
        .post('/api/v1/sessions')
        .send({
          device: 'Desktop',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid entry page URL', async () => {
      const response = await request(app)
        .post('/api/v1/sessions')
        .send({
          userId: 'session-test-user',
          entryPage: 'invalid-url',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/sessions', () => {
    beforeEach(async () => {
      await Session.create([
        {
          sessionId: 'search-session-1',
          userId: 'user-1',
          status: SessionStatus.ACTIVE,
          startTime: new Date(),
          device: 'Desktop',
          country: 'US',
        },
        {
          sessionId: 'search-session-2',
          userId: 'user-1',
          status: SessionStatus.ENDED,
          startTime: new Date(),
          device: 'Mobile',
          country: 'UK',
        },
        {
          sessionId: 'search-session-3',
          userId: 'user-2',
          status: SessionStatus.ACTIVE,
          startTime: new Date(),
          device: 'Desktop',
          country: 'US',
        },
      ]);
    });

    it('should search sessions with authentication', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });

    it('should filter by userId', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .query({ userId: 'user-1' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((s: { userId: string }) => s.userId === 'user-1')).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .query({ status: SessionStatus.ACTIVE })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((s: { status: SessionStatus }) => s.status === SessionStatus.ACTIVE)).toBe(true);
    });

    it('should filter by device', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .query({ device: 'Mobile' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((s: { device: string }) => s.device === 'Mobile')).toBe(true);
    });

    it('should filter by country', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .query({ country: 'UK' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].country).toBe('UK');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(2);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/sessions');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/sessions/:sessionId', () => {
    beforeEach(async () => {
      await Session.create({
        sessionId: 'specific-session',
        userId: 'user-1',
        status: SessionStatus.ACTIVE,
        startTime: new Date(),
        device: 'Desktop',
      });
    });

    it('should get session by ID', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/specific-session')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBe('specific-session');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/non-existent')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/sessions/user/:userId', () => {
    beforeEach(async () => {
      await Session.create([
        {
          sessionId: 'user-session-1',
          userId: 'specific-user',
          status: SessionStatus.ACTIVE,
          startTime: new Date(),
        },
        {
          sessionId: 'user-session-2',
          userId: 'specific-user',
          status: SessionStatus.ENDED,
          startTime: new Date(),
        },
      ]);
    });

    it('should get sessions by user ID', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/user/specific-user')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/user/specific-user')
        .query({ limit: 1 })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });
  });

  describe('POST /api/v1/sessions/:sessionId/end', () => {
    beforeEach(async () => {
      await Session.create({
        sessionId: 'end-session',
        userId: 'user-1',
        status: SessionStatus.ACTIVE,
        startTime: new Date(),
      });
    });

    it('should end a session', async () => {
      const response = await request(app)
        .post('/api/v1/sessions/end-session/end')
        .send({
          exitPage: 'https://example.com/checkout',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(SessionStatus.ENDED);
      expect(response.body.data.exitPage).toBe('https://example.com/checkout');
    });

    it('should end session without exit page', async () => {
      await Session.create({
        sessionId: 'end-session-no-exit',
        userId: 'user-1',
        status: SessionStatus.ACTIVE,
        startTime: new Date(),
      });

      const response = await request(app)
        .post('/api/v1/sessions/end-session-no-exit/end')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(SessionStatus.ENDED);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .post('/api/v1/sessions/non-existent/end')
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/sessions/active', () => {
    beforeEach(async () => {
      await Session.create([
        {
          sessionId: 'active-session-1',
          userId: 'user-1',
          status: SessionStatus.ACTIVE,
          startTime: new Date(),
        },
        {
          sessionId: 'ended-session',
          userId: 'user-2',
          status: SessionStatus.ENDED,
          startTime: new Date(),
        },
      ]);
    });

    it('should get active sessions', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/active')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every((s: { status: SessionStatus }) => s.status === SessionStatus.ACTIVE)).toBe(true);
      expect(response.body.meta.total).toBeDefined();
    });
  });

  describe('GET /api/v1/sessions/stats', () => {
    beforeEach(async () => {
      const now = new Date();
      await Session.create([
        {
          sessionId: 'stats-session-1',
          userId: 'user-1',
          status: SessionStatus.ACTIVE,
          startTime: now,
          device: 'Desktop',
          country: 'US',
          duration: 300,
          pageViews: 5,
        },
        {
          sessionId: 'stats-session-2',
          userId: 'user-2',
          status: SessionStatus.ENDED,
          startTime: now,
          device: 'Mobile',
          country: 'UK',
          duration: 60,
          pageViews: 1,
        },
      ]);
    });

    it('should get session statistics', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSessions).toBeDefined();
      expect(response.body.data.activeSessions).toBeDefined();
    });

    it('should accept date range parameters', async () => {
      const response = await request(app)
        .get('/api/v1/sessions/stats')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/sessions/expire-inactive', () => {
    it('should expire inactive sessions', async () => {
      const response = await request(app)
        .post('/api/v1/sessions/expire-inactive')
        .query({ minutes: 60 })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expiredSessions).toBeDefined();
    });
  });
});
