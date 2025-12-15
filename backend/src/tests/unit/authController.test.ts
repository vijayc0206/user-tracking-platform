import { Request, Response } from 'express';
import { authController } from '../../controllers/authController.js';
import { authService } from '../../services/authService.js';
import { UserRole } from '../../types/index.js';
import { StatusCodes } from 'http-status-codes';

// Mock the authService
jest.mock('../../services/authService.js', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    getAllUsers: jest.fn(),
    updateRole: jest.fn(),
    deactivateUser: jest.fn(),
    activateUser: jest.fn(),
  },
}));

describe('AuthController', () => {
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

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      const mockResult = {
        user: { id: '1', ...registerData },
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      mockRequest.body = registerData;
      (authService.register as jest.Mock).mockResolvedValue(mockResult);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(authService.register).toHaveBeenCalledWith(registerData);
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should validate email format', async () => {
      mockRequest.body = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const mockNext = jest.fn();
      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Validation error should be passed to next middleware
      expect(mockNext).toHaveBeenCalled();
    });

    it('should require minimum password length', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'short',
        firstName: 'Test',
        lastName: 'User',
      };

      const mockNext = jest.fn();
      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockResult = {
        user: { id: '1', email: loginData.email },
        accessToken: 'token',
        refreshToken: 'refresh',
      };

      mockRequest.body = loginData;
      (authService.login as jest.Mock).mockResolvedValue(mockResult);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(authService.login).toHaveBeenCalledWith(loginData);
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should validate email format on login', async () => {
      mockRequest.body = {
        email: 'invalid-email',
        password: 'password123',
      };

      const mockNext = jest.fn();
      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockTokens = {
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      };

      mockRequest.body = { refreshToken: 'old-refresh-token' };
      (authService.refreshToken as jest.Mock).mockResolvedValue(mockTokens);

      await authController.refreshToken(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(authService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should require refresh token', async () => {
      mockRequest.body = {};

      const mockNext = jest.fn();
      await authController.refreshToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      (mockRequest as any).user = { id: '1' };
      (authService.getProfile as jest.Mock).mockResolvedValue(mockUser);

      await authController.getProfile(
        mockRequest as any,
        mockResponse as Response,
        jest.fn()
      );

      expect(authService.getProfile).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updateData = { firstName: 'Updated' };
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Updated',
        lastName: 'User',
      };

      (mockRequest as any).user = { id: '1' };
      mockRequest.body = updateData;
      (authService.updateProfile as jest.Mock).mockResolvedValue(mockUser);

      await authController.updateProfile(
        mockRequest as any,
        mockResponse as Response,
        jest.fn()
      );

      expect(authService.updateProfile).toHaveBeenCalledWith('1', updateData);
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      };

      (mockRequest as any).user = { id: '1' };
      mockRequest.body = passwordData;
      (authService.changePassword as jest.Mock).mockResolvedValue(undefined);

      await authController.changePassword(
        mockRequest as any,
        mockResponse as Response,
        jest.fn()
      );

      expect(authService.changePassword).toHaveBeenCalledWith(
        '1',
        'oldpassword123',
        'newpassword123'
      );
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should require minimum new password length', async () => {
      mockRequest.body = {
        currentPassword: 'oldpassword',
        newPassword: 'short',
      };
      (mockRequest as any).user = { id: '1' };

      const mockNext = jest.fn();
      await authController.changePassword(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com' },
        { id: '2', email: 'user2@example.com' },
      ];

      (authService.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

      await authController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(authService.getAllUsers).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
      });
    });
  });

  describe('updateRole', () => {
    it('should update user role successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: UserRole.ADMIN,
      };

      mockRequest.params = { userId: '1' };
      mockRequest.body = { role: UserRole.ADMIN };
      (authService.updateRole as jest.Mock).mockResolvedValue(mockUser);

      await authController.updateRole(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(authService.updateRole).toHaveBeenCalledWith('1', UserRole.ADMIN);
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
    });

    it('should validate role enum', async () => {
      mockRequest.params = { userId: '1' };
      mockRequest.body = { role: 'INVALID_ROLE' };

      const mockNext = jest.fn();
      await authController.updateRole(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      mockRequest.params = { userId: '1' };
      (authService.deactivateUser as jest.Mock).mockResolvedValue(undefined);

      await authController.deactivateUser(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(authService.deactivateUser).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { message: 'User deactivated successfully' },
      });
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      mockRequest.params = { userId: '1' };
      (authService.activateUser as jest.Mock).mockResolvedValue(undefined);

      await authController.activateUser(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      expect(authService.activateUser).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { message: 'User activated successfully' },
      });
    });
  });
});
