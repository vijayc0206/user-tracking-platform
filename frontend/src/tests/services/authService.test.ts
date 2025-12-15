import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services/authService';

// Mock the api module
vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import { api } from '../../services/api';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('should call api.post with credentials and store auth data', async () => {
      const mockResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'ANALYST',
          isActive: true,
        },
        tokens: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const credentials = { email: 'test@example.com', password: 'password123' };
      const result = await authService.login(credentials);

      expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse);
      expect(localStorage.getItem('accessToken')).toBe('access-token-123');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token-456');
    });
  });

  describe('register', () => {
    it('should call api.post with registration data', async () => {
      const mockResponse = {
        user: {
          id: '1',
          email: 'new@example.com',
          firstName: 'New',
          lastName: 'User',
          role: 'ANALYST',
          isActive: true,
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      const result = await authService.register(registerData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('should remove auth data from localStorage', () => {
      localStorage.setItem('accessToken', 'token');
      localStorage.setItem('refreshToken', 'refresh');
      localStorage.setItem('user', JSON.stringify({ id: '1' }));

      authService.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('getStoredUser', () => {
    it('should return null if no user in localStorage', () => {
      const result = authService.getStoredUser();
      expect(result).toBeNull();
    });

    it('should return parsed user from localStorage', () => {
      const user = { id: '1', email: 'test@example.com' };
      localStorage.setItem('user', JSON.stringify(user));

      const result = authService.getStoredUser();
      expect(result).toEqual(user);
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('user', 'invalid-json');
      const result = authService.getStoredUser();
      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false if no access token', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true if access token exists', () => {
      localStorage.setItem('accessToken', 'token');
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('getProfile', () => {
    it('should call api.get for profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ANALYST',
        isActive: true,
      };

      vi.mocked(api.get).mockResolvedValue(mockUser);

      const result = await authService.getProfile();

      expect(api.get).toHaveBeenCalledWith('/auth/profile');
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should call api.put with profile data', async () => {
      const mockUpdatedUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Updated',
        lastName: 'User',
        role: 'ANALYST',
        isActive: true,
      };

      vi.mocked(api.put).mockResolvedValue(mockUpdatedUser);

      const updateData = { firstName: 'Updated' };
      const result = await authService.updateProfile(updateData);

      expect(api.put).toHaveBeenCalledWith('/auth/profile', updateData);
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('changePassword', () => {
    it('should call api.post with password data', async () => {
      vi.mocked(api.post).mockResolvedValue(undefined);

      await authService.changePassword('oldPassword', 'newPassword');

      expect(api.post).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword',
      });
    });
  });

  describe('refreshToken', () => {
    it('should call api.post with refresh token', async () => {
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      vi.mocked(api.post).mockResolvedValue(mockTokens);

      const result = await authService.refreshToken('old-refresh-token');

      expect(api.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'old-refresh-token',
      });
      expect(result).toEqual(mockTokens);
    });
  });
});
