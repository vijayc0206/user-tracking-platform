import { apiLimiter, authLimiter, eventLimiter, exportLimiter } from '../../middlewares/rateLimiter.js';

describe('Rate Limiter Middleware', () => {
  describe('apiLimiter', () => {
    it('should be defined', () => {
      expect(apiLimiter).toBeDefined();
    });

    it('should be a function (middleware)', () => {
      expect(typeof apiLimiter).toBe('function');
    });
  });

  describe('authLimiter', () => {
    it('should be defined', () => {
      expect(authLimiter).toBeDefined();
    });

    it('should be a function (middleware)', () => {
      expect(typeof authLimiter).toBe('function');
    });
  });

  describe('eventLimiter', () => {
    it('should be defined', () => {
      expect(eventLimiter).toBeDefined();
    });

    it('should be a function (middleware)', () => {
      expect(typeof eventLimiter).toBe('function');
    });
  });

  describe('exportLimiter', () => {
    it('should be defined', () => {
      expect(exportLimiter).toBeDefined();
    });

    it('should be a function (middleware)', () => {
      expect(typeof exportLimiter).toBe('function');
    });
  });
});
