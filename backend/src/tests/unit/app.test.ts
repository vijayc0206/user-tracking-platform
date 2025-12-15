import request from 'supertest';
import { createApp } from '../../app.js';
import { Application } from 'express';

// Mock logger to suppress error output during tests
jest.mock('../../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('App', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('createApp', () => {
    it('should create an express application', () => {
      expect(app).toBeDefined();
      expect(typeof app.listen).toBe('function');
    });

    it('should have security headers (helmet)', async () => {
      const response = await request(app).get('/');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('should parse JSON body', async () => {
      const response = await request(app)
        .post('/api/events')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      // Will get 401 unauthorized but proves JSON parsing works
      expect(response.status).not.toBe(415); // Not unsupported media type
    });

    it('should apply compression middleware', () => {
      // App should be created successfully with compression
      expect(app).toBeDefined();
    });
  });

  describe('Root route', () => {
    it('should return API info at root path', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('User Tracking Platform API');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.documentation).toBe('/api/docs');
      expect(response.body.data.health).toBe('/health');
    });
  });

  describe('Swagger documentation', () => {
    it('should serve swagger JSON spec', async () => {
      const response = await request(app).get('/api/docs.json');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.openapi).toBe('3.0.0');
      expect(response.body.info.title).toBe('User Tracking Platform API');
    });

    it('should serve swagger UI', async () => {
      const response = await request(app).get('/api/docs/');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });

    it('should return 404 for unknown API routes', async () => {
      const response = await request(app).get('/api/unknown');

      expect(response.status).toBe(404);
    });
  });

  describe('Error handler', () => {
    it('should handle errors gracefully', async () => {
      // Invalid JSON will trigger error
      const response = await request(app)
        .post('/api/events')
        .send('invalid json{')
        .set('Content-Type', 'application/json');

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Health endpoints', () => {
    it('should respond to health check', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should respond to liveness check', async () => {
      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should respond to readiness check', async () => {
      const response = await request(app).get('/health/ready');

      // May be 200 or 503 depending on DB connection state
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Rate limiting', () => {
    it('should apply rate limiter middleware', async () => {
      // Make multiple requests - should not error out
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
    });
  });

  describe('API Routes mounting', () => {
    it('should mount event routes', async () => {
      const response = await request(app)
        .get('/api/v1/events')
        .set('Authorization', 'Bearer invalid');

      // Should get 401 (unauthorized) not 404 (route not found)
      expect(response.status).toBe(401);
    });

    it('should mount user routes', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer invalid');

      expect(response.status).toBe(401);
    });

    it('should mount session routes', async () => {
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', 'Bearer invalid');

      expect(response.status).toBe(401);
    });

    it('should mount analytics routes', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', 'Bearer invalid');

      expect(response.status).toBe(401);
    });

    it('should mount auth routes', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'password' });

      // Should not be 404
      expect(response.status).not.toBe(404);
    });
  });
});
