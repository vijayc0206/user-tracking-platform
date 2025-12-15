import mongoose, { Schema, Document, Model } from 'mongoose';
import { ISession, SessionStatus } from '../types/index.js';

export interface ISessionDocument extends Omit<ISession, '_id'>, Document {
  endSession(exitPage?: string): Promise<ISessionDocument>;
  incrementPageViews(): Promise<ISessionDocument>;
  incrementEvents(count?: number): Promise<ISessionDocument>;
}

const sessionSchema = new Schema<ISessionDocument>(
  {
    sessionId: {
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
    status: {
      type: String,
      required: true,
      enum: Object.values(SessionStatus),
      default: SessionStatus.ACTIVE,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    endTime: {
      type: Date,
      index: true,
    },
    duration: {
      type: Number,
      min: 0,
    },
    pageViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    events: {
      type: Number,
      default: 0,
      min: 0,
    },
    entryPage: String,
    exitPage: String,
    device: {
      type: String,
      index: true,
    },
    browser: {
      type: String,
      index: true,
    },
    os: {
      type: String,
      index: true,
    },
    country: {
      type: String,
      index: true,
    },
    region: String,
    city: String,
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
    collection: 'sessions',
  }
);

// Compound indexes
sessionSchema.index({ userId: 1, startTime: -1 });
sessionSchema.index({ status: 1, startTime: -1 });
sessionSchema.index({ startTime: -1, status: 1 });
sessionSchema.index({ country: 1, startTime: -1 });
sessionSchema.index({ device: 1, startTime: -1 });

// Virtual for duration calculation
sessionSchema.virtual('calculatedDuration').get(function () {
  if (this.endTime && this.startTime) {
    return this.endTime.getTime() - this.startTime.getTime();
  }
  return null;
});

// Instance methods
sessionSchema.methods.endSession = function (exitPage?: string) {
  this.status = SessionStatus.ENDED;
  this.endTime = new Date();
  this.exitPage = exitPage || this.exitPage;
  this.duration = this.endTime.getTime() - this.startTime.getTime();
  return this.save();
};

sessionSchema.methods.incrementPageViews = function () {
  this.pageViews += 1;
  return this.save();
};

sessionSchema.methods.incrementEvents = function (count: number = 1) {
  this.events += count;
  return this.save();
};

// Static methods
sessionSchema.statics.findBySessionId = function (sessionId: string) {
  return this.findOne({ sessionId });
};

sessionSchema.statics.findByUserId = function (userId: string, limit: number = 10) {
  return this.find({ userId }).sort({ startTime: -1 }).limit(limit);
};

sessionSchema.statics.getActiveSessions = function () {
  return this.find({ status: SessionStatus.ACTIVE });
};

sessionSchema.statics.expireInactiveSessions = async function (
  inactiveMinutes: number = 30
) {
  const cutoffTime = new Date(Date.now() - inactiveMinutes * 60 * 1000);

  const result = await this.updateMany(
    {
      status: SessionStatus.ACTIVE,
      updatedAt: { $lt: cutoffTime },
    },
    {
      $set: {
        status: SessionStatus.EXPIRED,
        endTime: cutoffTime,
      },
    }
  );

  return result.modifiedCount;
};

sessionSchema.statics.getSessionStats = function (startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        avgPageViews: { $avg: '$pageViews' },
        avgEvents: { $avg: '$events' },
        uniqueUsers: { $addToSet: '$userId' },
        bounced: {
          $sum: {
            $cond: [{ $lte: ['$pageViews', 1] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalSessions: 1,
        avgDuration: { $round: ['$avgDuration', 2] },
        avgPageViews: { $round: ['$avgPageViews', 2] },
        avgEvents: { $round: ['$avgEvents', 2] },
        uniqueUsers: { $size: '$uniqueUsers' },
        bounceRate: {
          $round: [
            { $multiply: [{ $divide: ['$bounced', '$totalSessions'] }, 100] },
            2,
          ],
        },
      },
    },
  ]);
};

sessionSchema.statics.getSessionsByCountry = function (
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate },
        country: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: '$country',
        sessions: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        avgDuration: { $avg: '$duration' },
      },
    },
    {
      $project: {
        _id: 0,
        country: '$_id',
        sessions: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        avgDuration: { $round: ['$avgDuration', 2] },
      },
    },
    {
      $sort: { sessions: -1 },
    },
  ]);
};

sessionSchema.statics.getSessionsByDevice = function (
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        startTime: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$device',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        device: { $ifNull: ['$_id', 'Unknown'] },
        count: 1,
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

export interface ISessionModel extends Model<ISessionDocument> {
  findBySessionId(sessionId: string): Promise<ISessionDocument | null>;
  findByUserId(userId: string, limit?: number): Promise<ISessionDocument[]>;
  getActiveSessions(): Promise<ISessionDocument[]>;
  expireInactiveSessions(inactiveMinutes?: number): Promise<number>;
  getSessionStats(startDate: Date, endDate: Date): Promise<unknown[]>;
  getSessionsByCountry(startDate: Date, endDate: Date): Promise<unknown[]>;
  getSessionsByDevice(startDate: Date, endDate: Date): Promise<unknown[]>;
}

export const Session = mongoose.model<ISessionDocument, ISessionModel>(
  'Session',
  sessionSchema
);
