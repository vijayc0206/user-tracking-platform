import { Request } from 'express';

// Event Types
export enum EventType {
  SESSION_START = 'SESSION_START',
  SESSION_END = 'SESSION_END',
  PAGE_VIEW = 'PAGE_VIEW',
  PRODUCT_VIEW = 'PRODUCT_VIEW',
  ADD_TO_CART = 'ADD_TO_CART',
  REMOVE_FROM_CART = 'REMOVE_FROM_CART',
  PURCHASE = 'PURCHASE',
  SEARCH = 'SEARCH',
  CLICK = 'CLICK',
  SCROLL = 'SCROLL',
  FORM_SUBMIT = 'FORM_SUBMIT',
}

// User Roles
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  ANALYST = 'ANALYST',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
}

// Device Types
export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
}

// Product Categories
export enum ProductCategory {
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  HOME = 'home',
  SPORTS = 'sports',
  BOOKS = 'books',
  BEAUTY = 'beauty',
  TOYS = 'toys',
  FOOD = 'food',
  FOOTWEAR = 'footwear',
  ACCESSORIES = 'accessories',
}

// Session Status
export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  EXPIRED = 'EXPIRED',
}

// Event Interface
export interface IEvent {
  _id?: string;
  eventId: string;
  userId: string;
  sessionId: string;
  eventType: EventType;
  timestamp: Date;
  properties: Record<string, unknown>;
  metadata: {
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
  createdAt?: Date;
  updatedAt?: Date;
}

// User Interface
export interface IUser {
  _id?: string;
  visitorId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  attributes: Record<string, unknown>;
  firstSeen: Date;
  lastSeen: Date;
  totalSessions: number;
  totalEvents: number;
  totalPurchases: number;
  totalRevenue: number;
  tags: string[];
  segments: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Session Interface
export interface ISession {
  _id?: string;
  sessionId: string;
  userId: string;
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  events: number;
  entryPage?: string;
  exitPage?: string;
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  region?: string;
  city?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Admin User Interface
export interface IAdminUser {
  _id?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Product Interface (for tracking)
export interface IProduct {
  _id?: string;
  productId: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  currency: string;
  imageUrl?: string;
  attributes: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Analytics Aggregation Interfaces
export interface IUserJourney {
  userId: string;
  sessions: ISession[];
  events: IEvent[];
  totalDuration: number;
  totalPageViews: number;
  totalPurchases: number;
  conversionRate: number;
}

export interface IAnalyticsSummary {
  period: {
    start: Date;
    end: Date;
  };
  totalUsers: number;
  totalSessions: number;
  totalEvents: number;
  totalPageViews: number;
  totalPurchases: number;
  totalRevenue: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  topPages: Array<{ page: string; views: number }>;
  topProducts: Array<{ productId: string; views: number; purchases: number }>;
  eventBreakdown: Record<EventType, number>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Pagination
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Date Range Filter
export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

// Authenticated Request
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// Integration Point Types
export interface IIntegrationConfig {
  _id?: string;
  name: string;
  type: 'IMPORT' | 'EXPORT';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT';
  headers: Record<string, string>;
  authType: 'API_KEY' | 'OAUTH' | 'BASIC' | 'NONE';
  authConfig: Record<string, string>;
  mapping: Record<string, string>;
  schedule?: string;
  isActive: boolean;
  lastSync?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Export Job Types
export interface IExportJob {
  _id?: string;
  jobId: string;
  type: 'DAILY_ANALYTICS' | 'USER_DATA' | 'EVENT_DATA';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startTime: Date;
  endTime?: Date;
  recordsProcessed: number;
  destination: string;
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
