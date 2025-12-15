import { Request, Response } from 'express';
import { sessionController } from '../../controllers/sessionController.js';
import { sessionService } from '../../services/sessionService.js';
import { SessionStatus } from '../../types/index.js';
import { StatusCodes } from 'http-status-codes';

// Mock the sessionService
jest.mock('../../services/sessionService.js', () => ({
  sessionService: {
    create: jest.fn(),
    search: jest.fn(),
    getBySessionId: jest.fn(),
    getByUserId: jest.fn(),
    endSession: jest.fn(),
    getActiveSessions: jest.fn(),
    getStats: jest.fn(),
    expireInactiveSessions: jest.fn(),
  },
}));

describe('SessionController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a session successfully', async () => {
      const sessionData = {
        userId: 'user-1',
        device: 'Desktop',
        browser: 'Chrome',
      };
      const mockSession = {
        sessionId: 'session-1',
        ...sessionData,
        status: SessionStatus.ACTIVE,
      };

      mockRequest.body = sessionData;
      (sessionService.create as jest.Mock).mockResolvedValue(mockSession);

      await sessionController.create(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(sessionService.create).toHaveBeenCalledWith(sessionData);
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockSession,
      });
    });

    it('should validate required userId', async () => {
      mockRequest.body = { device: 'Desktop' };

      const mockNext = jest.fn();
      await sessionController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate entryPage URL format', async () => {
      mockRequest.body = {
        userId: 'user-1',
        entryPage: 'invalid-url',
      };

      const mockNext = jest.fn();
      await sessionController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search sessions with pagination', async () => {
      const mockResult = {
        sessions: [{ sessionId: 'session-1' }, { sessionId: 'session-2' }],
        total: 10,
        pages: 5,
      };

      mockRequest.query = { page: '1', limit: '2' };
      (sessionService.search as jest.Mock).mockResolvedValue(mockResult);

      await sessionController.search(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(sessionService.search).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult.sessions,
        meta: {
          page: 1,
          limit: 2,
          total: 10,
          totalPages: 5,
        },
      });
    });

    it('should filter by status', async () => {
      const mockResult = { sessions: [], total: 0, pages: 0 };

      mockRequest.query = { status: SessionStatus.ACTIVE };
      (sessionService.search as jest.Mock).mockResolvedValue(mockResult);

      await sessionController.search(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(sessionService.search).toHaveBeenCalledWith(
        expect.objectContaining({ status: SessionStatus.ACTIVE })
      );
    });

    it('should filter by device', async () => {
      const mockResult = { sessions: [], total: 0, pages: 0 };

      mockRequest.query = { device: 'Mobile' };
      (sessionService.search as jest.Mock).mockResolvedValue(mockResult);

      await sessionController.search(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(sessionService.search).toHaveBeenCalledWith(
        expect.objectContaining({ device: 'Mobile' })
      );
    });

    it('should filter by country', async () => {
      const mockResult = { sessions: [], total: 0, pages: 0 };

      mockRequest.query = { country: 'US' };
      (sessionService.search as jest.Mock).mockResolvedValue(mockResult);

      await sessionController.search(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(sessionService.search).toHaveBeenCalledWith(
        expect.objectContaining({ country: 'US' })
      );
    });
  });

  describe('getBySessionId', () => {
    it('should get session by ID', async () => {
      const mockSession = {
        sessionId: 'session-1',
        userId: 'user-1',
        status: SessionStatus.ACTIVE,
      };

      mockRequest.params = { sessionId: 'session-1' };
      (sessionService.getBySessionId as jest.Mock).mockResolvedValue(mockSession);

      await sessionController.getBySessionId(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(sessionService.getBySessionId).toHaveBeenCalledWith('session-1');
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockSession,
      });
    });
  });

  describe('getByUserId', () => {
    it('should get sessions by user ID', async () => {
      const mockSessions = [{ sessionId: 'session-1' }, { sessionId: 'session-2' }];

      mockRequest.params = { userId: 'user-1' };
      mockRequest.query = { limit: '5' };
      (sessionService.getByUserId as jest.Mock).mockResolvedValue(mockSessions);

      await sessionController.getByUserId(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(sessionService.getByUserId).toHaveBeenCalledWith('user-1', 5);
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should use default limit if not provided', async () => {
      const mockSessions: any[] = [];

      mockRequest.params = { userId: 'user-1' };
      mockRequest.query = {};
      (sessionService.getByUserId as jest.Mock).mockResolvedValue(mockSessions);

      await sessionController.getByUserId(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(sessionService.getByUserId).toHaveBeenCalledWith('user-1', 10);
    });
  });

  describe('endSession', () => {
    it('should end session successfully', async () => {
      const mockSession = {
        sessionId: 'session-1',
        status: SessionStatus.ENDED,
        exitPage: 'https://example.com/checkout',
      };

      mockRequest.params = { sessionId: 'session-1' };
      mockRequest.body = { exitPage: 'https://example.com/checkout' };
      (sessionService.endSession as jest.Mock).mockResolvedValue(mockSession);

      await sessionController.endSession(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(sessionService.endSession).toHaveBeenCalledWith(
        'session-1',
        'https://example.com/checkout'
      );
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should end session without exit page', async () => {
      const mockSession = {
        sessionId: 'session-1',
        status: SessionStatus.ENDED,
      };

      mockRequest.params = { sessionId: 'session-1' };
      mockRequest.body = {};
      (sessionService.endSession as jest.Mock).mockResolvedValue(mockSession);

      await sessionController.endSession(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(sessionService.endSession).toHaveBeenCalledWith('session-1', undefined);
    });

    it('should validate exit page URL format', async () => {
      mockRequest.params = { sessionId: 'session-1' };
      mockRequest.body = { exitPage: 'invalid-url' };

      const mockNext = jest.fn();
      await sessionController.endSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getActiveSessions', () => {
    it('should get active sessions', async () => {
      const mockSessions = [
        { sessionId: 'session-1', status: SessionStatus.ACTIVE },
        { sessionId: 'session-2', status: SessionStatus.ACTIVE },
      ];

      (sessionService.getActiveSessions as jest.Mock).mockResolvedValue(mockSessions);

      await sessionController.getActiveSessions(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(sessionService.getActiveSessions).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockSessions,
        meta: {
          total: 2,
        },
      });
    });
  });

  describe('getStats', () => {
    it('should get session statistics', async () => {
      const mockStats = {
        totalSessions: 100,
        activeSessions: 10,
        avgDuration: 300,
        bounceRate: 25,
      };

      mockRequest.query = {};
      (sessionService.getStats as jest.Mock).mockResolvedValue(mockStats);

      await sessionController.getStats(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(sessionService.getStats).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });

    it('should handle date range parameters', async () => {
      const mockStats = { totalSessions: 50 };

      mockRequest.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      (sessionService.getStats as jest.Mock).mockResolvedValue(mockStats);

      await sessionController.getStats(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(sessionService.getStats).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
    });
  });

  describe('expireInactiveSessions', () => {
    it('should expire inactive sessions', async () => {
      mockRequest.query = { minutes: '60' };
      (sessionService.expireInactiveSessions as jest.Mock).mockResolvedValue(5);

      await sessionController.expireInactiveSessions(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(sessionService.expireInactiveSessions).toHaveBeenCalledWith(60);
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          expiredSessions: 5,
        },
      });
    });

    it('should use default minutes if not provided', async () => {
      mockRequest.query = {};
      (sessionService.expireInactiveSessions as jest.Mock).mockResolvedValue(0);

      await sessionController.expireInactiveSessions(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(sessionService.expireInactiveSessions).toHaveBeenCalledWith(30);
    });
  });
});
