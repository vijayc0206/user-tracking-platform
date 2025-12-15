import mongoose, { Schema, Document, Model } from 'mongoose';
import { IExportJob } from '../types/index.js';

export interface IExportJobDocument extends Omit<IExportJob, '_id'>, Document {
  markRunning(): Promise<IExportJobDocument>;
  markCompleted(recordsProcessed: number): Promise<IExportJobDocument>;
  markFailed(error: string): Promise<IExportJobDocument>;
}

const exportJobSchema = new Schema<IExportJobDocument>(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['DAILY_ANALYTICS', 'USER_DATA', 'EVENT_DATA'],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
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
    },
    recordsProcessed: {
      type: Number,
      default: 0,
      min: 0,
    },
    destination: {
      type: String,
      required: true,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'export_jobs',
  }
);

// Compound indexes
exportJobSchema.index({ type: 1, status: 1 });
exportJobSchema.index({ startTime: -1, status: 1 });

// Instance methods
exportJobSchema.methods.markRunning = function () {
  this.status = 'RUNNING';
  return this.save();
};

exportJobSchema.methods.markCompleted = function (recordsProcessed: number) {
  this.status = 'COMPLETED';
  this.endTime = new Date();
  this.recordsProcessed = recordsProcessed;
  return this.save();
};

exportJobSchema.methods.markFailed = function (error: string) {
  this.status = 'FAILED';
  this.endTime = new Date();
  this.error = error;
  return this.save();
};

// Static methods
exportJobSchema.statics.getRecentJobs = function (
  type?: string,
  limit: number = 10
) {
  const query = type ? { type } : {};
  return this.find(query).sort({ startTime: -1 }).limit(limit);
};

exportJobSchema.statics.getPendingJobs = function () {
  return this.find({ status: 'PENDING' }).sort({ startTime: 1 });
};

exportJobSchema.statics.getRunningJobs = function () {
  return this.find({ status: 'RUNNING' });
};

export interface IExportJobModel extends Model<IExportJobDocument> {
  getRecentJobs(type?: string, limit?: number): Promise<IExportJobDocument[]>;
  getPendingJobs(): Promise<IExportJobDocument[]>;
  getRunningJobs(): Promise<IExportJobDocument[]>;
}

export const ExportJob = mongoose.model<IExportJobDocument, IExportJobModel>(
  'ExportJob',
  exportJobSchema
);
