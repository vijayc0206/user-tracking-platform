import mongoose, { Schema, Document, Model } from 'mongoose';
import { IEvent, EventType } from '../types/index.js';

export interface IEventDocument extends Omit<IEvent, '_id'>, Document {}

const eventSchema = new Schema<IEventDocument>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: Object.values(EventType),
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    properties: {
      type: Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      userAgent: String,
      ipAddress: String,
      device: String,
      browser: String,
      os: String,
      country: String,
      region: String,
      city: String,
    },
    pageUrl: {
      type: String,
      index: true,
    },
    referrer: String,
    duration: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'events',
    timeseries: {
      timeField: 'timestamp',
      metaField: 'metadata',
      granularity: 'seconds',
    },
  }
);

// Compound indexes for efficient time-series queries
eventSchema.index({ userId: 1, timestamp: -1 });
eventSchema.index({ sessionId: 1, timestamp: 1 });
eventSchema.index({ eventType: 1, timestamp: -1 });
eventSchema.index({ timestamp: -1, eventType: 1 });
eventSchema.index({ userId: 1, eventType: 1, timestamp: -1 });
eventSchema.index({ 'metadata.country': 1, timestamp: -1 });
eventSchema.index({ pageUrl: 1, timestamp: -1 });

// TTL index - automatically delete events older than 90 days (configurable)
// Uncomment if you want automatic data cleanup
// eventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Static methods
eventSchema.statics.findByUserId = function (
  userId: string,
  options: { startDate?: Date; endDate?: Date; limit?: number } = {}
) {
  const query: Record<string, unknown> = { userId };

  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) {
      (query.timestamp as Record<string, Date>).$gte = options.startDate;
    }
    if (options.endDate) {
      (query.timestamp as Record<string, Date>).$lte = options.endDate;
    }
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100);
};

eventSchema.statics.findBySessionId = function (sessionId: string) {
  return this.find({ sessionId }).sort({ timestamp: 1 });
};

eventSchema.statics.getEventCounts = function (startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

eventSchema.statics.getPageViewCounts = function (startDate: Date, endDate: Date, limit: number = 10) {
  return this.aggregate([
    {
      $match: {
        eventType: EventType.PAGE_VIEW,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$pageUrl',
        views: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
      },
    },
    {
      $project: {
        _id: 0,
        pageUrl: '$_id',
        views: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
      },
    },
    {
      $sort: { views: -1 },
    },
    {
      $limit: limit,
    },
  ]);
};

eventSchema.statics.getUserJourney = function (userId: string, startDate?: Date, endDate?: Date) {
  const match: Record<string, unknown> = { userId };

  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) {
      (match.timestamp as Record<string, Date>).$gte = startDate;
    }
    if (endDate) {
      (match.timestamp as Record<string, Date>).$lte = endDate;
    }
  }

  return this.aggregate([
    { $match: match },
    { $sort: { timestamp: 1 } },
    {
      $group: {
        _id: '$sessionId',
        events: {
          $push: {
            eventId: '$eventId',
            eventType: '$eventType',
            timestamp: '$timestamp',
            pageUrl: '$pageUrl',
            properties: '$properties',
            duration: '$duration',
          },
        },
        startTime: { $first: '$timestamp' },
        endTime: { $last: '$timestamp' },
        eventCount: { $sum: 1 },
      },
    },
    { $sort: { startTime: -1 } },
  ]);
};

eventSchema.statics.getDailyEventStats = function (days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          eventType: '$eventType',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.date',
        events: {
          $push: {
            type: '$_id.eventType',
            count: '$count',
          },
        },
        totalEvents: { $sum: '$count' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
};

export interface IEventModel extends Model<IEventDocument> {
  findByUserId(
    userId: string,
    options?: { startDate?: Date; endDate?: Date; limit?: number }
  ): Promise<IEventDocument[]>;
  findBySessionId(sessionId: string): Promise<IEventDocument[]>;
  getEventCounts(startDate: Date, endDate: Date): Promise<Array<{ _id: EventType; count: number }>>;
  getPageViewCounts(
    startDate: Date,
    endDate: Date,
    limit?: number
  ): Promise<Array<{ pageUrl: string; views: number; uniqueUsers: number }>>;
  getUserJourney(userId: string, startDate?: Date, endDate?: Date): Promise<unknown[]>;
  getDailyEventStats(days?: number): Promise<unknown[]>;
}

export const Event = mongoose.model<IEventDocument, IEventModel>('Event', eventSchema);
