import { Request, Response } from 'express';
import { eventController } from '../../controllers/eventController.js';
import { eventService } from '../../services/eventService.js';
import { EventType } from '../../types/index.js';
import { StatusCodes } from 'http-status-codes';

// Mock the eventService
jest.mock('../../services/eventService.js', () => ({
  eventService: {
    ingest: jest.fn(),
    ingestBatch: jest.fn(),
    search: jest.fn(),
    getById: jest.fn(),
    getByUserId: jest.fn(),
    getBySessionId: jest.fn(),
    getStats: jest.fn(),
    getDailyStats: jest.fn(),
    getPageViewStats: jest.fn(),
  },
}));

describe('EventController', () => {
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

  describe('ingest', () => {
    it('should ingest a single event successfully', async () => {
      const eventData = {
        userId: 'user-1',
        sessionId: 'session-1',
        eventType: EventType.PAGE_VIEW,
        pageUrl: 'https://example.com/home',
      };
      const mockEvent = { eventId: 'event-1', ...eventData };

      mockRequest.body = eventData;
      (eventService.ingest as jest.Mock).mockResolvedValue(mockEvent);

      await eventController.ingest(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(eventService.ingest).toHaveBeenCalledWith(eventData);
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockEvent,
      });
    });

    it('should validate required userId', async () => {
      mockRequest.body = {
        sessionId: 'session-1',
        eventType: EventType.PAGE_VIEW,
      };

      const mockNext = jest.fn();
      await eventController.ingest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate required sessionId', async () => {
      mockRequest.body = {
        userId: 'user-1',
        eventType: EventType.PAGE_VIEW,
      };

      const mockNext = jest.fn();
      await eventController.ingest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate eventType enum', async () => {
      mockRequest.body = {
        userId: 'user-1',
        sessionId: 'session-1',
        eventType: 'INVALID_TYPE',
      };

      const mockNext = jest.fn();
      await eventController.ingest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('ingestBatch', () => {
    it('should ingest batch events successfully', async () => {
      const events = [
        {
          userId: 'user-1',
          sessionId: 'session-1',
          eventType: EventType.PAGE_VIEW,
        },
        {
          userId: 'user-1',
          sessionId: 'session-1',
          eventType: EventType.CLICK,
        },
      ];
      const mockResult = { success: 2, failed: 0 };

      mockRequest.body = { events };
      (eventService.ingestBatch as jest.Mock).mockResolvedValue(mockResult);

      await eventController.ingestBatch(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(eventService.ingestBatch).toHaveBeenCalledWith(events);
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should reject empty events array', async () => {
      mockRequest.body = { events: [] };

      const mockNext = jest.fn();
      await eventController.ingestBatch(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search events with pagination', async () => {
      const mockResult = {
        events: [{ eventId: 'event-1' }, { eventId: 'event-2' }],
        total: 10,
        pages: 5,
      };

      mockRequest.query = { page: '1', limit: '2' };
      (eventService.search as jest.Mock).mockResolvedValue(mockResult);

      await eventController.search(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(eventService.search).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult.events,
        meta: {
          page: 1,
          limit: 2,
          total: 10,
          totalPages: 5,
        },
      });
    });

    it('should filter by userId', async () => {
      const mockResult = { events: [], total: 0, pages: 0 };

      mockRequest.query = { userId: 'test-user' };
      (eventService.search as jest.Mock).mockResolvedValue(mockResult);

      await eventController.search(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(eventService.search).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'test-user' })
      );
    });

    it('should filter by eventType', async () => {
      const mockResult = { events: [], total: 0, pages: 0 };

      mockRequest.query = { eventType: EventType.PAGE_VIEW };
      (eventService.search as jest.Mock).mockResolvedValue(mockResult);

      await eventController.search(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(eventService.search).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: EventType.PAGE_VIEW })
      );
    });
  });

  describe('getById', () => {
    it('should get event by ID', async () => {
      const mockEvent = { eventId: 'event-1', eventType: EventType.PAGE_VIEW };

      mockRequest.params = { eventId: 'event-1' };
      (eventService.getById as jest.Mock).mockResolvedValue(mockEvent);

      await eventController.getById(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(eventService.getById).toHaveBeenCalledWith('event-1');
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockEvent,
      });
    });
  });

  describe('getByUserId', () => {
    it('should get events by user ID', async () => {
      const mockEvents = [{ eventId: 'event-1' }, { eventId: 'event-2' }];

      mockRequest.params = { userId: 'user-1' };
      mockRequest.query = { limit: '50' };
      (eventService.getByUserId as jest.Mock).mockResolvedValue(mockEvents);

      await eventController.getByUserId(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(eventService.getByUserId).toHaveBeenCalledWith('user-1', {
        startDate: undefined,
        endDate: undefined,
        limit: 50,
      });
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should handle date filters', async () => {
      const mockEvents: any[] = [];

      mockRequest.params = { userId: 'user-1' };
      mockRequest.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      (eventService.getByUserId as jest.Mock).mockResolvedValue(mockEvents);

      await eventController.getByUserId(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(eventService.getByUserId).toHaveBeenCalledWith('user-1', {
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        limit: 100,
      });
    });
  });

  describe('getBySessionId', () => {
    it('should get events by session ID', async () => {
      const mockEvents = [{ eventId: 'event-1' }, { eventId: 'event-2' }];

      mockRequest.params = { sessionId: 'session-1' };
      (eventService.getBySessionId as jest.Mock).mockResolvedValue(mockEvents);

      await eventController.getBySessionId(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(eventService.getBySessionId).toHaveBeenCalledWith('session-1');
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });

  describe('getStats', () => {
    it('should get event statistics', async () => {
      const mockStats = {
        totalEvents: 100,
        eventsByType: { PAGE_VIEW: 50, CLICK: 30, PURCHASE: 20 },
      };

      mockRequest.query = {};
      (eventService.getStats as jest.Mock).mockResolvedValue(mockStats);

      await eventController.getStats(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(eventService.getStats).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });

    it('should handle date range parameters', async () => {
      const mockStats = { totalEvents: 50, eventsByType: {} };

      mockRequest.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      (eventService.getStats as jest.Mock).mockResolvedValue(mockStats);

      await eventController.getStats(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(eventService.getStats).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
    });
  });

  describe('getDailyStats', () => {
    it('should get daily statistics', async () => {
      const mockStats = [
        { date: '2024-01-01', count: 100 },
        { date: '2024-01-02', count: 150 },
      ];

      mockRequest.query = { days: '7' };
      (eventService.getDailyStats as jest.Mock).mockResolvedValue(mockStats);

      await eventController.getDailyStats(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(eventService.getDailyStats).toHaveBeenCalledWith(7);
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should use default days if not provided', async () => {
      const mockStats: any[] = [];

      mockRequest.query = {};
      (eventService.getDailyStats as jest.Mock).mockResolvedValue(mockStats);

      await eventController.getDailyStats(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(eventService.getDailyStats).toHaveBeenCalledWith(30);
    });
  });

  describe('getPageViewStats', () => {
    it('should get page view statistics', async () => {
      const mockStats = [
        { page: '/home', views: 100 },
        { page: '/products', views: 80 },
      ];

      mockRequest.query = { limit: '10' };
      (eventService.getPageViewStats as jest.Mock).mockResolvedValue(mockStats);

      await eventController.getPageViewStats(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(eventService.getPageViewStats).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });

  describe('getEventTypes', () => {
    it('should return all event types', async () => {
      await eventController.getEventTypes(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: Object.values(EventType),
      });
    });
  });
});
