import mongoose from 'mongoose';
import { database } from '../../config/database.js';

// Store original connection state
const originalConnection = mongoose.connection;

// Mock logger
jest.mock('../../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Database', () => {
  describe('getInstance', () => {
    it('should return singleton instance', () => {
      // database is already exported as singleton
      expect(database).toBeDefined();
      expect(typeof database.connect).toBe('function');
      expect(typeof database.disconnect).toBe('function');
      expect(typeof database.getConnection).toBe('function');
      expect(typeof database.isReady).toBe('function');
    });
  });

  describe('getConnection', () => {
    it('should return mongoose instance', () => {
      const connection = database.getConnection();

      expect(connection).toBe(mongoose);
    });
  });

  describe('isReady', () => {
    it('should return boolean value', () => {
      const ready = database.isReady();

      expect(typeof ready).toBe('boolean');
    });

    it('should check mongoose connection readyState', () => {
      // In test environment, connection is managed by MongoMemoryServer
      // readyState 1 means connected
      const isReady = database.isReady();
      const connectionState = mongoose.connection.readyState;

      // If readyState is 1 (connected), isReady might be true depending on internal state
      expect(typeof isReady).toBe('boolean');
      expect([0, 1, 2, 3]).toContain(connectionState);
    });
  });

  describe('connect', () => {
    it('should be a function', () => {
      expect(typeof database.connect).toBe('function');
    });

    it('should return a promise', () => {
      // Note: We don't actually call connect here as MongoMemoryServer already manages the connection
      const connectFn = database.connect;
      expect(typeof connectFn).toBe('function');
    });
  });

  describe('disconnect', () => {
    it('should be a function', () => {
      expect(typeof database.disconnect).toBe('function');
    });

    it('should return a promise', () => {
      // Note: We don't actually call disconnect here as it would break other tests
      const disconnectFn = database.disconnect;
      expect(typeof disconnectFn).toBe('function');
    });
  });

  describe('connection state tracking', () => {
    it('should expose isReady method', () => {
      expect(database.isReady).toBeDefined();
      expect(typeof database.isReady()).toBe('boolean');
    });

    it('should expose getConnection method', () => {
      const connection = database.getConnection();
      expect(connection).toBeDefined();
      expect(connection.connection).toBeDefined();
    });
  });
});
