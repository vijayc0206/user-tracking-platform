import { api } from './api';
import {
  AdminUser,
  AuthResponse,
  AuthTokens,
  LoginCredentials,
  RegisterData,
} from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    this.setAuthData(response);
    return response;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    this.setAuthData(response);
    return response;
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    return api.post<AuthTokens>('/auth/refresh', { refreshToken });
  },

  async getProfile(): Promise<AdminUser> {
    return api.get<AdminUser>('/auth/profile');
  },

  async updateProfile(data: Partial<AdminUser>): Promise<AdminUser> {
    return api.put<AdminUser>('/auth/profile', data);
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getStoredUser(): AdminUser | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },

  setAuthData(response: AuthResponse): void {
    localStorage.setItem('accessToken', response.tokens.accessToken);
    localStorage.setItem('refreshToken', response.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
  },
};
