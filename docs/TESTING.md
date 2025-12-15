# Testing Guide

## Overview

The User Tracking Platform uses Jest as the test framework with MongoDB Memory Server for database testing. This ensures tests run in isolation without affecting any real database.

## Test Structure

```
backend/
├── src/
│   └── tests/
│       ├── setup.ts           # Jest setup and global configuration
│       ├── unit/              # Unit tests
│       │   ├── userService.test.ts
│       │   ├── eventService.test.ts
│       │   └── authService.test.ts
│       ├── integration/       # Integration tests (future)
│       └── e2e/               # End-to-end tests (future)
```

## Running Tests

### All Tests

```bash
cd backend
npm test
```

### With Coverage Report

```bash
npm test -- --coverage
```

### Watch Mode (Development)

```bash
npm run test:watch
```

### Specific Test File

```bash
npm test -- userService.test.ts
```

### Specific Test

```bash
npm test -- -t "should create a new user"
```

## Test Configuration

### Jest Configuration (jest.config.js)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/tests/**',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### Test Setup (setup.ts)

The setup file:
1. Starts an in-memory MongoDB instance before all tests
2. Clears all collections between tests
3. Closes the database connection after all tests

## Writing Tests

### Unit Test Example

```typescript
import { userService } from '../../services/userService';
import { User } from '../../models/User';

describe('UserService', () => {
  describe('createOrUpdate', () => {
    it('should create a new user', async () => {
      const userData = {
        visitorId: 'VIS-test-001',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = await userService.createOrUpdate(userData);

      expect(user).toBeDefined();
      expect(user.visitorId).toBe(userData.visitorId);
      expect(user.email).toBe(userData.email);
    });

    it('should update existing user', async () => {
      // Create user
      await userService.createOrUpdate({
        visitorId: 'VIS-test-002',
        email: 'old@example.com',
      });

      // Update user
      const updated = await userService.createOrUpdate({
        visitorId: 'VIS-test-002',
        email: 'new@example.com',
      });

      expect(updated.email).toBe('new@example.com');
    });
  });
});
```

### Testing Async Functions

```typescript
describe('EventService', () => {
  it('should create event', async () => {
    const event = await eventService.create({
      visitorId: 'VIS-123',
      sessionId: 'SES-456',
      eventType: EventType.PAGE_VIEW,
      page: {
        url: 'https://example.com',
        path: '/',
        title: 'Home',
      },
    });

    expect(event).toBeDefined();
    expect(event.eventId).toBeDefined();
  });
});
```

### Testing Error Cases

```typescript
describe('AuthService', () => {
  it('should throw UnauthorizedError on wrong password', async () => {
    await authService.register({
      email: 'test@example.com',
      password: 'correctPassword',
      firstName: 'Test',
      lastName: 'User',
    });

    await expect(
      authService.login({
        email: 'test@example.com',
        password: 'wrongPassword',
      })
    ).rejects.toThrow(UnauthorizedError);
  });
});
```

## Test Coverage

### Current Coverage Targets

| Metric | Target | Current |
|--------|--------|---------|
| Statements | 70% | - |
| Branches | 70% | - |
| Functions | 70% | - |
| Lines | 70% | - |

### Viewing Coverage Report

After running tests with coverage:

```bash
npm test -- --coverage
```

Open `coverage/lcov-report/index.html` in a browser for a detailed HTML report.

## Mocking

### Mocking External Services

```typescript
import { S3Client } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3');

describe('ExportService', () => {
  beforeEach(() => {
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
    }));
  });

  it('should upload to S3', async () => {
    // Test implementation
  });
});
```

### Mocking Time

```typescript
describe('Session expiration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should mark session as expired', async () => {
    // Test with controlled time
  });
});
```

## Integration Testing

### API Integration Tests

```typescript
import request from 'supertest';
import app from '../../app';

describe('POST /api/v1/events', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login and get token
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin123!@#',
      });
    authToken = res.body.data.tokens.accessToken;
  });

  it('should create event', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        visitorId: 'VIS-123',
        sessionId: 'SES-456',
        eventType: 'page_view',
        page: {
          url: 'https://example.com',
          path: '/',
          title: 'Home',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.eventId).toBeDefined();
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Clear naming**: Test names should describe the expected behavior
3. **Arrange-Act-Assert**: Structure tests clearly with setup, action, and assertion
4. **Single responsibility**: Each test should verify one thing
5. **Clean up**: Reset state between tests
6. **Avoid implementation details**: Test behavior, not implementation
7. **Use factories**: Create test data factories for consistent test objects

## Continuous Integration

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request

See `.github/workflows/ci-cd.yml` for CI configuration.

## Troubleshooting

### Tests Timeout

Increase timeout in specific tests:

```typescript
it('should complete long operation', async () => {
  // Test
}, 30000); // 30 seconds timeout
```

### Memory Issues

If running out of memory:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

### MongoDB Connection Issues

Ensure MongoDB Memory Server is properly configured in setup.ts and no real MongoDB connection is being made during tests.
