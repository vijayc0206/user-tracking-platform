import { v4 as uuidv4 } from 'uuid';
import { Event, IEventDocument } from '../models/Event.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import {
  IEvent,
  EventType,
  PaginationQuery,
  DateRangeFilter,
} from '../types/index.js';
import { NotFoundError } from '../middlewares/errorHandler.js';
import { logger } from '../utils/logger.js';

export interface EventSearchParams extends PaginationQuery, DateRangeFilter {
  userId?: string;
  sessionId?: string;
  eventType?: EventType;
  pageUrl?: string;
}

export interface EventIngestionPayload {
  userId: string;
  sessionId: string;
  eventType: EventType;
  timestamp?: Date;
  properties?: Record<string, unknown>;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    device?: string;
    browser?: string;
    os?: string;
    country?: string;
    region?: string;
    city?: string;
  };
  pageUrl?: string;
  referrer?: string;
  duration?: number;
}

export interface EventStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  topPages: Array<{ pageUrl: string; views: number; uniqueUsers: number }>;
  dailyStats: unknown[];
}

class EventService {
  /**
   * Ingest a single event
   */
  async ingest(payload: EventIngestionPayload): Promise<IEventDocument> {
    const eventId = uuidv4();

    const event = await Event.create({
      eventId,
      userId: payload.userId,
      sessionId: payload.sessionId,
      eventType: payload.eventType,
      timestamp: payload.timestamp || new Date(),
      properties: payload.properties || {},
      metadata: payload.metadata || {},
      pageUrl: payload.pageUrl,
      referrer: payload.referrer,
      duration: payload.duration,
    });

    // Update user stats asynchronously
    this.updateUserStats(payload.userId, payload.eventType, payload.properties)
      .catch((err) => logger.error('Failed to update user stats:', err));

    // Update session stats asynchronously
    this.updateSessionStats(payload.sessionId, payload.eventType, payload.pageUrl)
      .catch((err) => logger.error('Failed to update session stats:', err));

    return event;
  }

  /**
   * Ingest multiple events in batch
   */
  async ingestBatch(
    payloads: EventIngestionPayload[]
  ): Promise<{ success: number; failed: number }> {
    const events = payloads.map((payload) => ({
      eventId: uuidv4(),
      userId: payload.userId,
      sessionId: payload.sessionId,
      eventType: payload.eventType,
      timestamp: payload.timestamp || new Date(),
      properties: payload.properties || {},
      metadata: payload.metadata || {},
      pageUrl: payload.pageUrl,
      referrer: payload.referrer,
      duration: payload.duration,
    }));

    try {
      const result = await Event.insertMany(events, { ordered: false });

      // Update stats for each unique user and session
      const userIds = [...new Set(payloads.map((p) => p.userId))];
      const sessionIds = [...new Set(payloads.map((p) => p.sessionId))];

      // Update user event counts
      await Promise.all(
        userIds.map((userId) =>
          User.findOneAndUpdate(
            { visitorId: userId },
            {
              $inc: {
                totalEvents: payloads.filter((p) => p.userId === userId).length,
              },
              $set: { lastSeen: new Date() },
            },
            { upsert: true }
          )
        )
      );

      // Update session event counts
      await Promise.all(
        sessionIds.map((sessionId) =>
          Session.findOneAndUpdate(
            { sessionId },
            {
              $inc: {
                events: payloads.filter((p) => p.sessionId === sessionId).length,
                pageViews: payloads.filter(
                  (p) =>
                    p.sessionId === sessionId &&
                    p.eventType === EventType.PAGE_VIEW
                ).length,
              },
            }
          )
        )
      );

      return {
        success: result.length,
        failed: payloads.length - result.length,
      };
    } catch (error) {
      logger.error('Batch event ingestion error:', error);
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  async getById(eventId: string): Promise<IEventDocument> {
    const event = await Event.findOne({ eventId });
    if (!event) {
      throw new NotFoundError('Event');
    }
    return event;
  }

  /**
   * Search events with filters and pagination
   */
  async search(
    params: EventSearchParams
  ): Promise<{ events: IEventDocument[]; total: number; pages: number }> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      userId,
      sessionId,
      eventType,
      pageUrl,
      startDate,
      endDate,
    } = params;

    // Build query
    const query: Record<string, unknown> = {};

    if (userId) {
      query.userId = userId;
    }

    if (sessionId) {
      query.sessionId = sessionId;
    }

    if (eventType) {
      query.eventType = eventType;
    }

    if (pageUrl) {
      query.pageUrl = { $regex: pageUrl, $options: 'i' };
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        (query.timestamp as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (query.timestamp as Record<string, Date>).$lte = endDate;
      }
    }

    // Execute query
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [events, total] = await Promise.all([
      Event.find(query).sort(sort).skip(skip).limit(limit),
      Event.countDocuments(query),
    ]);

    return {
      events,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get events by user ID
   */
  async getByUserId(
    userId: string,
    options: { startDate?: Date; endDate?: Date; limit?: number } = {}
  ): Promise<IEventDocument[]> {
    return Event.findByUserId(userId, options);
  }

  /**
   * Get events by session ID
   */
  async getBySessionId(sessionId: string): Promise<IEventDocument[]> {
    return Event.findBySessionId(sessionId);
  }

  /**
   * Get user journey
   */
  async getUserJourney(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<unknown[]> {
    return Event.getUserJourney(userId, startDate, endDate);
  }

  /**
   * Get event counts by type
   */
  async getEventCounts(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ _id: EventType; count: number }>> {
    return Event.getEventCounts(startDate, endDate);
  }

  /**
   * Get page view statistics
   */
  async getPageViewStats(
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<Array<{ pageUrl: string; views: number; uniqueUsers: number }>> {
    return Event.getPageViewCounts(startDate, endDate, limit);
  }

  /**
   * Get daily event statistics
   */
  async getDailyStats(days: number = 30): Promise<unknown[]> {
    return Event.getDailyEventStats(days);
  }

  /**
   * Get event statistics
   */
  async getStats(startDate: Date, endDate: Date): Promise<EventStats> {
    const [totalEvents, eventCounts, topPages, dailyStats] = await Promise.all([
      Event.countDocuments({
        timestamp: { $gte: startDate, $lte: endDate },
      }),
      Event.getEventCounts(startDate, endDate),
      Event.getPageViewCounts(startDate, endDate, 10),
      Event.getDailyEventStats(30),
    ]);

    const eventsByType: Record<string, number> = {};
    eventCounts.forEach((item) => {
      eventsByType[item._id] = item.count;
    });

    return {
      totalEvents,
      eventsByType,
      topPages,
      dailyStats,
    };
  }

  /**
   * Delete events by user
   */
  async deleteByUserId(userId: string): Promise<number> {
    const result = await Event.deleteMany({ userId });
    return result.deletedCount;
  }

  /**
   * Delete old events (data retention)
   */
  async deleteOldEvents(beforeDate: Date): Promise<number> {
    const result = await Event.deleteMany({
      timestamp: { $lt: beforeDate },
    });
    return result.deletedCount;
  }

  /**
   * Private: Update user stats after event
   */
  private async updateUserStats(
    userId: string,
    eventType: EventType,
    properties?: Record<string, unknown>
  ): Promise<void> {
    const updateFields: Record<string, unknown> = {
      $inc: { totalEvents: 1 },
      $set: { lastSeen: new Date() },
    };

    // Handle purchase events
    if (eventType === EventType.PURCHASE && properties) {
      updateFields.$inc = {
        ...updateFields.$inc as object,
        totalPurchases: 1,
        totalRevenue: (properties.amount as number) || 0,
      };
    }

    await User.findOneAndUpdate({ visitorId: userId }, updateFields, {
      upsert: true,
    });
  }

  /**
   * Private: Update session stats after event
   */
  private async updateSessionStats(
    sessionId: string,
    eventType: EventType,
    pageUrl?: string
  ): Promise<void> {
    const updateFields: Record<string, unknown> = {
      $inc: { events: 1 },
    };

    if (eventType === EventType.PAGE_VIEW) {
      updateFields.$inc = { ...updateFields.$inc as object, pageViews: 1 };
      if (pageUrl) {
        updateFields.$set = { exitPage: pageUrl };
      }
    }

    await Session.findOneAndUpdate({ sessionId }, updateFields);
  }
}

export const eventService = new EventService();
