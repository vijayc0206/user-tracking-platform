import { v4 as uuidv4 } from 'uuid';
import { Session, ISessionDocument } from '../models/Session.js';
import { User } from '../models/User.js';
import { SessionStatus, PaginationQuery, DateRangeFilter } from '../types/index.js';
import { NotFoundError } from '../middlewares/errorHandler.js';
import { logger } from '../utils/logger.js';

export interface SessionCreatePayload {
  userId: string;
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  city?: string;
  ipAddress?: string;
  userAgent?: string;
  entryPage?: string;
}

export interface SessionSearchParams extends PaginationQuery, DateRangeFilter {
  userId?: string;
  status?: SessionStatus;
  device?: string;
  country?: string;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  avgDuration: number;
  avgPageViews: number;
  bounceRate: number;
  sessionsByDevice: Array<{ device: string; count: number }>;
  sessionsByCountry: Array<{
    country: string;
    sessions: number;
    uniqueUsers: number;
    avgDuration: number;
  }>;
}

class SessionService {
  /**
   * Create a new session
   */
  async create(payload: SessionCreatePayload): Promise<ISessionDocument> {
    const sessionId = uuidv4();

    const session = await Session.create({
      sessionId,
      userId: payload.userId,
      status: SessionStatus.ACTIVE,
      startTime: new Date(),
      device: payload.device,
      browser: payload.browser,
      os: payload.os,
      country: payload.country,
      region: payload.region,
      city: payload.city,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      entryPage: payload.entryPage,
      pageViews: payload.entryPage ? 1 : 0,
      events: 1,
    });

    // Update user's session count asynchronously
    User.findOneAndUpdate(
      { visitorId: payload.userId },
      {
        $inc: { totalSessions: 1 },
        $set: { lastSeen: new Date() },
      },
      { upsert: true }
    ).catch((err) => logger.error('Failed to update user session count:', err));

    return session;
  }

  /**
   * Get session by session ID
   */
  async getBySessionId(sessionId: string): Promise<ISessionDocument> {
    const session = await Session.findBySessionId(sessionId);
    if (!session) {
      throw new NotFoundError('Session');
    }
    return session;
  }

  /**
   * Get sessions by user ID
   */
  async getByUserId(
    userId: string,
    limit: number = 10
  ): Promise<ISessionDocument[]> {
    return Session.findByUserId(userId, limit);
  }

  /**
   * End a session
   */
  async endSession(
    sessionId: string,
    exitPage?: string
  ): Promise<ISessionDocument> {
    const session = await Session.findBySessionId(sessionId);

    if (!session) {
      throw new NotFoundError('Session');
    }

    if (session.status !== SessionStatus.ACTIVE) {
      return session; // Session already ended
    }

    return session.endSession(exitPage);
  }

  /**
   * Update session page view
   */
  async incrementPageViews(sessionId: string): Promise<ISessionDocument> {
    const session = await Session.findBySessionId(sessionId);

    if (!session) {
      throw new NotFoundError('Session');
    }

    return session.incrementPageViews();
  }

  /**
   * Search sessions with filters and pagination
   */
  async search(
    params: SessionSearchParams
  ): Promise<{ sessions: ISessionDocument[]; total: number; pages: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'startTime',
      sortOrder = 'desc',
      userId,
      status,
      device,
      country,
      startDate,
      endDate,
    } = params;

    // Build query
    const query: Record<string, unknown> = {};

    if (userId) {
      query.userId = userId;
    }

    if (status) {
      query.status = status;
    }

    if (device) {
      query.device = device;
    }

    if (country) {
      query.country = country;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        (query.startTime as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (query.startTime as Record<string, Date>).$lte = endDate;
      }
    }

    // Execute query
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [sessions, total] = await Promise.all([
      Session.find(query).sort(sort).skip(skip).limit(limit),
      Session.countDocuments(query),
    ]);

    return {
      sessions,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(): Promise<ISessionDocument[]> {
    return Session.getActiveSessions();
  }

  /**
   * Expire inactive sessions
   */
  async expireInactiveSessions(inactiveMinutes: number = 30): Promise<number> {
    return Session.expireInactiveSessions(inactiveMinutes);
  }

  /**
   * Get session statistics
   */
  async getStats(startDate: Date, endDate: Date): Promise<SessionStats> {
    const [
      totalSessions,
      activeSessions,
      statsAggregation,
      sessionsByDevice,
      sessionsByCountry,
    ] = await Promise.all([
      Session.countDocuments({
        startTime: { $gte: startDate, $lte: endDate },
      }),
      Session.countDocuments({ status: SessionStatus.ACTIVE }),
      Session.getSessionStats(startDate, endDate),
      Session.getSessionsByDevice(startDate, endDate),
      Session.getSessionsByCountry(startDate, endDate),
    ]);

    const statsResult = statsAggregation[0] as { avgDuration?: number; avgPageViews?: number; bounceRate?: number } | undefined;
    const stats = {
      avgDuration: statsResult?.avgDuration || 0,
      avgPageViews: statsResult?.avgPageViews || 0,
      bounceRate: statsResult?.bounceRate || 0,
    };

    return {
      totalSessions,
      activeSessions,
      avgDuration: stats.avgDuration,
      avgPageViews: stats.avgPageViews,
      bounceRate: stats.bounceRate,
      sessionsByDevice: sessionsByDevice as Array<{ device: string; count: number }>,
      sessionsByCountry: sessionsByCountry as Array<{
        country: string;
        sessions: number;
        uniqueUsers: number;
        avgDuration: number;
      }>,
    };
  }

  /**
   * Delete sessions by user
   */
  async deleteByUserId(userId: string): Promise<number> {
    const result = await Session.deleteMany({ userId });
    return result.deletedCount;
  }

  /**
   * Delete old sessions (data retention)
   */
  async deleteOldSessions(beforeDate: Date): Promise<number> {
    const result = await Session.deleteMany({
      startTime: { $lt: beforeDate },
    });
    return result.deletedCount;
  }
}

export const sessionService = new SessionService();
