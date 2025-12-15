import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IAdminUser, UserRole } from '../types/index.js';

export interface IAdminUserDocument extends Omit<IAdminUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminUserSchema = new Schema<IAdminUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Don't include password in queries by default
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: Object.values(UserRole),
      default: UserRole.ANALYST,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'admin_users',
  }
);

// Virtual for full name
adminUserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
adminUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare passwords
adminUserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static methods
adminUserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

adminUserSchema.statics.findByEmailWithPassword = function (email: string) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

adminUserSchema.statics.updateLastLogin = function (userId: string) {
  return this.findByIdAndUpdate(userId, { lastLogin: new Date() });
};

export interface IAdminUserModel extends Model<IAdminUserDocument> {
  findByEmail(email: string): Promise<IAdminUserDocument | null>;
  findByEmailWithPassword(email: string): Promise<IAdminUserDocument | null>;
  updateLastLogin(userId: string): Promise<IAdminUserDocument | null>;
}

export const AdminUser = mongoose.model<IAdminUserDocument, IAdminUserModel>(
  'AdminUser',
  adminUserSchema
);
