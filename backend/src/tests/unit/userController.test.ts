import { Request, Response } from 'express';
import { userController } from '../../controllers/userController.js';
import { userService } from '../../services/userService.js';
import { StatusCodes } from 'http-status-codes';

// Mock the userService
jest.mock('../../services/userService.js', () => ({
  userService: {
    search: jest.fn(),
    findByVisitorId: jest.fn(),
    update: jest.fn(),
    addTags: jest.fn(),
    removeTags: jest.fn(),
    addToSegments: jest.fn(),
    getStats: jest.fn(),
    getTopUsers: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock eventService for getJourney
jest.mock('../../services/eventService.js', () => ({
  eventService: {
    getUserJourney: jest.fn(),
  },
}));

describe('UserController', () => {
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

  describe('search', () => {
    it('should search users with pagination', async () => {
      const mockResult = {
        users: [{ visitorId: 'user-1' }, { visitorId: 'user-2' }],
        total: 10,
        pages: 5,
      };

      mockRequest.query = { page: '1', limit: '2' };
      (userService.search as jest.Mock).mockResolvedValue(mockResult);

      await userController.search(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(userService.search).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult.users,
        meta: {
          page: 1,
          limit: 2,
          total: 10,
          totalPages: 5,
        },
      });
    });

    it('should filter by search term', async () => {
      const mockResult = { users: [], total: 0, pages: 0 };

      mockRequest.query = { search: 'test' };
      (userService.search as jest.Mock).mockResolvedValue(mockResult);

      await userController.search(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(userService.search).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'test' })
      );
    });

    it('should filter by tags', async () => {
      const mockResult = { users: [], total: 0, pages: 0 };

      mockRequest.query = { tags: 'premium,active' };
      (userService.search as jest.Mock).mockResolvedValue(mockResult);

      await userController.search(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(userService.search).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['premium', 'active'] })
      );
    });

    it('should filter by segments', async () => {
      const mockResult = { users: [], total: 0, pages: 0 };

      mockRequest.query = { segments: 'new,returning' };
      (userService.search as jest.Mock).mockResolvedValue(mockResult);

      await userController.search(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(userService.search).toHaveBeenCalledWith(
        expect.objectContaining({ segments: ['new', 'returning'] })
      );
    });

    it('should filter by event count range', async () => {
      const mockResult = { users: [], total: 0, pages: 0 };

      mockRequest.query = { minEvents: '10', maxEvents: '100' };
      (userService.search as jest.Mock).mockResolvedValue(mockResult);

      await userController.search(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(userService.search).toHaveBeenCalledWith(
        expect.objectContaining({ minEvents: 10, maxEvents: 100 })
      );
    });
  });

  describe('getByVisitorId', () => {
    it('should get user by visitor ID', async () => {
      const mockUser = {
        visitorId: 'user-1',
        email: 'user@example.com',
        totalEvents: 50,
      };

      mockRequest.params = { visitorId: 'user-1' };
      (userService.findByVisitorId as jest.Mock).mockResolvedValue(mockUser);

      await userController.getByVisitorId(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(userService.findByVisitorId).toHaveBeenCalledWith('user-1');
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });

    it('should return 404 if user not found', async () => {
      mockRequest.params = { visitorId: 'non-existent' };
      (userService.findByVisitorId as jest.Mock).mockResolvedValue(null);

      await userController.getByVisitorId(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateData = {
        email: 'updated@example.com',
        firstName: 'Updated',
      };
      const mockUser = { visitorId: 'user-1', ...updateData };

      mockRequest.params = { visitorId: 'user-1' };
      mockRequest.body = updateData;
      (userService.update as jest.Mock).mockResolvedValue(mockUser);

      await userController.update(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(userService.update).toHaveBeenCalledWith('user-1', updateData);
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should validate email format', async () => {
      mockRequest.params = { visitorId: 'user-1' };
      mockRequest.body = { email: 'invalid-email' };

      const mockNext = jest.fn();
      await userController.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('addTags', () => {
    it('should add tags to user', async () => {
      const mockUser = {
        visitorId: 'user-1',
        tags: ['premium', 'vip'],
      };

      mockRequest.params = { visitorId: 'user-1' };
      mockRequest.body = { tags: ['premium', 'vip'] };
      (userService.addTags as jest.Mock).mockResolvedValue(mockUser);

      await userController.addTags(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(userService.addTags).toHaveBeenCalledWith('user-1', ['premium', 'vip']);
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should validate tags array', async () => {
      mockRequest.params = { visitorId: 'user-1' };
      mockRequest.body = { tags: 'not-an-array' };

      const mockNext = jest.fn();
      await userController.addTags(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject empty tag strings', async () => {
      mockRequest.params = { visitorId: 'user-1' };
      mockRequest.body = { tags: ['valid', ''] };

      const mockNext = jest.fn();
      await userController.addTags(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('removeTags', () => {
    it('should remove tags from user', async () => {
      const mockUser = {
        visitorId: 'user-1',
        tags: [],
      };

      mockRequest.params = { visitorId: 'user-1' };
      mockRequest.body = { tags: ['premium'] };
      (userService.removeTags as jest.Mock).mockResolvedValue(mockUser);

      await userController.removeTags(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(userService.removeTags).toHaveBeenCalledWith('user-1', ['premium']);
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });

  describe('addToSegments', () => {
    it('should add user to segments', async () => {
      const mockUser = {
        visitorId: 'user-1',
        segments: ['high-value', 'returning'],
      };

      mockRequest.params = { visitorId: 'user-1' };
      mockRequest.body = { segments: ['high-value', 'returning'] };
      (userService.addToSegments as jest.Mock).mockResolvedValue(mockUser);

      await userController.addToSegments(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(userService.addToSegments).toHaveBeenCalledWith('user-1', [
        'high-value',
        'returning',
      ]);
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should validate segments array', async () => {
      mockRequest.params = { visitorId: 'user-1' };
      mockRequest.body = { segments: 'not-an-array' };

      const mockNext = jest.fn();
      await userController.addToSegments(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should get user statistics', async () => {
      const mockStats = {
        totalUsers: 1000,
        activeUsers: 500,
        newUsersToday: 50,
      };

      (userService.getStats as jest.Mock).mockResolvedValue(mockStats);

      await userController.getStats(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(userService.getStats).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });
  });

  describe('getTopUsers', () => {
    it('should get top users by events', async () => {
      const mockUsers = [
        { visitorId: 'user-1', totalEvents: 100 },
        { visitorId: 'user-2', totalEvents: 80 },
      ];

      mockRequest.query = { limit: '5' };
      (userService.getTopUsers as jest.Mock).mockResolvedValue(mockUsers);

      await userController.getTopUsers(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(userService.getTopUsers).toHaveBeenCalledWith(5);
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should use default limit if not provided', async () => {
      const mockUsers: any[] = [];

      mockRequest.query = {};
      (userService.getTopUsers as jest.Mock).mockResolvedValue(mockUsers);

      await userController.getTopUsers(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(userService.getTopUsers).toHaveBeenCalledWith(10);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      mockRequest.params = { visitorId: 'user-1' };
      (userService.delete as jest.Mock).mockResolvedValue(undefined);

      await userController.delete(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(userService.delete).toHaveBeenCalledWith('user-1');
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { message: 'User deleted successfully' },
      });
    });
  });
});
