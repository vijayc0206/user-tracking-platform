# API Documentation

## Overview

The User Tracking Platform API is a RESTful service built with Express.js and TypeScript. It provides endpoints for user management, event tracking, session handling, and analytics.

**Base URL:** `http://localhost:3000/api/v1`

**API Documentation (Swagger):** `http://localhost:3000/api/docs`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Obtaining Tokens

```bash
# Register a new admin user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login to get tokens
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Using Tokens

Include the access token in the Authorization header:

```bash
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer <access_token>"
```

### Refreshing Tokens

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refresh_token>"
  }'
```

## Rate Limiting

| Endpoint Type | Rate Limit |
|---------------|------------|
| Standard API | 100 requests/15 minutes |
| Authentication | 5 requests/15 minutes |
| Event Ingestion | 1000 requests/minute |

## Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/api/v1/health/detailed` | Detailed health with metrics |
| GET | `/api/v1/health/ready` | Kubernetes readiness probe |
| GET | `/api/v1/health/live` | Kubernetes liveness probe |

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login | No |
| POST | `/api/v1/auth/refresh` | Refresh tokens | No |
| GET | `/api/v1/auth/profile` | Get current user profile | Yes |
| PUT | `/api/v1/auth/profile` | Update profile | Yes |
| POST | `/api/v1/auth/change-password` | Change password | Yes |

### Users (Tracked Users)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/users` | List users with pagination | Yes |
| GET | `/api/v1/users/:id` | Get user by ID | Yes |
| GET | `/api/v1/users/visitor/:visitorId` | Get user by visitor ID | Yes |
| POST | `/api/v1/users` | Create/update user | Yes |
| PUT | `/api/v1/users/:id` | Update user | Yes |
| DELETE | `/api/v1/users/:id` | Delete user | Yes (Admin) |
| GET | `/api/v1/users/:id/events` | Get user events | Yes |
| GET | `/api/v1/users/:id/sessions` | Get user sessions | Yes |
| POST | `/api/v1/users/search` | Search users | Yes |

#### User Query Parameters

```
GET /api/v1/users?page=1&limit=20&sort=-createdAt&segment=high_value
```

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |
| sort | string | Sort field (prefix with - for desc) |
| segment | string | Filter by segment |
| isIdentified | boolean | Filter by identification status |
| search | string | Search in email, firstName, lastName |

### Events

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/events` | List events with pagination | Yes |
| GET | `/api/v1/events/:id` | Get event by ID | Yes |
| POST | `/api/v1/events` | Create single event | Yes |
| POST | `/api/v1/events/batch` | Create multiple events | Yes |
| GET | `/api/v1/events/stats` | Get event statistics | Yes |
| GET | `/api/v1/events/funnel` | Get funnel analysis | Yes |

#### Event Types

```typescript
enum EventType {
  PAGE_VIEW = 'page_view',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  CLICK = 'click',
  FORM_SUBMIT = 'form_submit',
  SEARCH = 'search',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  PURCHASE = 'purchase',
  PRODUCT_VIEW = 'product_view',
  CUSTOM = 'custom'
}
```

#### Create Event Example

```bash
curl -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "visitorId": "VIS-abc123",
    "sessionId": "SES-xyz789",
    "eventType": "product_view",
    "page": {
      "url": "https://example.com/products/123",
      "path": "/products/123",
      "title": "Blue Running Shoes"
    },
    "product": {
      "productId": "PROD-123",
      "name": "Blue Running Shoes",
      "category": "footwear",
      "price": 99.99
    }
  }'
```

#### Batch Event Ingestion

```bash
curl -X POST http://localhost:3000/api/v1/events/batch \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "visitorId": "VIS-abc123",
        "sessionId": "SES-xyz789",
        "eventType": "page_view",
        "timestamp": "2024-01-15T10:00:00Z",
        "page": {
          "url": "https://example.com/home",
          "path": "/home",
          "title": "Home"
        }
      },
      {
        "visitorId": "VIS-abc123",
        "sessionId": "SES-xyz789",
        "eventType": "click",
        "timestamp": "2024-01-15T10:01:00Z",
        "metadata": {
          "elementId": "btn-shop-now",
          "elementText": "Shop Now"
        }
      }
    ]
  }'
```

### Sessions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/sessions` | List sessions | Yes |
| GET | `/api/v1/sessions/:id` | Get session by ID | Yes |
| POST | `/api/v1/sessions` | Create/start session | Yes |
| PUT | `/api/v1/sessions/:id` | Update session | Yes |
| POST | `/api/v1/sessions/:id/end` | End session | Yes |
| GET | `/api/v1/sessions/:id/events` | Get session events | Yes |

#### Session Status

```typescript
enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  ENDED = 'ended'
}
```

### Analytics

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/analytics/dashboard` | Dashboard metrics | Yes |
| GET | `/api/v1/analytics/users` | User analytics | Yes |
| GET | `/api/v1/analytics/events` | Event analytics | Yes |
| GET | `/api/v1/analytics/revenue` | Revenue analytics | Yes |
| GET | `/api/v1/analytics/funnel` | Funnel analysis | Yes |
| GET | `/api/v1/analytics/cohort` | Cohort analysis | Yes |
| POST | `/api/v1/analytics/export` | Export analytics data | Yes (Manager+) |

#### Dashboard Metrics Example

```bash
curl -X GET "http://localhost:3000/api/v1/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "success": true,
  "data": {
    "totalUsers": 50000,
    "newUsers": 5000,
    "activeUsers": 15000,
    "totalEvents": 1000000,
    "totalSessions": 75000,
    "averageSessionDuration": 420,
    "bounceRate": 35.5,
    "conversionRate": 3.2,
    "revenue": {
      "total": 125000,
      "average": 85.50
    },
    "topEvents": [
      { "eventType": "page_view", "count": 500000 },
      { "eventType": "product_view", "count": 200000 }
    ],
    "usersBySegment": [
      { "segment": "high_value", "count": 5000 },
      { "segment": "new_user", "count": 10000 }
    ]
  }
}
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Common Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Permission denied |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource conflict (e.g., duplicate email) |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

## Pagination

All list endpoints support pagination:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "pages": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtering & Sorting

### Date Range Filtering

```
GET /api/v1/events?startDate=2024-01-01&endDate=2024-01-31
```

### Sorting

```
GET /api/v1/users?sort=-createdAt    # Descending by createdAt
GET /api/v1/users?sort=email         # Ascending by email
```

### Multiple Filters

```
GET /api/v1/events?eventType=purchase&visitorId=VIS-123&limit=50
```

## Webhooks (Future)

The platform supports outgoing webhooks for real-time notifications:

```json
{
  "event": "user.identified",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "visitorId": "VIS-abc123",
    "email": "user@example.com"
  }
}
```

## SDK Integration Example

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Track event
async function trackEvent(event: {
  visitorId: string;
  eventType: string;
  page?: object;
  product?: object;
  metadata?: object;
}) {
  return api.post('/events', event);
}

// Get analytics
async function getDashboard(startDate: string, endDate: string) {
  return api.get('/analytics/dashboard', {
    params: { startDate, endDate }
  });
}
```

## Testing with cURL

### Complete Flow Example

```bash
# 1. Register
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","firstName":"Test","lastName":"User"}' \
  | jq -r '.data.tokens.accessToken')

# 2. Create a user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "visitorId": "VIS-test-001",
    "email": "customer@example.com",
    "firstName": "Jane",
    "lastName": "Customer"
  }'

# 3. Track an event
curl -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "visitorId": "VIS-test-001",
    "sessionId": "SES-test-001",
    "eventType": "page_view",
    "page": {"url": "https://example.com", "path": "/", "title": "Home"}
  }'

# 4. Get dashboard analytics
curl -X GET "http://localhost:3000/api/v1/analytics/dashboard?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer $TOKEN"
```
