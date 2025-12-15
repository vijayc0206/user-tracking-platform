# Database Schema Design

## Overview

The User Tracking Platform uses MongoDB as the primary database, optimized for high-volume event ingestion and analytical queries.

## Entity Relationship Diagram

```
┌─────────────────────┐         ┌─────────────────────┐
│       Users         │         │      Sessions       │
├─────────────────────┤         ├─────────────────────┤
│ _id                 │    1:N  │ _id                 │
│ visitorId (unique)  │◄────────│ sessionId (unique)  │
│ email               │         │ userId (FK)         │
│ firstName           │         │ status              │
│ lastName            │         │ startTime           │
│ attributes          │         │ endTime             │
│ firstSeen           │         │ duration            │
│ lastSeen            │         │ pageViews           │
│ totalSessions       │         │ events              │
│ totalEvents         │         │ entryPage           │
│ totalPurchases      │         │ exitPage            │
│ totalRevenue        │         │ device              │
│ tags[]              │         │ browser             │
│ segments[]          │         │ os                  │
│ createdAt           │         │ country             │
│ updatedAt           │         │ createdAt           │
└─────────────────────┘         └─────────────────────┘
          │                               │
          │                               │
          │                               │
          │ 1:N                           │ 1:N
          │                               │
          ▼                               ▼
┌─────────────────────────────────────────────────────┐
│                      Events                          │
├─────────────────────────────────────────────────────┤
│ _id                                                  │
│ eventId (unique)                                     │
│ userId (FK)                                          │
│ sessionId (FK)                                       │
│ eventType (enum)                                     │
│ timestamp                                            │
│ properties (flexible)                                │
│ metadata { userAgent, ip, device, browser, os, ... } │
│ pageUrl                                              │
│ referrer                                             │
│ duration                                             │
│ createdAt                                            │
│ updatedAt                                            │
└─────────────────────────────────────────────────────┘
```

## Collections

### 1. Users Collection

Stores user/visitor profiles with aggregated metrics.

```javascript
{
  _id: ObjectId,
  visitorId: String,        // Unique visitor identifier
  email: String,            // Optional email
  firstName: String,
  lastName: String,
  attributes: {             // Custom attributes
    // Flexible schema
  },
  firstSeen: Date,
  lastSeen: Date,
  totalSessions: Number,
  totalEvents: Number,
  totalPurchases: Number,
  totalRevenue: Number,
  tags: [String],           // User tags for segmentation
  segments: [String],       // User segments
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `visitorId`: unique
- `email`: sparse
- `lastSeen, totalEvents`: compound
- `tags`: array
- `segments`: array
- Text index on `email`, `firstName`, `lastName`

### 2. Events Collection (Time-Series)

Stores all tracking events with time-series optimization.

```javascript
{
  _id: ObjectId,
  eventId: String,          // UUID
  userId: String,           // References Users.visitorId
  sessionId: String,        // References Sessions.sessionId
  eventType: String,        // Enum: PAGE_VIEW, PURCHASE, etc.
  timestamp: Date,          // Event time
  properties: {             // Event-specific properties
    // Flexible schema based on event type
    // E.g., for PURCHASE: { amount, currency, productId }
    // E.g., for PAGE_VIEW: { title, category }
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    device: String,
    browser: String,
    os: String,
    country: String,
    region: String,
    city: String
  },
  pageUrl: String,
  referrer: String,
  duration: Number,         // Time spent (ms)
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `eventId`: unique
- `userId, timestamp`: compound
- `sessionId, timestamp`: compound
- `eventType, timestamp`: compound
- `timestamp`: for time-series queries
- `pageUrl, timestamp`: compound

**Time-Series Configuration**:
```javascript
{
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'seconds'
  }
}
```

### 3. Sessions Collection

Tracks user sessions.

```javascript
{
  _id: ObjectId,
  sessionId: String,        // UUID
  userId: String,           // References Users.visitorId
  status: String,           // ACTIVE, ENDED, EXPIRED
  startTime: Date,
  endTime: Date,
  duration: Number,         // ms
  pageViews: Number,
  events: Number,
  entryPage: String,
  exitPage: String,
  device: String,
  browser: String,
  os: String,
  country: String,
  region: String,
  city: String,
  ipAddress: String,
  userAgent: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `sessionId`: unique
- `userId, startTime`: compound
- `status, startTime`: compound
- `country, startTime`: compound
- `device, startTime`: compound

### 4. Admin Users Collection

Stores admin/analyst accounts.

```javascript
{
  _id: ObjectId,
  email: String,
  password: String,         // bcrypt hash
  firstName: String,
  lastName: String,
  role: String,             // ADMIN, ANALYST, USER
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Integration Configs Collection

Stores external integration configurations.

```javascript
{
  _id: ObjectId,
  name: String,
  type: String,             // IMPORT, EXPORT
  endpoint: String,
  method: String,           // GET, POST, PUT
  headers: Object,
  authType: String,         // API_KEY, OAUTH, BASIC, NONE
  authConfig: Object,
  mapping: Object,          // Field mappings
  schedule: String,         // Cron expression
  isActive: Boolean,
  lastSync: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 6. Export Jobs Collection

Tracks export job history.

```javascript
{
  _id: ObjectId,
  jobId: String,
  type: String,             // DAILY_ANALYTICS, USER_DATA, EVENT_DATA
  status: String,           // PENDING, RUNNING, COMPLETED, FAILED
  startTime: Date,
  endTime: Date,
  recordsProcessed: Number,
  destination: String,
  error: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        External Data Sources                             │
│                (Product Catalog, User Data, etc.)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                        ┌─────────────────────┐
                        │  Integration Layer  │
                        │  (Import Service)   │
                        └─────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   Products   │    │  Integration │    │   Export     │              │
│  │  Collection  │    │   Configs    │    │    Jobs      │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                          │
│                         MongoDB Atlas                                    │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │    Users     │◄───│   Sessions   │◄───│    Events    │◄─────────┐  │
│  │  Collection  │    │  Collection  │    │  Collection  │          │  │
│  └──────────────┘    └──────────────┘    └──────────────┘          │  │
│         │                    │                   │                  │  │
└─────────┼────────────────────┼───────────────────┼──────────────────┼──┘
          │                    │                   │                  │
          ▼                    ▼                   ▼                  │
┌─────────────────────────────────────────────────────────────────┐  │
│                       Analytics Service                          │  │
│              (Aggregations, Reports, Dashboards)                 │  │
└─────────────────────────────────────────────────────────────────┘  │
                                                                      │
                    ┌─────────────────────────────────────────────┐   │
                    │               Event Ingestion               │   │
                    │  (API receives events from client/SDK)      │───┘
                    └─────────────────────────────────────────────┘
                                          ▲
                                          │
                              ┌───────────────────────┐
                              │   Client Application  │
                              │   (Web/Mobile/SDK)    │
                              └───────────────────────┘
```

## Query Patterns

### 1. User Journey Query
```javascript
db.events.aggregate([
  { $match: { userId: "visitor-123" } },
  { $sort: { timestamp: 1 } },
  { $group: {
      _id: "$sessionId",
      events: { $push: "$$ROOT" },
      startTime: { $first: "$timestamp" },
      endTime: { $last: "$timestamp" }
  }},
  { $sort: { startTime: -1 } }
])
```

### 2. Daily Analytics
```javascript
db.events.aggregate([
  { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
  { $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
      events: { $sum: 1 },
      users: { $addToSet: "$userId" },
      sessions: { $addToSet: "$sessionId" }
  }},
  { $project: {
      date: "$_id",
      events: 1,
      users: { $size: "$users" },
      sessions: { $size: "$sessions" }
  }}
])
```

### 3. Top Pages
```javascript
db.events.aggregate([
  { $match: { eventType: "PAGE_VIEW", timestamp: { $gte: startDate } } },
  { $group: {
      _id: "$pageUrl",
      views: { $sum: 1 },
      uniqueUsers: { $addToSet: "$userId" }
  }},
  { $project: {
      pageUrl: "$_id",
      views: 1,
      uniqueUsers: { $size: "$uniqueUsers" }
  }},
  { $sort: { views: -1 } },
  { $limit: 10 }
])
```

## Performance Considerations

1. **Indexing Strategy**: Compound indexes follow query patterns
2. **Time-Series Collections**: Optimized for time-based queries
3. **Data Archival**: Events older than 90 days can be archived to S3
4. **Sharding**: Ready for horizontal scaling on `userId` or `timestamp`
5. **Read Replicas**: Analytics queries route to secondaries
