import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../../services/adminService';
import { api } from '../../services/api';

// Mock the api module
vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should get all admin users', async () => {
      const mockUsers = [
        { id: '1', email: 'admin@test.com', role: 'ADMIN' },
        { id: '2', email: 'analyst@test.com', role: 'ANALYST' },
      ];
      vi.mocked(api.get).mockResolvedValue(mockUsers);

      const result = await adminService.getAllUsers();

      expect(api.get).toHaveBeenCalledWith('/auth/users');
      expect(result).toEqual(mockUsers);
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      const mockUpdatedUser = { id: '1', email: 'test@test.com', role: 'ADMIN' };
      vi.mocked(api.put).mockResolvedValue(mockUpdatedUser);

      const result = await adminService.updateRole('1', 'ADMIN');

      expect(api.put).toHaveBeenCalledWith('/auth/users/1/role', { role: 'ADMIN' });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should update to ANALYST role', async () => {
      const mockUpdatedUser = { id: '2', email: 'test@test.com', role: 'ANALYST' };
      vi.mocked(api.put).mockResolvedValue(mockUpdatedUser);

      const result = await adminService.updateRole('2', 'ANALYST');

      expect(api.put).toHaveBeenCalledWith('/auth/users/2/role', { role: 'ANALYST' });
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user', async () => {
      const mockDeactivatedUser = { id: '1', isActive: false };
      vi.mocked(api.post).mockResolvedValue(mockDeactivatedUser);

      const result = await adminService.deactivateUser('1');

      expect(api.post).toHaveBeenCalledWith('/auth/users/1/deactivate');
      expect(result).toEqual(mockDeactivatedUser);
    });
  });

  describe('activateUser', () => {
    it('should activate user', async () => {
      const mockActivatedUser = { id: '1', isActive: true };
      vi.mocked(api.post).mockResolvedValue(mockActivatedUser);

      const result = await adminService.activateUser('1');

      expect(api.post).toHaveBeenCalledWith('/auth/users/1/activate');
      expect(result).toEqual(mockActivatedUser);
    });
  });
});
