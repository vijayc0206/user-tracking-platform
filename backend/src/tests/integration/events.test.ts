import request from 'supertest';
import { createApp } from '../../app.js';
import { AdminUser } from '../../models/AdminUser.js';
import { User } from '../../models/User.js';
import { Session } from '../../models/Session.js';
import { Event } from '../../models/Event.js';
import { Application } from 'express';
import { EventType, SessionStatus } from '../../types/index.js';

describe('Events API Integration Tests', () => {
  let app: Application;
  let accessToken: string;

  beforeAll(async () => {
    app = createApp();

    // Create test admin user and get token
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'eventadmin@example.com',
        password: 'password123',
        firstName: 'Event',
        lastName: 'Admin',
      });

    accessToken = response.body.data.accessToken;
  });

  beforeEach(async () => {
    // Create test user and session for events
    await User.create({
      visitorId: 'test-user',
      firstSeen: new Date(),
      lastSeen: new Date(),
    });

    await Session.create({
      sessionId: 'test-session',
      userId: 'test-user',
      status: SessionStatus.ACTIVE,
      startTime: new Date(),
    });
  });

  describe('POST /api/v1/events', () => {
    it('should ingest a single event', async () => {
      const response = await request(app)
        .post('/api/v1/events')
        .send({
          userId: 'test-user',
          sessionId: 'test-session',
          eventType: EventType.PAGE_VIEW,
          pageUrl: 'https://example.com/home',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.eventId).toBeDefined();
      expect(response.body.data.eventType).toBe(EventType.PAGE_VIEW);
    });

    it('should ingest event with properties', async () => {
      const response = await request(app)
        .post('/api/v1/events')
        .send({
          userId: 'test-user',
          sessionId: 'test-session',
          eventType: EventType.PURCHASE,
          properties: {
            productId: 'prod-123',
            amount: 99.99,
            currency: 'USD',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.data.properties).toBeDefined();
      expect(response.body.data.properties.amount).toBe(99.99);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/events')
        .send({
          userId: 'test-user',
          // missing sessionId and eventType
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid event type', async () => {
      const response = await request(app)
        .post('/api/v1/events')
        .send({
          userId: 'test-user',
          sessionId: 'test-session',
          eventType: 'INVALID_TYPE',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/events/batch', () => {
    it('should ingest multiple events', async () => {
      const response = await request(app)
        .post('/api/v1/events/batch')
        .send({
          events: [
            {
              userId: 'test-user',
              sessionId: 'test-session',
              eventType: EventType.PAGE_VIEW,
            },
            {
              userId: 'test-user',
              sessionId: 'test-session',
              eventType: EventType.CLICK,
            },
            {
              userId: 'test-user',
              sessionId: 'test-session',
              eventType: EventType.SCROLL,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(3);
      expect(response.body.data.failed).toBe(0);
    });

    it('should return 400 for empty events array', async () => {
      const response = await request(app)
        .post('/api/v1/events/batch')
        .send({ events: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/events', () => {
    beforeEach(async () => {
      // Create test events
      await Event.create([
        {
          eventId: 'event-1',
          userId: 'test-user',
          sessionId: 'test-session',
          eventType: EventType.PAGE_VIEW,
          timestamp: new Date(),
          pageUrl: 'https://example.com/home',
        },
        {
          eventId: 'event-2',
          userId: 'test-user',
          sessionId: 'test-session',
          eventType: EventType.CLICK,
          timestamp: new Date(),
        },
        {
          eventId: 'event-3',
          userId: 'other-user',
          sessionId: 'other-session',
          eventType: EventType.PURCHASE,
          timestamp: new Date(),
        },
      ]);
    });

    it('should search events with authentication', async () => {
      const response = await request(app)
        .get('/api/v1/events')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });

    it('should filter events by userId', async () => {
      const response = await request(app)
        .get('/api/v1/events')
        .query({ userId: 'test-user' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((e: { userId: string }) => e.userId === 'test-user')).toBe(true);
    });

    it('should filter events by eventType', async () => {
      const response = await request(app)
        .get('/api/v1/events')
        .query({ eventType: EventType.PAGE_VIEW })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((e: { eventType: EventType }) => e.eventType === EventType.PAGE_VIEW)).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/events')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(2);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/events');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/events/:eventId', () => {
    beforeEach(async () => {
      await Event.create({
        eventId: 'specific-event',
        userId: 'test-user',
        sessionId: 'test-session',
        eventType: EventType.PAGE_VIEW,
        timestamp: new Date(),
      });
    });

    it('should get event by ID', async () => {
      const response = await request(app)
        .get('/api/v1/events/specific-event')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.eventId).toBe('specific-event');
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/v1/events/non-existent')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/events/user/:userId', () => {
    beforeEach(async () => {
      await Event.create([
        {
          eventId: 'user-event-1',
          userId: 'specific-user',
          sessionId: 'session-1',
          eventType: EventType.PAGE_VIEW,
          timestamp: new Date(),
        },
        {
          eventId: 'user-event-2',
          userId: 'specific-user',
          sessionId: 'session-1',
          eventType: EventType.CLICK,
          timestamp: new Date(),
        },
      ]);
    });

    it('should get events by user ID', async () => {
      const response = await request(app)
        .get('/api/v1/events/user/specific-user')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('GET /api/v1/events/session/:sessionId', () => {
    beforeEach(async () => {
      await Event.create([
        {
          eventId: 'session-event-1',
          userId: 'user-1',
          sessionId: 'specific-session',
          eventType: EventType.SESSION_START,
          timestamp: new Date(),
        },
        {
          eventId: 'session-event-2',
          userId: 'user-1',
          sessionId: 'specific-session',
          eventType: EventType.PAGE_VIEW,
          timestamp: new Date(),
        },
      ]);
    });

    it('should get events by session ID', async () => {
      const response = await request(app)
        .get('/api/v1/events/session/specific-session')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('GET /api/v1/events/stats', () => {
    beforeEach(async () => {
      const now = new Date();
      await Event.create([
        {
          eventId: 'stats-1',
          userId: 'user-1',
          sessionId: 'session-1',
          eventType: EventType.PAGE_VIEW,
          timestamp: now,
        },
        {
          eventId: 'stats-2',
          userId: 'user-2',
          sessionId: 'session-2',
          eventType: EventType.PURCHASE,
          timestamp: now,
        },
      ]);
    });

    it('should get event statistics', async () => {
      const response = await request(app)
        .get('/api/v1/events/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalEvents).toBeDefined();
      expect(response.body.data.eventsByType).toBeDefined();
    });
  });

  describe('GET /api/v1/events/types', () => {
    it('should return all event types', async () => {
      const response = await request(app).get('/api/v1/events/types');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toContain(EventType.PAGE_VIEW);
      expect(response.body.data).toContain(EventType.PURCHASE);
    });
  });
});
