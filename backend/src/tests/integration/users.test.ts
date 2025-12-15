import request from 'supertest';
import { createApp } from '../../app.js';
import { User } from '../../models/User.js';
import { Application } from 'express';

describe('Users API Integration Tests', () => {
  let app: Application;
  let accessToken: string;

  beforeAll(async () => {
    app = createApp();

    // Create test admin user and get token
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'useradmin@example.com',
        password: 'password123',
        firstName: 'User',
        lastName: 'Admin',
      });

    accessToken = response.body.data.accessToken;
  });

  beforeEach(async () => {
    // Create test users
    await User.create([
      {
        visitorId: 'user-1',
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        firstSeen: new Date('2024-01-01'),
        lastSeen: new Date(),
        totalEvents: 100,
        totalSessions: 10,
        totalPurchases: 5,
        totalRevenue: 500,
        tags: ['premium', 'active'],
        segments: ['high-value'],
      },
      {
        visitorId: 'user-2',
        email: 'user2@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        firstSeen: new Date('2024-02-01'),
        lastSeen: new Date(),
        totalEvents: 50,
        totalSessions: 5,
        totalPurchases: 2,
        totalRevenue: 200,
        tags: ['new'],
        segments: ['new-user'],
      },
      {
        visitorId: 'user-3',
        firstSeen: new Date('2024-03-01'),
        lastSeen: new Date(),
        totalEvents: 10,
        totalSessions: 1,
      },
    ]);
  });

  describe('GET /api/v1/users', () => {
    it('should search users with authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });

    it('should filter by search term', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .query({ search: 'john' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by tags', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .query({ tags: 'premium' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((u: { tags: string[] }) => u.tags.includes('premium'))).toBe(true);
    });

    it('should filter by segments', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .query({ segments: 'high-value' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((u: { segments: string[] }) => u.segments.includes('high-value'))).toBe(true);
    });

    it('should filter by event count range', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .query({ minEvents: 50, maxEvents: 100 })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((u: { totalEvents: number }) => u.totalEvents >= 50 && u.totalEvents <= 100)).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(2);
    });

    it('should sort results', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .query({ sortBy: 'totalEvents', sortOrder: 'desc' })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const events = response.body.data.map((u: { totalEvents: number }) => u.totalEvents);
      expect(events).toEqual([...events].sort((a, b) => b - a));
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/users/:visitorId', () => {
    it('should get user by visitor ID', async () => {
      const response = await request(app)
        .get('/api/v1/users/user-1')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.visitorId).toBe('user-1');
      expect(response.body.data.email).toBe('user1@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/v1/users/non-existent')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/users/:visitorId', () => {
    it('should update user', async () => {
      const response = await request(app)
        .put('/api/v1/users/user-1')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          email: 'updated@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
      expect(response.body.data.email).toBe('updated@example.com');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .put('/api/v1/users/user-1')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/v1/users/non-existent')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Test',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/users/:visitorId/tags', () => {
    it('should add tags to user', async () => {
      const response = await request(app)
        .post('/api/v1/users/user-2/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          tags: ['vip', 'loyal'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toContain('vip');
      expect(response.body.data.tags).toContain('loyal');
    });

    it('should validate tags array', async () => {
      const response = await request(app)
        .post('/api/v1/users/user-2/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          tags: 'not-an-array',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/users/:visitorId/tags', () => {
    it('should remove tags from user', async () => {
      const response = await request(app)
        .delete('/api/v1/users/user-1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          tags: ['premium'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).not.toContain('premium');
    });
  });

  describe('POST /api/v1/users/:visitorId/segments', () => {
    it('should add user to segments', async () => {
      const response = await request(app)
        .post('/api/v1/users/user-2/segments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          segments: ['returning', 'engaged'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.segments).toContain('returning');
      expect(response.body.data.segments).toContain('engaged');
    });
  });

  describe('GET /api/v1/users/stats', () => {
    it('should get user statistics', async () => {
      const response = await request(app)
        .get('/api/v1/users/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/users/top', () => {
    it('should get top users by events', async () => {
      const response = await request(app)
        .get('/api/v1/users/top')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/users/top')
        .query({ limit: 2 })
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('DELETE /api/v1/users/:visitorId', () => {
    it('should delete user', async () => {
      const response = await request(app)
        .delete('/api/v1/users/user-3')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('User deleted successfully');

      // Verify user is deleted
      const getResponse = await request(app)
        .get('/api/v1/users/user-3')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
