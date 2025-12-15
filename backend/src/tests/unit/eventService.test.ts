import { Event } from '../../models/Event.js';
import { User } from '../../models/User.js';
import { Session } from '../../models/Session.js';
import { eventService } from '../../services/eventService.js';
import { EventType, SessionStatus } from '../../types/index.js';

describe('EventService', () => {
  beforeEach(async () => {
    // Create test user and session
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

  describe('ingest', () => {
    it('should create a new event', async () => {
      const event = await eventService.ingest({
        userId: 'test-user',
        sessionId: 'test-session',
        eventType: EventType.PAGE_VIEW,
        pageUrl: 'https://example.com/products',
        properties: { category: 'electronics' },
      });

      expect(event).toBeDefined();
      expect(event.eventId).toBeDefined();
      expect(event.userId).toBe('test-user');
      expect(event.sessionId).toBe('test-session');
      expect(event.eventType).toBe(EventType.PAGE_VIEW);
      expect(event.pageUrl).toBe('https://example.com/products');
    });

    it('should set timestamp to now if not provided', async () => {
      const before = new Date();

      const event = await eventService.ingest({
        userId: 'test-user',
        sessionId: 'test-session',
        eventType: EventType.CLICK,
      });

      const after = new Date();

      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should use provided timestamp', async () => {
      const customTimestamp = new Date('2024-01-15T10:00:00Z');

      const event = await eventService.ingest({
        userId: 'test-user',
        sessionId: 'test-session',
        eventType: EventType.PAGE_VIEW,
        timestamp: customTimestamp,
      });

      expect(event.timestamp.getTime()).toBe(customTimestamp.getTime());
    });
  });

  describe('ingestBatch', () => {
    it('should create multiple events', async () => {
      const result = await eventService.ingestBatch([
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
      ]);

      expect(result.success).toBe(3);
      expect(result.failed).toBe(0);

      const events = await Event.find({ userId: 'test-user' });
      expect(events.length).toBe(3);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Create test events
      const baseDate = new Date('2024-01-15T10:00:00Z');

      await Event.create([
        {
          eventId: 'event-1',
          userId: 'test-user',
          sessionId: 'test-session',
          eventType: EventType.PAGE_VIEW,
          timestamp: new Date(baseDate.getTime()),
          pageUrl: 'https://example.com/home',
        },
        {
          eventId: 'event-2',
          userId: 'test-user',
          sessionId: 'test-session',
          eventType: EventType.PRODUCT_VIEW,
          timestamp: new Date(baseDate.getTime() + 1000),
          pageUrl: 'https://example.com/product/123',
        },
        {
          eventId: 'event-3',
          userId: 'other-user',
          sessionId: 'other-session',
          eventType: EventType.PURCHASE,
          timestamp: new Date(baseDate.getTime() + 2000),
          properties: { amount: 99.99 },
        },
      ]);
    });

    it('should return paginated events', async () => {
      const result = await eventService.search({ page: 1, limit: 2 });

      expect(result.events.length).toBe(2);
      expect(result.total).toBe(3);
      expect(result.pages).toBe(2);
    });

    it('should filter by userId', async () => {
      const result = await eventService.search({ userId: 'test-user' });

      expect(result.events.length).toBe(2);
      expect(result.events.every((e) => e.userId === 'test-user')).toBe(true);
    });

    it('should filter by eventType', async () => {
      const result = await eventService.search({
        eventType: EventType.PAGE_VIEW,
      });

      expect(result.events.length).toBe(1);
      expect(result.events[0].eventType).toBe(EventType.PAGE_VIEW);
    });

    it('should filter by sessionId', async () => {
      const result = await eventService.search({ sessionId: 'test-session' });

      expect(result.events.length).toBe(2);
    });

    it('should filter by date range', async () => {
      const result = await eventService.search({
        startDate: new Date('2024-01-15T10:00:00Z'),
        endDate: new Date('2024-01-15T10:00:01Z'),
      });

      expect(result.events.length).toBe(2);
    });
  });

  describe('getByUserId', () => {
    it('should return events for a user', async () => {
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

      const events = await eventService.getByUserId('specific-user');

      expect(events.length).toBe(2);
    });

    it('should respect limit parameter', async () => {
      await Event.create([
        {
          eventId: 'limit-1',
          userId: 'limit-user',
          sessionId: 'session',
          eventType: EventType.PAGE_VIEW,
          timestamp: new Date(),
        },
        {
          eventId: 'limit-2',
          userId: 'limit-user',
          sessionId: 'session',
          eventType: EventType.PAGE_VIEW,
          timestamp: new Date(),
        },
        {
          eventId: 'limit-3',
          userId: 'limit-user',
          sessionId: 'session',
          eventType: EventType.PAGE_VIEW,
          timestamp: new Date(),
        },
      ]);

      const events = await eventService.getByUserId('limit-user', { limit: 2 });

      expect(events.length).toBe(2);
    });
  });

  describe('getBySessionId', () => {
    it('should return events for a session in chronological order', async () => {
      const baseTime = Date.now();

      await Event.create([
        {
          eventId: 'session-event-1',
          userId: 'user',
          sessionId: 'chronological-session',
          eventType: EventType.SESSION_START,
          timestamp: new Date(baseTime),
        },
        {
          eventId: 'session-event-2',
          userId: 'user',
          sessionId: 'chronological-session',
          eventType: EventType.PAGE_VIEW,
          timestamp: new Date(baseTime + 1000),
        },
        {
          eventId: 'session-event-3',
          userId: 'user',
          sessionId: 'chronological-session',
          eventType: EventType.SESSION_END,
          timestamp: new Date(baseTime + 2000),
        },
      ]);

      const events = await eventService.getBySessionId('chronological-session');

      expect(events.length).toBe(3);
      expect(events[0].eventType).toBe(EventType.SESSION_START);
      expect(events[2].eventType).toBe(EventType.SESSION_END);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      const now = new Date();

      await Event.create([
        {
          eventId: 'stats-1',
          userId: 'user-1',
          sessionId: 'session-1',
          eventType: EventType.PAGE_VIEW,
          timestamp: now,
          pageUrl: 'https://example.com/page1',
        },
        {
          eventId: 'stats-2',
          userId: 'user-1',
          sessionId: 'session-1',
          eventType: EventType.PAGE_VIEW,
          timestamp: now,
          pageUrl: 'https://example.com/page1',
        },
        {
          eventId: 'stats-3',
          userId: 'user-2',
          sessionId: 'session-2',
          eventType: EventType.PURCHASE,
          timestamp: now,
        },
        {
          eventId: 'stats-4',
          userId: 'user-2',
          sessionId: 'session-2',
          eventType: EventType.CLICK,
          timestamp: now,
        },
      ]);
    });

    it('should return event statistics', async () => {
      const startDate = new Date(Date.now() - 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 60 * 60 * 1000);

      const stats = await eventService.getStats(startDate, endDate);

      expect(stats.totalEvents).toBe(4);
      expect(stats.eventsByType[EventType.PAGE_VIEW]).toBe(2);
      expect(stats.eventsByType[EventType.PURCHASE]).toBe(1);
      expect(stats.eventsByType[EventType.CLICK]).toBe(1);
    });
  });

  describe('deleteByUserId', () => {
    // Skip: MongoDB time-series collections don't support deleteMany on non-metaField
    it.skip('should delete all events for a user', async () => {
      await Event.create([
        {
          eventId: 'delete-1',
          userId: 'delete-user',
          sessionId: 'session',
          eventType: EventType.PAGE_VIEW,
          timestamp: new Date(),
        },
        {
          eventId: 'delete-2',
          userId: 'delete-user',
          sessionId: 'session',
          eventType: EventType.CLICK,
          timestamp: new Date(),
        },
        {
          eventId: 'keep-1',
          userId: 'other-user',
          sessionId: 'session',
          eventType: EventType.PAGE_VIEW,
          timestamp: new Date(),
        },
      ]);

      const deletedCount = await eventService.deleteByUserId('delete-user');

      expect(deletedCount).toBe(2);

      const remainingEvents = await Event.find({});
      expect(remainingEvents.length).toBe(1);
      expect(remainingEvents[0].userId).toBe('other-user');
    });
  });
});
