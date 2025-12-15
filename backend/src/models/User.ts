import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from '../types/index.js';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      sparse: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    attributes: {
      type: Schema.Types.Mixed,
      default: {},
    },
    firstSeen: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    lastSeen: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    totalSessions: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEvents: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPurchases: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    segments: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Compound indexes for efficient queries
userSchema.index({ lastSeen: -1, totalEvents: -1 });
userSchema.index({ totalPurchases: -1, totalRevenue: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ email: 1, visitorId: 1 });

// Text index for search
userSchema.index({ email: 'text', firstName: 'text', lastName: 'text' });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || 'Anonymous';
});

// Instance methods
userSchema.methods.incrementEvents = function (count: number = 1) {
  this.totalEvents += count;
  this.lastSeen = new Date();
  return this.save();
};

userSchema.methods.incrementSessions = function () {
  this.totalSessions += 1;
  this.lastSeen = new Date();
  return this.save();
};

userSchema.methods.addPurchase = function (amount: number) {
  this.totalPurchases += 1;
  this.totalRevenue += amount;
  this.lastSeen = new Date();
  return this.save();
};

// Static methods
userSchema.statics.findByVisitorId = function (visitorId: string) {
  return this.findOne({ visitorId });
};

userSchema.statics.findOrCreate = async function (visitorId: string, data: Partial<IUser> = {}) {
  let user = await this.findOne({ visitorId });
  if (!user) {
    user = await this.create({ visitorId, ...data });
  }
  return user;
};

userSchema.statics.getTopUsers = function (limit: number = 10) {
  return this.find()
    .sort({ totalEvents: -1 })
    .limit(limit)
    .select('visitorId email firstName lastName totalEvents totalPurchases totalRevenue');
};

userSchema.statics.getActiveUsers = function (since: Date) {
  return this.find({ lastSeen: { $gte: since } });
};

// Pre-save middleware
userSchema.pre('save', function (next) {
  if (this.isNew) {
    this.firstSeen = this.firstSeen || new Date();
  }
  this.lastSeen = new Date();
  next();
});

export interface IUserModel extends Model<IUserDocument> {
  findByVisitorId(visitorId: string): Promise<IUserDocument | null>;
  findOrCreate(visitorId: string, data?: Partial<IUser>): Promise<IUserDocument>;
  getTopUsers(limit?: number): Promise<IUserDocument[]>;
  getActiveUsers(since: Date): Promise<IUserDocument[]>;
}

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);
