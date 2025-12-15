import { User, IUserDocument } from '../models/User.js';
import { IUser, PaginationQuery, DateRangeFilter } from '../types/index.js';
import { NotFoundError } from '../middlewares/errorHandler.js';

export interface UserSearchParams extends PaginationQuery, DateRangeFilter {
  search?: string;
  tags?: string[];
  segments?: string[];
  minEvents?: number;
  maxEvents?: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  avgEventsPerUser: number;
  avgSessionsPerUser: number;
  topUsers: IUserDocument[];
}

class UserService {
  /**
   * Find user by visitor ID
   */
  async findByVisitorId(visitorId: string): Promise<IUserDocument | null> {
    return User.findByVisitorId(visitorId);
  }

  /**
   * Find or create a user
   */
  async findOrCreate(
    visitorId: string,
    data: Partial<IUser> = {}
  ): Promise<IUserDocument> {
    return User.findOrCreate(visitorId, data);
  }

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<IUserDocument> {
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  /**
   * Update user
   */
  async update(
    visitorId: string,
    data: Partial<IUser>
  ): Promise<IUserDocument> {
    const user = await User.findOneAndUpdate(
      { visitorId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Search users with filters and pagination
   */
  async search(
    params: UserSearchParams
  ): Promise<{ users: IUserDocument[]; total: number; pages: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'lastSeen',
      sortOrder = 'desc',
      search,
      tags,
      segments,
      minEvents,
      maxEvents,
      startDate,
      endDate,
    } = params;

    // Build query
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { visitorId: { $regex: search, $options: 'i' } },
      ];
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    if (segments && segments.length > 0) {
      query.segments = { $in: segments };
    }

    if (minEvents !== undefined || maxEvents !== undefined) {
      query.totalEvents = {};
      if (minEvents !== undefined) {
        (query.totalEvents as Record<string, number>).$gte = minEvents;
      }
      if (maxEvents !== undefined) {
        (query.totalEvents as Record<string, number>).$lte = maxEvents;
      }
    }

    if (startDate || endDate) {
      query.lastSeen = {};
      if (startDate) {
        (query.lastSeen as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (query.lastSeen as Record<string, Date>).$lte = endDate;
      }
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(query).sort(sort).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return {
      users,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get top users by events
   */
  async getTopUsers(limit: number = 10): Promise<IUserDocument[]> {
    return User.getTopUsers(limit);
  }

  /**
   * Get active users since a given date
   */
  async getActiveUsers(since: Date): Promise<IUserDocument[]> {
    return User.getActiveUsers(since);
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<UserStats> {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      aggregateStats,
      topUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastSeen: { $gte: last24Hours } }),
      User.countDocuments({ createdAt: { $gte: startOfToday } }),
      User.aggregate([
        {
          $group: {
            _id: null,
            avgEvents: { $avg: '$totalEvents' },
            avgSessions: { $avg: '$totalSessions' },
          },
        },
      ]),
      User.getTopUsers(5),
    ]);

    return {
      totalUsers,
      activeUsers,
      newUsersToday,
      avgEventsPerUser: aggregateStats[0]?.avgEvents || 0,
      avgSessionsPerUser: aggregateStats[0]?.avgSessions || 0,
      topUsers,
    };
  }

  /**
   * Add tags to user
   */
  async addTags(visitorId: string, tags: string[]): Promise<IUserDocument> {
    const user = await User.findOneAndUpdate(
      { visitorId },
      { $addToSet: { tags: { $each: tags } } },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Remove tags from user
   */
  async removeTags(visitorId: string, tags: string[]): Promise<IUserDocument> {
    const user = await User.findOneAndUpdate(
      { visitorId },
      { $pull: { tags: { $in: tags } } },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Add user to segments
   */
  async addToSegments(
    visitorId: string,
    segments: string[]
  ): Promise<IUserDocument> {
    const user = await User.findOneAndUpdate(
      { visitorId },
      { $addToSet: { segments: { $each: segments } } },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Get users by segment
   */
  async getBySegment(segment: string): Promise<IUserDocument[]> {
    return User.find({ segments: segment });
  }

  /**
   * Delete user
   */
  async delete(visitorId: string): Promise<void> {
    const result = await User.deleteOne({ visitorId });
    if (result.deletedCount === 0) {
      throw new NotFoundError('User');
    }
  }

  /**
   * Bulk update users
   */
  async bulkUpdateSegments(
    visitorIds: string[],
    segmentsToAdd: string[],
    segmentsToRemove: string[]
  ): Promise<number> {
    const result = await User.updateMany(
      { visitorId: { $in: visitorIds } },
      {
        $addToSet: { segments: { $each: segmentsToAdd } },
        $pull: { segments: { $in: segmentsToRemove } },
      }
    );

    return result.modifiedCount;
  }
}

export const userService = new UserService();
