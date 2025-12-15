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
}

// User Roles
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  ANALYST = 'ANALYST',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
}

// Session Status
export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  EXPIRED = 'EXPIRED',
}

// User Interface
export interface User {
  _id: string;
  visitorId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  attributes: Record<string, unknown>;
  firstSeen: string;
  lastSeen: string;
  totalSessions: number;
  totalEvents: number;
  totalPurchases: number;
  totalRevenue: number;
  tags: string[];
  segments: string[];
  createdAt: string;
  updatedAt: string;
}

// Event Interface
export interface Event {
  _id: string;
  eventId: string;
  userId: string;
  sessionId: string;
  eventType: EventType;
  timestamp: string;
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
  createdAt: string;
  updatedAt: string;
}

// Session Interface
export interface Session {
  _id: string;
  sessionId: string;
  userId: string;
  status: SessionStatus;
  startTime: string;
  endTime?: string;
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
  createdAt: string;
  updatedAt: string;
}

// Admin User Interface
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
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

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AdminUser;
  tokens: AuthTokens;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
}

// Dashboard Metrics
export interface DashboardOverview {
  totalUsers: number;
  totalSessions: number;
  totalEvents: number;
  totalPageViews: number;
  totalPurchases: number;
  totalRevenue: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
}

export interface DashboardTrends {
  usersChange: number;
  sessionsChange: number;
  eventsChange: number;
  revenueChange: number;
}

export interface TopPage {
  page: string;
  views: number;
  uniqueUsers: number;
}

export interface EventBreakdown {
  type: string;
  count: number;
  percentage: number;
}

export interface UserActivity {
  date: string;
  users: number;
  sessions: number;
  events: number;
}

export interface GeographicData {
  country: string;
  sessions: number;
  users: number;
}

export interface DeviceBreakdown {
  device: string;
  count: number;
  percentage: number;
}

export interface DashboardMetrics {
  overview: DashboardOverview;
  trends: DashboardTrends;
  topPages: TopPage[];
  eventBreakdown: EventBreakdown[];
  userActivity: UserActivity[];
  geographicData: GeographicData[];
  deviceBreakdown: DeviceBreakdown[];
}

// User Insights
export interface ActiveUsers {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface UserSegment {
  segment: string;
  count: number;
}

export interface TopUser {
  userId: string;
  email?: string;
  events: number;
  purchases: number;
  revenue: number;
}

export interface UserInsights {
  activeUsers: ActiveUsers;
  userSegments: UserSegment[];
  topUsersByEvents: TopUser[];
  newVsReturning: {
    newUsers: number;
    returningUsers: number;
  };
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Date Range
export interface DateRange {
  startDate: Date;
  endDate: Date;
}
