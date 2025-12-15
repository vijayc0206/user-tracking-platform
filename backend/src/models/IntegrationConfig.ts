import mongoose, { Schema, Document, Model } from 'mongoose';
import { IIntegrationConfig } from '../types/index.js';

export interface IIntegrationConfigDocument
  extends Omit<IIntegrationConfig, '_id'>,
    Document {}

const integrationConfigSchema = new Schema<IIntegrationConfigDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['IMPORT', 'EXPORT'],
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT'],
      default: 'GET',
    },
    headers: {
      type: Schema.Types.Mixed,
      default: {},
    },
    authType: {
      type: String,
      required: true,
      enum: ['API_KEY', 'OAUTH', 'BASIC', 'NONE'],
      default: 'NONE',
    },
    authConfig: {
      type: Schema.Types.Mixed,
      default: {},
    },
    mapping: {
      type: Schema.Types.Mixed,
      default: {},
    },
    schedule: {
      type: String, // Cron expression
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastSync: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'integration_configs',
  }
);

// Static methods
integrationConfigSchema.statics.findActiveImports = function () {
  return this.find({ type: 'IMPORT', isActive: true });
};

integrationConfigSchema.statics.findActiveExports = function () {
  return this.find({ type: 'EXPORT', isActive: true });
};

integrationConfigSchema.statics.updateLastSync = function (
  configId: string,
  syncTime: Date = new Date()
) {
  return this.findByIdAndUpdate(configId, { lastSync: syncTime }, { new: true });
};

export interface IIntegrationConfigModel
  extends Model<IIntegrationConfigDocument> {
  findActiveImports(): Promise<IIntegrationConfigDocument[]>;
  findActiveExports(): Promise<IIntegrationConfigDocument[]>;
  updateLastSync(
    configId: string,
    syncTime?: Date
  ): Promise<IIntegrationConfigDocument | null>;
}

export const IntegrationConfig = mongoose.model<
  IIntegrationConfigDocument,
  IIntegrationConfigModel
>('IntegrationConfig', integrationConfigSchema);
