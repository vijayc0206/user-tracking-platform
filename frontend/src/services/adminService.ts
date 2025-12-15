import { api } from './api';
import { AdminUser, UserRole } from '../types';

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
}

export const adminService = {
  async getAllUsers(): Promise<AdminUser[]> {
    return api.get<AdminUser[]>('/auth/users');
  },

  async updateRole(userId: string, role: UserRole): Promise<AdminUser> {
    return api.put<AdminUser>(`/auth/users/${userId}/role`, { role });
  },

  async deactivateUser(userId: string): Promise<AdminUser> {
    return api.post<AdminUser>(`/auth/users/${userId}/deactivate`);
  },

  async activateUser(userId: string): Promise<AdminUser> {
    return api.post<AdminUser>(`/auth/users/${userId}/activate`);
  },
};
